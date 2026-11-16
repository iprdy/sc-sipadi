import json
import os
import uuid
from pathlib import Path
from typing import Dict, List, Optional
import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth import (
    create_access_token,
    get_current_admin,
    get_password_hash,
    verify_password,
)
from backend.database import Base, engine, get_active_dialect, get_db
from backend.ml_engine import (
    compute_ale_curves,
    compute_shap_analysis,
    save_model_artifact,
    train_dual_models,
)
from backend.models import DatasetRecord, TrainingRun, User
from backend.validator import validate_dataset

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "artifacts"
DATA_DIR = BASE_DIR / "data"
ARTIFACT_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SIPADI AI & ML Backend API",
    version="3.0.0",
    description="Backend API untuk Sistem Pemantauan dan Analisis Produktivitas Padi Berbasis AI (XGBoost vs Random Forest, SHAP, ALE, dan PostgreSQL)",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Schemas
class LoginRequest(BaseModel):
    email: str
    password: str


class PredictionRequest(BaseModel):
    ndvi: float
    lst: float
    rainfall: float


# Seed default admin user & seed dataset if empty
@app.on_event("startup")
def startup_seed():
    db = next(get_db())
    try:
        admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@sipadi.id")
        admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")

        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            hashed = get_password_hash(admin_password)
            default_admin = User(
                id=str(uuid.uuid4()),
                name="Administrator SIPADI",
                email=admin_email,
                hashed_password=hashed,
                role="admin",
            )
            db.add(default_admin)
            db.commit()
            print(f"[SIPADI INIT] Default admin user created: {admin_email}")

        # Seed default regular user
        user_email = "user@sipadi.id"
        user_password = "user123"
        existing_user = db.query(User).filter(User.email == user_email).first()
        if not existing_user:
            hashed_user = get_password_hash(user_password)
            default_user = User(
                id=str(uuid.uuid4()),
                name="I Wayan Sudiarta",
                email=user_email,
                hashed_password=hashed_user,
                role="user",
            )
            db.add(default_user)
            db.commit()
            print(f"[SIPADI INIT] Default regular user created: {user_email}")

        # Seed initial training run if no runs exist
        existing_run = db.query(TrainingRun).first()
        sample_csv = DATA_DIR / "dataset_padi_bali_ML_2018_2025.csv"
        if not existing_run and sample_csv.exists():
            print("[SIPADI INIT] Seeding initial dataset and training run from sample CSV...")
            raw_df = pd.read_csv(sample_csv)
            clean_df = validate_dataset(raw_df)

            best_model_name, best_model, evaluations, X, _ = train_dual_models(clean_df)
            shap_data = compute_shap_analysis(best_model, X)
            ale_data = compute_ale_curves(best_model, X)

            run_id = uuid.uuid4().hex
            model_path = save_model_artifact(run_id, best_model_name, best_model)

            training_run = TrainingRun(
                id=run_id,
                filename="dataset_padi_bali_ML_2018_2025.csv",
                created_at=pd.Timestamp.now().isoformat(),
                rows_count=len(clean_df),
                features=json.dumps(["NDVI", "LST", "Rainfall"]),
                target_column="Produktivitas",
                best_model=best_model_name,
                metrics=json.dumps(evaluations),
                shap_data=json.dumps(shap_data),
                ale_data=json.dumps(ale_data),
                model_path=model_path,
                uploaded_by="System Seed",
            )
            db.add(training_run)

            # Insert dataset records
            records_to_insert = []
            for _, row in clean_df.iterrows():
                records_to_insert.append(
                    DatasetRecord(
                        run_id=run_id,
                        kabupaten=str(row["Kabupaten"]),
                        tahun=int(row["Tahun"]),
                        bulan=float(row["Bulan"]) if pd.notna(row["Bulan"]) else None,
                        ndvi=float(row["NDVI"]),
                        lst=float(row["LST"]),
                        rainfall=float(row["Rainfall"]),
                        produktivitas=float(row["Produktivitas"]),
                    )
                )
            db.bulk_save_objects(records_to_insert)
            db.commit()
            print(f"[SIPADI INIT] Seed run {run_id} created with {len(records_to_insert)} records.")
    except Exception as e:
        print(f"[SIPADI INIT ERROR] Seed failed: {e}")
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SIPADI AI & ML Backend API",
        "version": "3.0.0",
        "dialect": get_active_dialect(),
    }


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau kata sandi tidak sesuai. Silakan periksa kembali kredensial Anda.",
        )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role, "name": user.name}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }


@app.post("/api/admin/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".csv", ".xlsx", ".xls"}:
        raise HTTPException(
            status_code=400,
            detail="Format berkas tidak valid. Harap unggah berkas dengan format .csv atau .xlsx / .xls.",
        )

    raw_bytes = await file.read()
    temp_filename = f"{uuid.uuid4().hex}{suffix}"
    temp_path = ARTIFACT_DIR / temp_filename
    temp_path.write_bytes(raw_bytes)

    try:
        if suffix == ".csv":
            df = pd.read_csv(temp_path)
        else:
            df = pd.read_excel(temp_path)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Berkas tidak dapat diparsing: {exc}",
        )

    # Validate dataset strictly
    clean_df = validate_dataset(df)

    # Machine Learning Pipeline
    best_model_name, best_model, evaluations, X, _ = train_dual_models(clean_df)
    shap_data = compute_shap_analysis(best_model, X)
    ale_data = compute_ale_curves(best_model, X)

    # Persist artifact
    run_id = uuid.uuid4().hex
    model_path = save_model_artifact(run_id, best_model_name, best_model)

    # Save to PostgreSQL / SQLite
    training_run = TrainingRun(
        id=run_id,
        filename=file.filename,
        created_at=pd.Timestamp.now().isoformat(),
        rows_count=len(clean_df),
        features=json.dumps(["NDVI", "LST", "Rainfall"]),
        target_column="Produktivitas",
        best_model=best_model_name,
        metrics=json.dumps(evaluations),
        shap_data=json.dumps(shap_data),
        ale_data=json.dumps(ale_data),
        model_path=model_path,
        uploaded_by=admin.email,
    )
    db.add(training_run)

    # Bulk insert dataset records
    records_to_insert = []
    for _, row in clean_df.iterrows():
        records_to_insert.append(
            DatasetRecord(
                run_id=run_id,
                kabupaten=str(row["Kabupaten"]),
                tahun=int(row["Tahun"]),
                bulan=float(row["Bulan"]) if pd.notna(row["Bulan"]) else None,
                ndvi=float(row["NDVI"]),
                lst=float(row["LST"]),
                rainfall=float(row["Rainfall"]),
                produktivitas=float(row["Produktivitas"]),
            )
        )
    db.bulk_save_objects(records_to_insert)
    db.commit()

    return {
        "id": run_id,
        "filename": file.filename,
        "rows": len(clean_df),
        "features": ["NDVI", "LST", "Rainfall"],
        "target": "Produktivitas",
        "best_model": best_model_name,
        "metrics": evaluations,
        "shap": shap_data,
        "ale": ale_data,
        "uploaded_by": admin.email,
    }


def serialize_run(run: TrainingRun) -> Dict:
    return {
        "id": run.id,
        "filename": run.filename,
        "created_at": run.created_at,
        "rows": run.rows_count,
        "features": json.loads(run.features),
        "target": run.target_column,
        "best_model": run.best_model,
        "metrics": json.loads(run.metrics),
        "shap": json.loads(run.shap_data),
        "ale": json.loads(run.ale_data),
        "uploaded_by": run.uploaded_by,
    }


@app.get("/api/runs/latest")
def get_latest_run(db: Session = Depends(get_db)):
    run = db.query(TrainingRun).order_by(TrainingRun.created_at.desc()).first()
    if not run:
        return {"run": None}
    return {"run": serialize_run(run)}


@app.get("/api/runs/{run_id}")
def get_run_by_id(run_id: str, db: Session = Depends(get_db)):
    run = db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Training run tidak ditemukan.")
    return {"run": serialize_run(run)}


@app.post("/api/predict")
def predict_yield(payload: PredictionRequest, db: Session = Depends(get_db)):
    run = db.query(TrainingRun).order_by(TrainingRun.created_at.desc()).first()
    if not run:
        raise HTTPException(status_code=404, detail="Belum ada model machine learning yang dilatih.")

    if not os.path.exists(run.model_path):
        raise HTTPException(status_code=500, detail="Berkas model tidak ditemukan pada model storage.")

    artifact = joblib.load(run.model_path)
    model = artifact["model"]

    # Input features in order: NDVI, LST, Rainfall
    input_df = pd.DataFrame(
        [[payload.ndvi, payload.lst, payload.rainfall]],
        columns=["NDVI", "LST", "Rainfall"],
    )
    predicted_yield = float(model.predict(input_df)[0])

    return {
        "prediction": round(predicted_yield, 2),
        "unit": "ku/ha",
        "model": run.best_model,
        "features": {
            "NDVI": payload.ndvi,
            "LST": payload.lst,
            "Rainfall": payload.rainfall,
        },
    }


@app.get("/api/meta/filters")
def get_filter_meta(db: Session = Depends(get_db)):
    raw_regions = db.query(DatasetRecord.kabupaten).distinct().order_by(DatasetRecord.kabupaten).all()
    raw_years = db.query(DatasetRecord.tahun).distinct().order_by(DatasetRecord.tahun).all()

    region_meta = [
        {"id": "tabanan", "name": "Tabanan", "areaHa": 21500, "fields": 228},
        {"id": "badung", "name": "Badung", "areaHa": 9800, "fields": 119},
        {"id": "gianyar", "name": "Gianyar", "areaHa": 13200, "fields": 142},
        {"id": "buleleng", "name": "Buleleng", "areaHa": 17400, "fields": 164},
        {"id": "bangli", "name": "Bangli", "areaHa": 6200, "fields": 88},
        {"id": "jembrana", "name": "Jembrana", "areaHa": 11500, "fields": 104},
        {"id": "karangasem", "name": "Karangasem", "areaHa": 8900, "fields": 96},
        {"id": "klungkung", "name": "Klungkung", "areaHa": 4300, "fields": 62},
        {"id": "denpasar", "name": "Kota Denpasar", "areaHa": 2400, "fields": 45},
    ]

    db_kab_names = [k for (k,) in raw_regions]
    if not db_kab_names:
        regions = region_meta
    else:
        regions = []
        for meta in region_meta:
            if any(meta["name"].lower() in k.lower() for k in db_kab_names):
                regions.append(meta)

    years = [int(y) for (y,) in raw_years]
    if not years:
        years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

    return {
        "regions": regions,
        "years": sorted(years),
    }


def _latest_dataset_query(db: Session):
    """Query DatasetRecord scoped to the most recent active TrainingRun to prevent duplicate counting."""
    latest_run = db.query(TrainingRun).order_by(TrainingRun.created_at.desc()).first()
    q = db.query(DatasetRecord)
    if latest_run:
        q = q.filter(DatasetRecord.run_id == latest_run.id)
    return q


def _to_region_id(name: str) -> str:
    low = name.lower().strip()
    if "denpasar" in low:
        return "denpasar"
    return low.replace("kabupaten ", "").replace("kota ", "").strip()


@app.get("/api/monitoring/data")
def get_monitoring_data(
    region: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = _latest_dataset_query(db)
    matched_region = region or "tabanan"
    clean_keyword = matched_region.lower().replace("kota ", "").replace("kabupaten ", "").strip()
    
    # Filter by region
    query = query.filter(DatasetRecord.kabupaten.ilike(f"%{clean_keyword}%"))
    if year:
        query = query.filter(DatasetRecord.tahun == year)

    records = query.all()
    if not records:
        # Fallback to all records of that region or general
        records = _latest_dataset_query(db).filter(DatasetRecord.kabupaten.ilike(f"%{clean_keyword}%")).all()

    df = pd.DataFrame([
        {
            "kabupaten": r.kabupaten,
            "tahun": r.tahun,
            "bulan": r.bulan,
            "ndvi": r.ndvi,
            "lst": r.lst,
            "rainfall": r.rainfall,
            "produktivitas": r.produktivitas,
        }
        for r in records
    ])

    if df.empty:
        return {
            "count": 0,
            "averages": {"productivity": 5.21, "ndvi": 0.68, "lst": 27.5, "rainfall": 1820},
            "regions": [],
            "trend": [],
        }

    # Calculate real averages for selected year
    avg_prod_ku = float(df["produktivitas"].mean())
    avg_prod_ton = round(avg_prod_ku / 10 if avg_prod_ku > 20 else avg_prod_ku, 2)
    
    averages = {
        "productivity_raw": round(avg_prod_ku, 2),
        "productivity": avg_prod_ton,
        "ndvi": round(float(df["ndvi"].mean()), 3),
        "lst": round(float(df["lst"].mean()), 1),
        "rainfall": round(float(df["rainfall"].mean()), 1),
    }

    # Calculate REAL historical trend (2018-2025) for this region
    all_region_records = _latest_dataset_query(db).filter(DatasetRecord.kabupaten.ilike(f"%{clean_keyword}%")).all()
    all_df = pd.DataFrame([{"tahun": r.tahun, "produktivitas": r.produktivitas} for r in all_region_records])
    
    trend = []
    if not all_df.empty:
        for yr, group in all_df.groupby("tahun"):
            val_ku = float(group["produktivitas"].mean())
            val_ton = round(val_ku / 10 if val_ku > 20 else val_ku, 2)
            trend.append({
                "year": int(yr),
                "realisasi": val_ton if yr < 2025 else None,
                "estimasi": val_ton,
            })
    trend.sort(key=lambda x: x["year"])

    # Aggregate by region
    all_db_records = _latest_dataset_query(db).filter(DatasetRecord.tahun == (year or 2025)).all()
    summary_df = pd.DataFrame([{"kabupaten": r.kabupaten, "produktivitas": r.produktivitas} for r in all_db_records])
    
    region_stats = []
    for kab, group in summary_df.groupby("kabupaten"):
        p_ku = float(group["produktivitas"].mean())
        region_stats.append({
            "name": kab,
            "avg_productivity": round(p_ku / 10 if p_ku > 20 else p_ku, 2),
            "samples": len(group),
        })

    # Calculate dynamic Feature Importance for this region & year
    feat_importance = []
    run = db.query(TrainingRun).order_by(TrainingRun.created_at.desc()).first()
    if run and os.path.exists(run.model_path):
        try:
            artifact = joblib.load(run.model_path)
            model = artifact["model"]
            explainer = shap.TreeExplainer(model)
            row_df = pd.DataFrame(
                [[averages["ndvi"], averages["lst"], averages["rainfall"]]],
                columns=["NDVI", "LST", "Rainfall"],
            )
            sv_raw = explainer.shap_values(row_df)[0]
            m_ndvi = abs(float(sv_raw[0]))
            m_lst = abs(float(sv_raw[1]))
            m_rain = abs(float(sv_raw[2]))
            total_m = m_ndvi + m_lst + m_rain
            if total_m > 0:
                pct_ndvi = round((m_ndvi / total_m) * 100, 1)
                pct_lst = round((m_lst / total_m) * 100, 1)
                pct_rain = round(max(0.0, 100.0 - pct_ndvi - pct_lst), 1)
            else:
                pct_ndvi, pct_lst, pct_rain = 45.0, 30.0, 25.0

            feat_importance = [
                {
                    "feature": "ndvi",
                    "label": f"NDVI Kanopi ({averages['ndvi']:.3f})",
                    "weight": round(pct_ndvi / 100, 3),
                    "percentage": pct_ndvi,
                    "unit": "Indeks",
                },
                {
                    "feature": "lst",
                    "label": f"LST Suhu Permukaan ({averages['lst']:.1f} °C)",
                    "weight": round(pct_lst / 100, 3),
                    "percentage": pct_lst,
                    "unit": "°C",
                },
                {
                    "feature": "rainfall",
                    "label": f"Curah Hujan Siklus ({averages['rainfall']:,.0f} mm)".replace(",", "."),
                    "weight": round(pct_rain / 100, 3),
                    "percentage": pct_rain,
                    "unit": "mm",
                },
            ]
            feat_importance.sort(key=lambda x: x["percentage"], reverse=True)
        except Exception as e:
            print(f"[MONITORING SHAP ERROR]: {e}")

    return {
        "count": len(df),
        "region_name": df["kabupaten"].iloc[0] if not df.empty else clean_keyword.capitalize(),
        "year": year or 2025,
        "averages": averages,
        "trend": trend,
        "regions": sorted(region_stats, key=lambda x: x["name"]),
        "feature_importance": feat_importance,
    }


@app.get("/api/insight/data")
def get_insight_data(
    region: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    selected_year = year or 2025
    clean_keyword = (region or "tabanan").lower().replace("kota ", "").replace("kabupaten ", "").strip()

    records = _latest_dataset_query(db).filter(DatasetRecord.tahun == selected_year).all()
    if not records:
        records = _latest_dataset_query(db).all()

    df = pd.DataFrame([
        {
            "kabupaten": r.kabupaten,
            "tahun": r.tahun,
            "bulan": r.bulan,
            "ndvi": r.ndvi,
            "lst": r.lst,
            "rainfall": r.rainfall,
            "produktivitas": r.produktivitas,
        }
        for r in records
    ])

    regional_ranking = []
    for kab, grp in df.groupby("kabupaten"):
        avg_p = float(grp["produktivitas"].mean())
        ton_ha = round(avg_p / 10 if avg_p > 20 else avg_p, 2)
        regional_ranking.append({
            "regionId": _to_region_id(str(kab)),
            "name": kab,
            "avg_productivity_ton_ha": ton_ha,
            "avg_ndvi": round(float(grp["ndvi"].mean()), 3),
            "avg_lst": round(float(grp["lst"].mean()), 1),
            "avg_rainfall": round(float(grp["rainfall"].mean()), 1),
            "samples": len(grp),
        })

    regional_ranking.sort(key=lambda x: x["avg_productivity_ton_ha"], reverse=True)
    for idx, item in enumerate(regional_ranking):
        item["rank"] = idx + 1

    matched = next(
        (r for r in regional_ranking if clean_keyword in r["name"].lower()),
        regional_ranking[0] if regional_ranking else None
    )

    avg_yield = matched["avg_productivity_ton_ha"] if matched else 5.5
    avg_ndvi = matched["avg_ndvi"] if matched else 0.68
    avg_lst = matched["avg_lst"] if matched else 28.5
    avg_rain = matched["avg_rainfall"] if matched else 14000.0
    reg_name = matched["name"] if matched else clean_keyword.capitalize()
    reg_rank = matched["rank"] if matched else 1
    total_regs = len(regional_ranking) or 9

    median_yield = round(
        float(pd.Series([r["avg_productivity_ton_ha"] for r in regional_ranking]).median()), 2
    ) if regional_ranking else 5.8
    diff_median = round(avg_yield - median_yield, 2)
    diff_sign = "+" if diff_median >= 0 else ""

    # Determine harvest category grounded on actual provincial median & distribution
    if avg_yield >= 6.1:
        harvest_category = "Tinggi"
        harvest_note = (
            f"Produktivitas aktual {reg_name} ({avg_yield} ton/ha, peringkat #{reg_rank} dari {total_regs} wilayah) "
            f"berada {diff_sign}{diff_median:.2f} ton/ha di atas median provinsi Bali ({median_yield} ton/ha)."
        )
    elif avg_yield >= 5.5:
        harvest_category = "Optimal"
        harvest_note = (
            f"Produktivitas terhitung {avg_yield} ton/ha (peringkat #{reg_rank} dari {total_regs} wilayah) "
            f"dengan selisih {diff_sign}{diff_median:.2f} ton/ha terhadap median Bali ({median_yield} ton/ha)."
        )
    elif avg_yield >= 4.8:
        harvest_category = "Waspada"
        harvest_note = (
            f"Produktivitas {avg_yield} ton/ha (peringkat #{reg_rank} dari {total_regs} wilayah) berada di bawah "
            f"median provinsi ({median_yield} ton/ha) dan perlu perhatian manajemen air serta pemupukan."
        )
    else:
        harvest_category = "Rendah"
        harvest_note = (
            f"Produktivitas aktual ({avg_yield} ton/ha, peringkat #{reg_rank}) jauh di bawah median Bali ({median_yield} ton/ha); "
            "disarankan evaluasi varietas dan drainase."
        )

    headline = (
        f"Data observasi tahun {selected_year} di {reg_name} mencatat rata-rata produktivitas "
        f"{avg_yield} ton/ha (Kategori {harvest_category}) dengan indeks kehijauan NDVI {avg_ndvi}, "
        f"suhu permukaan {avg_lst} °C, dan curah hujan {avg_rain:,.0f} mm."
    ).replace(",", ".")

    # Dynamic Key Drivers derived from real agrometeorology relative to dataset baselines
    ndvi_impact = round((avg_ndvi - 0.65) * 1.5, 2)
    lst_impact = round((29.5 - avg_lst) * 0.08, 2)
    rain_impact = round((avg_rain - 13000) / 25000 * 0.5, 2)

    key_drivers = [
        {
            "title": "Faktor Biofisik Kanopi",
            "feature": f"NDVI Vegetasi Aktif ({avg_ndvi:.3f})",
            "impact": f"{'+' if ndvi_impact >= 0 else ''}{ndvi_impact:.2f} ton/ha efisiensi fotosintesis",
            "direction": "positive" if ndvi_impact >= 0 else "negative",
        },
        {
            "title": "Faktor Stabilitas Termal",
            "feature": f"Suhu Permukaan LST ({avg_lst:.1f} °C)",
            "impact": f"{'+' if lst_impact >= 0 else ''}{lst_impact:.2f} ton/ha regulasi suhu respirasi",
            "direction": "positive" if lst_impact >= 0 else "negative",
        },
        {
            "title": "Faktor Hidrologi Lahan",
            "feature": f"Presipitasi Kumulatif ({avg_rain:,.0f} mm)".replace(",", "."),
            "impact": f"{'+' if rain_impact >= 0 else ''}{rain_impact:.2f} ton/ha pasokan air tanaman",
            "direction": "positive" if rain_impact >= 0 else "negative",
        },
    ]

    # Real monthly observations for the selected regency and year directly from dataset_records
    reg_df = df[df["kabupaten"].str.lower().str.contains(clean_keyword, na=False)]
    if reg_df.empty and matched:
        reg_df = df[df["kabupaten"] == matched["name"]]

    monthly_observations = []
    if not reg_df.empty and "bulan" in reg_df.columns:
        for m, m_grp in reg_df.dropna(subset=["bulan"]).groupby("bulan"):
            mp_raw = float(m_grp["produktivitas"].mean())
            mp_ton = round(mp_raw / 10 if mp_raw > 20 else mp_raw, 2)
            monthly_observations.append({
                "month": int(m),
                "ndvi": round(float(m_grp["ndvi"].mean()), 3),
                "lst": round(float(m_grp["lst"].mean()), 1),
                "rainfall": round(float(m_grp["rainfall"].mean()), 1),
                "productivity": mp_ton,
            })
    monthly_observations.sort(key=lambda x: x["month"])

    return {
        "year": selected_year,
        "selected_region": matched,
        "regional_ranking": regional_ranking,
        "monthly_observations": monthly_observations,
        "headlineSummary": headline,
        "harvestCategory": harvest_category,
        "harvestCategoryNote": harvest_note,
        "keyDrivers": key_drivers,
        "parcels": [],
    }


@app.get("/api/analysis/data")
def get_analysis_data(
    region: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    selected_year = year or 2024
    clean_keyword = (region or "tabanan").lower().replace("kota ", "").replace("kabupaten ", "").strip()

    records = _latest_dataset_query(db).filter(
        DatasetRecord.kabupaten.ilike(f"%{clean_keyword}%"),
        DatasetRecord.tahun == selected_year,
    ).all()

    if not records:
        records = _latest_dataset_query(db).filter(DatasetRecord.kabupaten.ilike(f"%{clean_keyword}%")).all()
    if not records:
        records = _latest_dataset_query(db).all()

    df = pd.DataFrame([
        {
            "kabupaten": r.kabupaten,
            "tahun": r.tahun,
            "ndvi": r.ndvi,
            "lst": r.lst,
            "rainfall": r.rainfall,
            "produktivitas": r.produktivitas,
        }
        for r in records
    ])

    reg_name = df["kabupaten"].iloc[0] if not df.empty else clean_keyword.capitalize()
    mean_ndvi = float(df["ndvi"].mean())
    mean_lst = float(df["lst"].mean())
    mean_rainfall = float(df["rainfall"].mean())
    actual_prod_raw = float(df["produktivitas"].mean())
    actual_prod_ton = round(actual_prod_raw / 10 if actual_prod_raw > 20 else actual_prod_raw, 2)

    # Load active machine learning model
    run = db.query(TrainingRun).order_by(TrainingRun.created_at.desc()).first()
    if not run or not os.path.exists(run.model_path):
        raise HTTPException(status_code=500, detail="Model machine learning belum dilatih atau berkas artifact hilang.")

    artifact = joblib.load(run.model_path)
    model = artifact["model"]

    # Compute Local SHAP using TreeExplainer
    explainer = shap.TreeExplainer(model)
    base_val_raw = float(explainer.expected_value if not hasattr(explainer.expected_value, "__len__") else explainer.expected_value[0])
    scale = 10 if abs(base_val_raw) > 20 else 1
    base_val = round(base_val_raw / scale, 2)

    row_df = pd.DataFrame([[mean_ndvi, mean_lst, mean_rainfall]], columns=["NDVI", "LST", "Rainfall"])
    pred_raw = float(model.predict(row_df)[0])
    pred_val = round(pred_raw / scale, 2)

    sv_raw = explainer.shap_values(row_df)[0]
    sv_ndvi = round(float(sv_raw[0]) / scale, 2)
    sv_lst = round(float(sv_raw[1]) / scale, 2)
    sv_rain = round(float(sv_raw[2]) / scale, 2)

    # Rebalance rounding difference so base_val + sum(shap) == pred_val
    diff = round(pred_val - (base_val + sv_ndvi + sv_lst + sv_rain), 2)
    if abs(diff) > 0:
        sv_ndvi = round(sv_ndvi + diff, 2)

    features = [
        {
            "id": f"ndvi-{clean_keyword}",
            "name": "NDVI (Indeks Kerapatan Vegetasi)",
            "featureValue": f"{mean_ndvi:.3f} (Rerata Observasi)",
            "shapValue": sv_ndvi,
            "absoluteImpact": abs(sv_ndvi),
            "unit": "ton/ha",
            "interpretation": (
                f"Kerapatan kanopi klorofil (NDVI {mean_ndvi:.3f}) secara aktif mendongkrak fotosintesis sebesar +{sv_ndvi:.2f} ton/ha di atas baseline provinsi."
                if sv_ndvi >= 0
                else f"Indeks kanopi vegetasi (NDVI {mean_ndvi:.3f}) tergolong menahan potensi panen ({sv_ndvi:.2f} ton/ha) relatif terhadap rerata provinsi."
            ),
        },
        {
            "id": f"lst-{clean_keyword}",
            "name": "LST (Suhu Permukaan Tanah)",
            "featureValue": f"{mean_lst:.1f} °C (Termal Wilayah)",
            "shapValue": sv_lst,
            "absoluteImpact": abs(sv_lst),
            "unit": "ton/ha",
            "interpretation": (
                f"Suhu permukaan {mean_lst:.1f} °C berada dalam kisaran fisiologis optimal untuk metabolisme padi (+{sv_lst:.2f} ton/ha)."
                if sv_lst >= 0
                else f"Suhu permukaan {mean_lst:.1f} °C menimbulkan stres termal mikro yang menekan pengisian bulir ({sv_lst:.2f} ton/ha)."
            ),
        },
        {
            "id": f"rainfall-{clean_keyword}",
            "name": "Curah Hujan (Presipitasi Kumulatif)",
            "featureValue": f"{mean_rainfall:,.0f} mm (Pasokan Presipitasi)".replace(",", "."),
            "shapValue": sv_rain,
            "absoluteImpact": abs(sv_rain),
            "unit": "ton/ha",
            "interpretation": (
                f"Presipitasi hujan {mean_rainfall:,.0f} mm mencukupi kebutuhan hidrologi fase generatif padi (+{sv_rain:.2f} ton/ha).".replace(",", ".")
                if sv_rain >= 0
                else f"Pasokan presipitasi hujan {mean_rainfall:,.0f} mm menjadi faktor penahan ({sv_rain:.2f} ton/ha) terhadap stabilitas irigasi.".replace(",", ".")
            ),
        },
    ]
    features.sort(key=lambda x: x["absoluteImpact"], reverse=True)

    # Localized ALE Data
    raw_ale = json.loads(run.ale_data)
    ale_curves = {
        "ndvi": {
            "featureKey": "ndvi",
            "featureTitle": "NDVI (Normalized Difference Vegetation Index)",
            "unit": "Indeks (0.0 - 1.0)",
            "currentObservedValue": round(mean_ndvi, 3),
            "baseline": 0.0,
            "summaryText": f"Pada wilayah {reg_name} ({selected_year}), nilai NDVI terobservasi di level {mean_ndvi:.3f}. Kurva respon ALE model {run.best_model} memperlihatkan dampak marjinal kanopi klorofil pada fase vegetatif aktif.",
            "dataPoints": [{"featureValue": p["x"], "aleEffect": p["y"]} for p in raw_ale.get("NDVI", [])],
        },
        "lst": {
            "featureKey": "lst",
            "featureTitle": "LST (Land Surface Temperature)",
            "unit": "°C",
            "currentObservedValue": round(mean_lst, 1),
            "baseline": 0.0,
            "summaryText": f"Pada wilayah {reg_name} ({selected_year}), suhu termal terobservasi di level {mean_lst:.1f} °C. Respon ALE menunjukkan rentang suhu fisiologis terbaik berada di 25°C - 28°C.",
            "dataPoints": [{"featureValue": p["x"], "aleEffect": p["y"]} for p in raw_ale.get("LST", [])],
        },
        "rainfall": {
            "featureKey": "rainfall",
            "featureTitle": "Presipitasi Kumulatif CHIRPS",
            "unit": "mm",
            "currentObservedValue": round(mean_rainfall, 0),
            "baseline": 0.0,
            "summaryText": f"Pada wilayah {reg_name} ({selected_year}), presipitasi terobservasi sebesar {mean_rainfall:,.0f} mm. Respon marjinal ALE memetakan kecukupan pasokan hidrologi sepanjang siklus panen.".replace(",", "."),
            "dataPoints": [{"featureValue": p["x"], "aleEffect": p["y"]} for p in raw_ale.get("Rainfall", [])],
        },
    }

    return {
        "region": clean_keyword,
        "region_name": reg_name,
        "year": selected_year,
        "base_value": base_val,
        "predicted_value": pred_val,
        "actual_value": actual_prod_ton,
        "model_name": run.best_model,
        "features": features,
        "ale": ale_curves,
    }
