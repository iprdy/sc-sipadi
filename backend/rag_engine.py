import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import pandas as pd
import shap
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
    validasiXai: str = Field(..., description="Penjelasan penalaran model terbaik berdasarkan kontribusi SHAP dan respon kurva ALE.")
    aksiLapangan: str = Field(..., description="Rekomendasi teknis konkret untuk petani/petugas lapangan terkait pengairan, pemupukan, atau adaptasi suhu.")


class InsightSynthesisSchema(BaseModel):
    headlineSummary: str = Field(..., description="Ringkasan eksekutif 1-2 kalimat yang menyebutkan angka produktivitas aktual, status kategori, dan faktor utama wilayah.")
    harvestCategoryNote: str = Field(..., description="Catatan komparatif terhadap median provinsi Bali dan kondisi umum wilayah.")
    conclusion: ConclusionSchema


def _load_knowledge() -> Dict[str, Any]:
    if KNOWLEDGE_PATH.exists():
        return json.loads(KNOWLEDGE_PATH.read_text(encoding="utf-8"))
    return {}


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
    avg_ndvi: float,
    avg_lst: float,
    avg_rainfall: float,
) -> Dict[str, Any]:
    if not run or not os.path.exists(run.model_path):
        return {
            "model_name": run.best_model if run else "XGBoost",
            "predicted_ton_ha": None,
            "base_ton_ha": None,
            "r2_score": None,
            "shap_contributions": {},
        }

    try:
        artifact = joblib.load(run.model_path)
        model = artifact["model"]
        explainer = shap.TreeExplainer(model)
        base_raw = float(
            explainer.expected_value
            if not hasattr(explainer.expected_value, "__len__")
            else explainer.expected_value[0]
        )
        scale = 10 if abs(base_raw) > 20 else 1
        base_ton = round(base_raw / scale, 2)

        row_df = pd.DataFrame([[avg_ndvi, avg_lst, avg_rainfall]], columns=["NDVI", "LST", "Rainfall"])
        pred_raw = float(model.predict(row_df)[0])
        pred_ton = round(pred_raw / scale, 2)

        sv_raw = explainer.shap_values(row_df)[0]
        sv_ndvi = round(float(sv_raw[0]) / scale, 2)
        sv_lst = round(float(sv_raw[1]) / scale, 2)
        sv_rain = round(float(sv_raw[2]) / scale, 2)

        metrics = json.loads(run.metrics) if run.metrics else {}
        best_r2 = metrics.get(run.best_model, {}).get("r2")

        return {
            "model_name": run.best_model,
            "predicted_ton_ha": pred_ton,
            "base_ton_ha": base_ton,
            "r2_score": round(float(best_r2), 4) if best_r2 is not None else None,
            "shap_contributions": {
                "NDVI": sv_ndvi,
                "LST": sv_lst,
                "Rainfall": sv_rain,
            },
        }
    except Exception as exc:
        print(f"[RAG XAI CONTEXT WARNING]: {exc}")
        return {
            "model_name": run.best_model if run else "XGBoost",
            "predicted_ton_ha": None,
            "base_ton_ha": None,
            "r2_score": None,
            "shap_contributions": {},
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
    avg_yield = selected_metric.get("avg_productivity_ton_ha", 0)
    rank = selected_metric.get("rank", 1)
    total_regs = len(ranking) or 9
    top_reg = ranking[0] if ranking else None

    sorted_months = sorted(monthly_observations, key=lambda m: m.get("productivity", 0), reverse=True)
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
        f"Indeks kanopi NDVI ({selected_metric.get('avg_ndvi', 0):.3f}) masuk kategori "
        f"{agro_ctx['ndvi_rule'].get('title', 'sehat').lower()}, suhu permukaan {selected_metric.get('avg_lst', 0):.1f} °C "
        f"({agro_ctx['lst_rule'].get('title', 'normal').lower()}), dan curah hujan rata-rata "
        f"{int(round(selected_metric.get('avg_rainfall', 0))):,} mm."
    ).replace(",", ".")

    shap_map = xai_ctx.get("shap_contributions", {})
    if shap_map:
        validasi_xai = (
            f"Model {xai_ctx['model_name']} memproyeksikan {xai_ctx['predicted_ton_ha']:.2f} ton/ha "
            f"dari baseline Bali {xai_ctx['base_ton_ha']:.2f} ton/ha dengan atribusi SHAP: "
            f"NDVI ({shap_map.get('NDVI', 0):+.2f}), LST ({shap_map.get('LST', 0):+.2f}), "
            f"dan Curah Hujan ({shap_map.get('Rainfall', 0):+.2f}) ton/ha."
        )
    else:
        validasi_xai = (
            f"Estimasi dihitung oleh model {xai_ctx.get('model_name', 'XGBoost')} dengan menimbang "
            f"kerapatan vegetasi, suhu termal permukaan, serta suplai presipitasi {region_name}."
        )

    aksi_parts = []
    if low_m and best_m and low_m["month"] != best_m["month"]:
        aksi_parts.append(
            f"Fokuskan pengawasan ekstra menjelang fase berdaya hasil lebih rendah seperti bulan {MONTH_NAMES_ID[(low_m['month'] - 1) % 12]} ({low_m['productivity']:.2f} ton/ha)."
        )
    if selected_metric.get("avg_lst", 0) > 32.0:
        aksi_parts.append(agro_ctx["lst_rule"].get("knowledge", ""))
    elif selected_metric.get("avg_rainfall", 0) > 16500:
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
        float(pd.Series([r["avg_productivity_ton_ha"] for r in ranking]).median()), 2
    ) if ranking else 5.8

    sorted_months = sorted(monthly_observations, key=lambda m: m.get("productivity", 0), reverse=True)
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

    prompt = f"""
Anda adalah asisten analis data pertanian padi untuk sistem SIPADI Provinsi Bali.
Tugas Anda adalah menyusun ringkasan eksekutif dan 4 pilar kesimpulan berbahasa Indonesia yang jelas, natural, dan mudah dipahami oleh masyarakat umum maupun petugas lapangan.

ATURAN KETAT:
1. Gunakan HANYA angka fakta berikut. DILARANG mengarang angka atau statistik baru di luar konteks ini.
2. DILARANG menggunakan istilah "subak" dalam bentuk apa pun.
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

HASIL MODEL MACHINE LEARNING & XAI LOKAL:
- Model Terbaik: {xai_ctx.get('model_name')} (R2: {xai_ctx.get('r2_score')})
- Baseline Provinsi (E[f(x)]): {xai_ctx.get('base_ton_ha')} ton/ha
- Prediksi Lokal Wilayah: {xai_ctx.get('predicted_ton_ha')} ton/ha
- Atribusi SHAP Lokal (ton/ha): {json.dumps(xai_ctx.get('shap_contributions', {}))}

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
    if not selected_metric:
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

    # 2. Cache Miss: Retrieve Agronomy Knowledge & Local XAI Context
    agro_ctx = retrieve_agronomy_context(
        region_id=region_id,
        avg_ndvi=selected_metric.get("avg_ndvi", 0.65),
        avg_lst=selected_metric.get("avg_lst", 29.0),
        avg_rainfall=selected_metric.get("avg_rainfall", 13000.0),
    )
    xai_ctx = compute_local_xai_context(
        run=run,
        avg_ndvi=selected_metric.get("avg_ndvi", 0.65),
        avg_lst=selected_metric.get("avg_lst", 29.0),
        avg_rainfall=selected_metric.get("avg_rainfall", 13000.0),
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

    # 4. Graceful Fallback when GEMINI_API_KEY is missing or offline (not persisted to permanent cache)
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
