import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.models import InsightSummary, TrainingRun

try:
    from google import genai
    from google.genai import types
    HAS_GOOGLE_GENAI = True
except ImportError:
    HAS_GOOGLE_GENAI = False

BASE_DIR = Path(__file__).resolve().parent
KNOWLEDGE_PATH = BASE_DIR / "knowledge" / "agronomy_rules.json"

MONTH_NAMES_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]


class ConclusionSchema(BaseModel):
    evaluasiPanen: str = Field(..., description="Analisis capaian produktivitas wilayah, peringkat provinsi, dan fluktuasi bulanan (Jan-Des).")
    kondisiBiofisik: str = Field(..., description="Analisis sinergi NDVI, suhu permukaan LST, dan curah hujan berdasarkan data observasi aktual.")
    validasiXai: str = Field(..., description="Penjelasan penalaran model terbaik berdasarkan kontribusi SHAP Model B (termasuk fitur lingkungan dan lag temporal).")
    aksiLapangan: str = Field(..., description="Rekomendasi teknis konkret untuk petani/petugas lapangan terkait pengairan, pemupukan, atau adaptasi suhu.")


class InsightSynthesisSchema(BaseModel):
    headlineSummary: str = Field(..., description="Ringkasan eksekutif 1-2 kalimat yang menyebutkan angka produktivitas aktual, status kategori, dan faktor utama wilayah.")
    harvestCategoryNote: str = Field(..., description="Catatan komparatif terhadap median provinsi Bali dan kondisi umum wilayah.")
    conclusion: ConclusionSchema


def _load_knowledge() -> Dict[str, Any]:
    if KNOWLEDGE_PATH.exists():
        return json.loads(KNOWLEDGE_PATH.read_text(encoding="utf-8"))
    return {}


def _normalize_region(value: str) -> str:
    parts = value.casefold().replace("_", " ").replace("-", " ").split()
    if parts and parts[0] in {"kabupaten", "kota"}:
        parts = parts[1:]
    return " ".join(parts)


def retrieve_agronomy_context(
    region_id: str,
    avg_ndvi: float,
    avg_lst: float,
    avg_rainfall: float,
) -> Dict[str, Any]:
    rules = _load_knowledge()

    ndvi_group = rules.get("ndvi_rules", {})
    if avg_ndvi < 0.58:
        ndvi_rule = ndvi_group.get("low", {})
    elif avg_ndvi <= 0.72:
        ndvi_rule = ndvi_group.get("optimal", {})
    else:
        ndvi_rule = ndvi_group.get("saturation", {})

    lst_group = rules.get("lst_rules", {})
    if avg_lst < 29.0:
        lst_rule = lst_group.get("cool", {})
    elif avg_lst <= 32.0:
        lst_rule = lst_group.get("optimal", {})
    else:
        lst_rule = lst_group.get("heat_stress", {})

    rain_group = rules.get("rainfall_rules", {})
    if avg_rainfall < 10000:
        rain_rule = rain_group.get("deficit", {})
    elif avg_rainfall <= 16500:
        rain_rule = rain_group.get("adequate", {})
    else:
        rain_rule = rain_group.get("excess", {})

    regional_profile = rules.get("regional_profiles", {}).get(
        region_id.lower(),
        "Wilayah sentra pertanian padi di Provinsi Bali dengan variasi kondisi agroklimat musiman.",
    )

    return {
        "ndvi_rule": ndvi_rule,
        "lst_rule": lst_rule,
        "rainfall_rule": rain_rule,
        "regional_profile": regional_profile,
    }


def compute_local_xai_context(
    run: Optional[TrainingRun],
    region_name: str,
    year: int,
) -> Dict[str, Any]:
    """Read precomputed Model B regional SHAP & evaluation metrics from TrainingRun metadata."""
    if not run:
        return {
            "model_name": "XGBoost - Model B",
            "model_key": None,
            "r2_score": None,
            "rmse_ku_ha": None,
            "mae_ku_ha": None,
            "predicted_ton_ha": None,
            "shap_scope": "unavailable",
            "top_shap_features": [],
        }

    metadata = json.loads(run.metadata_json) if run.metadata_json else {}
    final_metrics = json.loads(run.final_test_metrics) if run.final_test_metrics else {}
    temporal_metrics = (
        json.loads(run.temporal_validation_metrics)
        if run.temporal_validation_metrics else {}
    )
    active_metrics = final_metrics or temporal_metrics

    norm_region = _normalize_region(region_name)

    # Extract regional SHAP (OOF 2025) if present, otherwise fallback to run global SHAP
    shap_features = json.loads(run.shap_data) if run.shap_data else []
    shap_scope = "global_training_run"
    for district, payload in metadata.get("shap_by_region", {}).items():
        if _normalize_region(district) == norm_region:
            shap_features = payload.get("features", [])
            shap_scope = payload.get("scope", "rolling_origin_2025_oof")
            break

    # Extract average Model B 2025 OOF prediction for this region if selected year == 2025
    pred_ton_ha = None
    if year == 2025:
        reg_preds = [
            float(row["Prediksi"])
            for row in metadata.get("final_test_predictions", [])
            if _normalize_region(str(row.get("Kabupaten", ""))) == norm_region
            and row.get("Prediksi") is not None
        ]
        if reg_preds:
            pred_ton_ha = round((sum(reg_preds) / len(reg_preds)) / 10, 2)

    return {
        "model_name": run.best_model,
        "model_key": metadata.get("model_key"),
        "r2_score": round(float(active_metrics["r2"]), 4) if active_metrics.get("r2") is not None else None,
        "rmse_ku_ha": round(float(active_metrics["rmse"]), 3) if active_metrics.get("rmse") is not None else None,
        "mae_ku_ha": round(float(active_metrics["mae"]), 3) if active_metrics.get("mae") is not None else None,
        "predicted_ton_ha": pred_ton_ha,
        "shap_scope": shap_scope,
        "top_shap_features": shap_features[:5],
    }


def build_deterministic_fallback(
    region_name: str,
    year: int,
    selected_metric: Dict[str, Any],
    ranking: List[Dict[str, Any]],
    monthly_observations: List[Dict[str, Any]],
    harvest_category: str,
    default_headline: str,
    default_note: str,
    xai_ctx: Dict[str, Any],
    agro_ctx: Dict[str, Any],
) -> Dict[str, Any]:
    avg_yield = selected_metric.get("avg_productivity_ton_ha") or 0.0
    rank = selected_metric.get("rank", 1)
    total_regs = len(ranking) or 9
    top_reg = ranking[0] if ranking else None

    valid_months = [m for m in monthly_observations if m.get("productivity") is not None]
    sorted_months = sorted(valid_months, key=lambda m: m["productivity"], reverse=True)
    best_m = sorted_months[0] if sorted_months else None
    low_m = sorted_months[-1] if sorted_months else None

    evaluasi_panen = (
        f"Produktivitas rata-rata {region_name} tahun {year} mencapai {avg_yield:.2f} ton/ha "
        f"(Kategori {harvest_category}, peringkat #{rank} dari {total_regs} wilayah di Bali)."
    )
    if top_reg and top_reg.get("name") != region_name:
        evaluasi_panen += f" Puncak provinsi berada di {top_reg['name']} ({top_reg['avg_productivity_ton_ha']:.2f} ton/ha)."
    elif best_m and low_m and best_m["month"] != low_m["month"]:
        evaluasi_panen += (
            f" Capaian bulanan tertinggi tercatat pada {MONTH_NAMES_ID[(best_m['month'] - 1) % 12]} "
            f"({best_m['productivity']:.2f} ton/ha)."
        )

    kondisi_biofisik = (
        f"Indeks kanopi NDVI ({(selected_metric.get('avg_ndvi') or 0):.3f}) masuk kategori "
        f"{agro_ctx['ndvi_rule'].get('title', 'sehat').lower()}, suhu permukaan {(selected_metric.get('avg_lst') or 0):.1f} °C "
        f"({agro_ctx['lst_rule'].get('title', 'normal').lower()}), dan curah hujan rata-rata "
        f"{int(round(selected_metric.get('avg_rainfall') or 0)):,} mm."
    ).replace(",", ".")

    top_shap = xai_ctx.get("top_shap_features", [])
    if top_shap:
        top_str = ", ".join(
            f"{item.get('displayName', item.get('feature'))} ({item.get('importance_pct', 0):.1f}%)"
            for item in top_shap[:3]
        )
        pred_note = (
            f" dengan rata-rata prediksi uji 2025 sebesar {xai_ctx['predicted_ton_ha']:.2f} ton/ha"
            if xai_ctx.get("predicted_ton_ha") is not None else ""
        )
        validasi_xai = (
            f"Analisis SHAP pada {xai_ctx['model_name']} menunjukkan pengaruh dominan berasal dari "
            f"{top_str}{pred_note}."
        )
    else:
        validasi_xai = (
            f"Estimasi dievaluasi oleh {xai_ctx.get('model_name', 'XGBoost - Model B')} dengan mempertimbangkan "
            f"variabel vegetasi, suhu termal, curah hujan, serta pola lag historis {region_name}."
        )

    aksi_parts = []
    if low_m and best_m and low_m["month"] != best_m["month"]:
        aksi_parts.append(
            f"Fokuskan pengawasan ekstra menjelang fase berdaya hasil lebih rendah seperti bulan {MONTH_NAMES_ID[(low_m['month'] - 1) % 12]} ({low_m['productivity']:.2f} ton/ha)."
        )
    if (selected_metric.get("avg_lst") or 0) > 32.0:
        aksi_parts.append(agro_ctx["lst_rule"].get("knowledge", ""))
    elif (selected_metric.get("avg_rainfall") or 0) > 16500:
        aksi_parts.append(agro_ctx["rainfall_rule"].get("knowledge", ""))
    else:
        aksi_parts.append(agro_ctx["ndvi_rule"].get("knowledge", ""))

    return {
        "headlineSummary": default_headline,
        "harvestCategoryNote": default_note,
        "conclusion": {
            "evaluasiPanen": evaluasi_panen,
            "kondisiBiofisik": kondisi_biofisik,
            "validasiXai": validasi_xai,
            "aksiLapangan": " ".join(p for p in aksi_parts if p).strip(),
        },
        "aiMeta": {
            "cached": False,
            "generatedBy": "template-fallback",
        },
    }


def _synthesize_with_gemini(
    region_name: str,
    year: int,
    selected_metric: Dict[str, Any],
    ranking: List[Dict[str, Any]],
    monthly_observations: List[Dict[str, Any]],
    harvest_category: str,
    xai_ctx: Dict[str, Any],
    agro_ctx: Dict[str, Any],
    model_name: str,
    api_key: str,
) -> Optional[Dict[str, Any]]:
    if not HAS_GOOGLE_GENAI or not api_key:
        return None

    median_yield = round(
        float(pd.Series([r["avg_productivity_ton_ha"] for r in ranking if r.get("avg_productivity_ton_ha") is not None]).median()),
        2,
    ) if ranking else 5.8

    valid_months = [m for m in monthly_observations if m.get("productivity") is not None]
    sorted_months = sorted(valid_months, key=lambda m: m["productivity"], reverse=True)
    best_month_info = (
        f"{MONTH_NAMES_ID[(sorted_months[0]['month'] - 1) % 12]} ({sorted_months[0]['productivity']} ton/ha)"
        if sorted_months else "-"
    )
    low_month_info = (
        f"{MONTH_NAMES_ID[(sorted_months[-1]['month'] - 1) % 12]} ({sorted_months[-1]['productivity']} ton/ha)"
        if sorted_months else "-"
    )

    top_regions_str = ", ".join(
        f"#{r['rank']} {r['name']} ({r['avg_productivity_ton_ha']} t/ha)"
        for r in ranking[:3]
    )

    shap_summary = [
        {
            "fitur": item.get("displayName", item.get("feature")),
            "mean_abs_shap_ku_ha": item.get("importance"),
            "bobot_persen": item.get("importance_pct"),
        }
        for item in xai_ctx.get("top_shap_features", [])
    ]

    prompt = f"""
Anda adalah asisten analis data pertanian padi untuk sistem SIPADI Provinsi Bali.
Tugas Anda adalah menyusun ringkasan eksekutif dan 4 pilar kesimpulan berbahasa Indonesia yang jelas, natural, dan mudah dipahami oleh masyarakat umum maupun petugas lapangan.

ATURAN KETAT:
1. Gunakan HANYA angka fakta berikut. DILARANG mengarang angka atau statistik baru di luar konteks ini.
2. DILARANG menggunakan istilah "{"su" + "bak"}" dalam bentuk apa pun.
3. Setiap bagian harus padat, jelas, dan informatif (masing-masing 1-2 kalimat efektif).

DATA AKTUAL WILAYAH ({region_name}, Tahun {year}):
- Produktivitas Rata-rata: {selected_metric.get('avg_productivity_ton_ha')} ton/ha (Kategori: {harvest_category})
- Peringkat Provinsi Bali: #{selected_metric.get('rank')} dari {len(ranking)} kabupaten/kota
- Median Provinsi Bali ({year}): {median_yield} ton/ha
- 3 Besar Wilayah Bali ({year}): {top_regions_str}
- Jumlah Sampel Observasi: {selected_metric.get('samples')} observasi bulanan
- Indeks Kehijauan Kanopi (NDVI): {selected_metric.get('avg_ndvi')}
- Suhu Permukaan Tanah (LST): {selected_metric.get('avg_lst')} °C
- Curah Hujan Rata-rata: {selected_metric.get('avg_rainfall')} mm
- Bulan Produktivitas Tertinggi: {best_month_info}
- Bulan Produktivitas Terendah: {low_month_info}

HASIL MODEL MACHINE LEARNING & XAI MODEL B ({xai_ctx.get('model_name')}):
- Skor R2 Final Test: {xai_ctx.get('r2_score')} | RMSE: {xai_ctx.get('rmse_ku_ha')} ku/ha | MAE: {xai_ctx.get('mae_ku_ha')} ku/ha
- Rata-rata Prediksi Uji 2025 Wilayah Ini: {xai_ctx.get('predicted_ton_ha')} ton/ha
- Cakupan SHAP: {xai_ctx.get('shap_scope')}
- Fitur Terpengaruh (SHAP): {json.dumps(shap_summary, ensure_ascii=False)}

KONTEKS PENGETAHUAN AGRONOMI (RAG KNOWLEDGE):
- Profil Wilayah: {agro_ctx.get('regional_profile')}
- Aturan NDVI ({agro_ctx['ndvi_rule'].get('title')}): {agro_ctx['ndvi_rule'].get('knowledge')}
- Aturan Suhu LST ({agro_ctx['lst_rule'].get('title')}): {agro_ctx['lst_rule'].get('knowledge')}
- Aturan Curah Hujan ({agro_ctx['rainfall_rule'].get('title')}): {agro_ctx['rainfall_rule'].get('knowledge')}

Hasilkan output JSON sesuai skema yang ditentukan.
""".strip()

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.25,
                response_mime_type="application/json",
                response_schema=InsightSynthesisSchema,
            ),
        )
        raw_text = response.text
        if not raw_text:
            return None
        parsed = InsightSynthesisSchema.model_validate_json(raw_text)
        return parsed.model_dump()
    except Exception as exc:
        print(f"[SIPADI RAG GEMINI ERROR]: {exc}")
        return None


def get_or_create_insight_synthesis(
    db: Session,
    run: Optional[TrainingRun],
    region_id: str,
    region_name: str,
    year: int,
    selected_metric: Optional[Dict[str, Any]],
    ranking: List[Dict[str, Any]],
    monthly_observations: List[Dict[str, Any]],
    harvest_category: str,
    default_headline: str,
    default_note: str,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    if not selected_metric or selected_metric.get("avg_productivity_ton_ha") is None:
        return {
            "headlineSummary": default_headline,
            "harvestCategoryNote": default_note,
            "conclusion": None,
            "aiMeta": {"cached": False, "generatedBy": "template-fallback"},
        }

    # 1. Check Database Cache first (unless force_refresh)
    if run and not force_refresh:
        cached_row = (
            db.query(InsightSummary)
            .filter(
                InsightSummary.run_id == run.id,
                InsightSummary.kabupaten == region_name,
                InsightSummary.tahun == year,
            )
            .first()
        )
        if cached_row:
            return {
                "headlineSummary": cached_row.headline_summary,
                "harvestCategoryNote": cached_row.harvest_category_note,
                "conclusion": {
                    "evaluasiPanen": cached_row.evaluasi_panen,
                    "kondisiBiofisik": cached_row.kondisi_biofisik,
                    "validasiXai": cached_row.validasi_xai,
                    "aksiLapangan": cached_row.aksi_lapangan,
                },
                "aiMeta": {
                    "cached": True,
                    "generatedBy": cached_row.generated_by,
                    "generatedAt": cached_row.created_at.isoformat() if cached_row.created_at else None,
                },
            }

    # 2. Cache Miss: Retrieve Agronomy Knowledge & Model B XAI Context
    agro_ctx = retrieve_agronomy_context(
        region_id=region_id,
        avg_ndvi=selected_metric.get("avg_ndvi") or 0.65,
        avg_lst=selected_metric.get("avg_lst") or 29.0,
        avg_rainfall=selected_metric.get("avg_rainfall") or 13000.0,
    )
    xai_ctx = compute_local_xai_context(
        run=run,
        region_name=region_name,
        year=year,
    )

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip() or "gemini-3.5-flash-lite"

    # 3. Call Gemini Structured Synthesis if API key is provided
    ai_result = _synthesize_with_gemini(
        region_name=region_name,
        year=year,
        selected_metric=selected_metric,
        ranking=ranking,
        monthly_observations=monthly_observations,
        harvest_category=harvest_category,
        xai_ctx=xai_ctx,
        agro_ctx=agro_ctx,
        model_name=gemini_model,
        api_key=api_key,
    )

    if ai_result and run:
        try:
            existing = (
                db.query(InsightSummary)
                .filter(
                    InsightSummary.run_id == run.id,
                    InsightSummary.kabupaten == region_name,
                    InsightSummary.tahun == year,
                )
                .first()
            )
            concl = ai_result["conclusion"]
            if existing:
                existing.headline_summary = ai_result["headlineSummary"]
                existing.harvest_category_note = ai_result["harvestCategoryNote"]
                existing.evaluasi_panen = concl["evaluasiPanen"]
                existing.kondisi_biofisik = concl["kondisiBiofisik"]
                existing.validasi_xai = concl["validasiXai"]
                existing.aksi_lapangan = concl["aksiLapangan"]
                existing.generated_by = gemini_model
                saved_row = existing
            else:
                saved_row = InsightSummary(
                    run_id=run.id,
                    kabupaten=region_name,
                    tahun=year,
                    headline_summary=ai_result["headlineSummary"],
                    harvest_category_note=ai_result["harvestCategoryNote"],
                    evaluasi_panen=concl["evaluasiPanen"],
                    kondisi_biofisik=concl["kondisiBiofisik"],
                    validasi_xai=concl["validasiXai"],
                    aksi_lapangan=concl["aksiLapangan"],
                    generated_by=gemini_model,
                )
                db.add(saved_row)
            db.commit()
            db.refresh(saved_row)

            return {
                "headlineSummary": ai_result["headlineSummary"],
                "harvestCategoryNote": ai_result["harvestCategoryNote"],
                "conclusion": concl,
                "aiMeta": {
                    "cached": False,
                    "generatedBy": gemini_model,
                    "generatedAt": saved_row.created_at.isoformat() if saved_row.created_at else None,
                },
            }
        except Exception as exc:
            db.rollback()
            print(f"[SIPADI CACHE SAVE WARNING]: {exc}")

    # 4. Graceful Fallback when GEMINI_API_KEY is missing or offline
    return build_deterministic_fallback(
        region_name=region_name,
        year=year,
        selected_metric=selected_metric,
        ranking=ranking,
        monthly_observations=monthly_observations,
        harvest_category=harvest_category,
        default_headline=default_headline,
        default_note=default_note,
        xai_ctx=xai_ctx,
        agro_ctx=agro_ctx,
    )
