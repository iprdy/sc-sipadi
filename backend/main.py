import json
import logging
import math
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Dict, Optional
import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import UniqueConstraint, inspect
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from backend.auth import (
    create_access_token,
    get_current_admin,
    verify_password,
)
from backend.database import Base, engine, get_active_dialect, get_db
from backend.ml_engine import (
    FEATURES,
    VALIDATION_SCHEME,
    build_prediction_features,
    load_model_artifact,
    run_research_training,
)
from backend.model_config import get_all_model_configs, get_model_config
from backend.models import DatasetRecord, InsightSummary, TrainingRun, User
from backend.rag_engine import get_or_create_insight_synthesis
from backend.validator import validate_dataset

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "artifacts"
ARTIFACT_DIR.mkdir(exist_ok=True)
logger = logging.getLogger(__name__)


def _json_safe(value):
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, (date, datetime, pd.Timestamp)):
        return value.isoformat()
    if hasattr(value, "item"):
        return _json_safe(value.item())
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def _json_dumps(value):
    return json.dumps(_json_safe(value), allow_nan=False)


def _remove_file(path):
    if path and Path(path).is_file():
        try:
            Path(path).unlink()
        except OSError:
            logger.exception("Failed to remove a temporary or uncommitted file.")


def _normalize_region_name(value):
    parts = value.casefold().replace("_", " ").replace("-", " ").split()
    if parts and parts[0] in {"kabupaten", "kota"}:
        parts = parts[1:]
    return " ".join(parts)


def _training_run_metadata(run: TrainingRun) -> Dict:
    return json.loads(run.metadata_json) if run.metadata_json else {}


def _select_training_run(db: Session, run_id: Optional[str] = None):
    query = db.query(TrainingRun)
    if run_id:
        run = query.filter(TrainingRun.id == run_id).first()
        if not run:
            raise HTTPException(
                status_code=404,
                detail="Training run yang diminta tidak ditemukan.",
            )
        return run
    return query.order_by(TrainingRun.created_at.desc()).first()


def _prediction_records(frame: pd.DataFrame):
    required = [
        "Kabupaten",
        "Tahun",
        "Bulan",
        "Produktivitas",
        "Prediksi",
        "Error",
        "Origin",
    ]
    return _json_safe(frame[required].to_dict(orient="records"))


def validate_database_schema():
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    expected_tables = set(Base.metadata.tables)
    missing_tables = expected_tables - existing_tables
    missing_columns = {}
    nullable_errors = []
    constraint_errors = []
    type_errors = []

    for table_name in sorted(expected_tables & existing_tables):
        model_table = Base.metadata.tables[table_name]
        actual_columns = {
            column["name"]: column
            for column in inspector.get_columns(table_name)
        }
        expected_columns = set(model_table.columns.keys())
        missing = expected_columns - actual_columns.keys()
        if missing:
            missing_columns[table_name] = sorted(missing)

        expected_primary_key = [
            column.name for column in model_table.primary_key.columns
        ]
        actual_primary_key = inspector.get_pk_constraint(table_name).get(
            "constrained_columns"
        ) or []
        if actual_primary_key != expected_primary_key:
            constraint_errors.append(
                f"{table_name} primary key must be {expected_primary_key}"
            )

        actual_indexes = inspector.get_indexes(table_name)
        for index in model_table.indexes:
            index_columns = tuple(column.name for column in index.columns)
            if not any(
                tuple(actual_index.get("column_names") or ()) == index_columns
                and bool(actual_index.get("unique")) == bool(index.unique)
                for actual_index in actual_indexes
            ):
                constraint_errors.append(
                    f"{table_name} index on {index_columns} is missing"
                )

        actual_unique_constraints = inspector.get_unique_constraints(table_name)
        for constraint in model_table.constraints:
            if not isinstance(constraint, UniqueConstraint):
                continue
            unique_columns = tuple(column.name for column in constraint.columns)
            has_unique = any(
                tuple(item.get("column_names") or ()) == unique_columns
                for item in actual_unique_constraints
            ) or any(
                item.get("unique")
                and tuple(item.get("column_names") or ()) == unique_columns
                for item in actual_indexes
            )
            if not has_unique:
                constraint_errors.append(
                    f"{table_name} unique constraint on {unique_columns} is missing"
                )

        actual_foreign_keys = inspector.get_foreign_keys(table_name)
        for foreign_key in model_table.foreign_keys:
            expected_fk = (
                foreign_key.parent.name,
                foreign_key.column.table.name,
                foreign_key.column.name,
                foreign_key.ondelete,
            )
            has_foreign_key = any(
                fk.get("constrained_columns") == [expected_fk[0]]
                and fk.get("referred_table") == expected_fk[1]
                and fk.get("referred_columns") == [expected_fk[2]]
                and (fk.get("options") or {}).get("ondelete") == expected_fk[3]
                for fk in actual_foreign_keys
            )
            if not has_foreign_key:
                constraint_errors.append(
                    f"{table_name}.{expected_fk[0]} foreign key is missing"
                )

    nullable_columns = {
        "dataset_records": (
            "luas_panen_ha",
            "produksi_ton",
            "produktivitas",
            "status_lst",
        ),
        "training_runs": (
            "supervised_rows",
            "model_params",
            "validation_scheme",
            "temporal_validation_metrics",
            "final_test_metrics",
            "metadata_json",
        ),
    }
    for table_name, column_names in nullable_columns.items():
        if table_name not in existing_tables:
            continue
        actual_columns = {
            column["name"]: column
            for column in inspector.get_columns(table_name)
        }
        for column_name in column_names:
            column = actual_columns.get(column_name)
            if column is not None and not column["nullable"]:
                nullable_errors.append(f"{table_name}.{column_name}")

    if "dataset_records" in existing_tables:
        bulan = {
            column["name"]: column
            for column in inspector.get_columns("dataset_records")
        }.get("bulan")
        if bulan is not None and bulan["nullable"]:
            nullable_errors.append("dataset_records.bulan must be NOT NULL")

    if "training_runs" in existing_tables:
        best_model = {
            column["name"]: column
            for column in inspector.get_columns("training_runs")
        }.get("best_model")
        if (
            best_model is not None
            and getattr(best_model["type"], "length", None) != 120
        ):
            type_errors.append("training_runs.best_model must be VARCHAR(120)")

    if (
        missing_tables
        or missing_columns
        or nullable_errors
        or constraint_errors
        or type_errors
    ):
        details = []
        if missing_tables:
            details.append(f"missing tables: {sorted(missing_tables)}")
        if missing_columns:
            details.append(f"missing columns: {missing_columns}")
        if nullable_errors:
            details.append(f"nullability mismatch: {nullable_errors}")
        if constraint_errors:
            details.append(f"key/index mismatch: {constraint_errors}")
        if type_errors:
            details.append(f"type mismatch: {type_errors}")
        raise RuntimeError(
            "Database schema does not match the current models. "
            "Apply the reviewed Alembic migration to the intended database. "
            + "; ".join(details)
        )


app = FastAPI(
    title="SIPADI AI & ML Backend API",
    version="3.0.0",
    description="Backend SI-PADI untuk training dan prediksi produktivitas padi dengan model yang dapat dikonfigurasi, SHAP, dan ALE.",
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
    kabupaten: Optional[str] = None
    regionId: Optional[str] = None
    run_id: Optional[str] = None
    tahun: Optional[int] = None
    year: Optional[int] = None
    bulan: Optional[int] = None
    month: Optional[int] = None
    ndvi: float
    lst: float
    rainfall: float


@app.on_event("startup")
def startup_validate():
    validate_database_schema()


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

    filename = file.filename or "dataset"
    temp_path = ARTIFACT_DIR / f"{uuid.uuid4().hex}{suffix}"
    try:
        temp_path.write_bytes(await file.read())
        if suffix == ".csv":
            df = pd.read_csv(temp_path)
        else:
            df = pd.read_excel(temp_path)
        clean_df = validate_dataset(df)
    except HTTPException:
        _remove_file(temp_path)
        await file.close()
        raise
    except Exception:
        logger.exception("Uploaded dataset could not be parsed.")
        _remove_file(temp_path)
        await file.close()
        raise HTTPException(
            status_code=400,
            detail="Berkas dataset tidak dapat dibaca sebagai CSV atau Excel yang valid.",
        ) from None

    artifact_paths = []
    upload_batch_id = uuid.uuid4().hex
    try:
        configs = get_all_model_configs()
        model_configs = [
            configs["xgboost_baseline"],
            configs["xgboost_tuned"],
        ]
        trainings = []
        for config in model_configs:
            training = await run_in_threadpool(
                run_research_training,
                clean_df,
                save_artifact=True,
                model_config=config,
                master_is_validated=True,
            )
            path = training.get("model_path")
            if not path:
                raise RuntimeError(
                    f"Model {config['model_key']} tidak menghasilkan artifact."
                )
            artifact_paths.append(path)
            if training.get("model_key") != config["model_key"]:
                raise RuntimeError(
                    f"Model key artifact tidak cocok untuk {config['model_key']}."
                )
            trainings.append((config, training))

        if len({training["run_id"] for _, training in trainings}) != 2:
            raise RuntimeError("Kedua eksperimen harus memiliki run_id berbeda.")

        def origin_signature(frame):
            return list(
                zip(
                    frame["Kabupaten"],
                    frame["Tahun"],
                    frame["Bulan"],
                    pd.to_datetime(frame["Origin"]),
                )
            )

        baseline_training = trainings[0][1]
        for _, training in trainings[1:]:
            if (
                baseline_training["temporal_validation_origins"]["Origin"].tolist()
                != training["temporal_validation_origins"]["Origin"].tolist()
                or baseline_training["final_test_origins"]["Origin"].tolist()
                != training["final_test_origins"]["Origin"].tolist()
                or origin_signature(
                    baseline_training["temporal_validation_predictions"]
                )
                != origin_signature(training["temporal_validation_predictions"])
                or origin_signature(
                    baseline_training["final_test_predictions"]
                )
                != origin_signature(training["final_test_predictions"])
            ):
                raise RuntimeError(
                    "Kedua eksperimen menghasilkan origin/baris evaluasi berbeda."
                )

        training_runs = []
        records_to_insert = []
        run_responses = []
        for config, training in trainings:
            run_id = training["run_id"]
            model_name = config["name"]
            model_params = {
                "model_key": config["model_key"],
                "algorithm": config["algorithm"],
                "name": config["name"],
                "params": config["params"],
            }
            evaluations = {
                f"{model_name} - Temporal Validation":
                    training["temporal_validation_metrics"],
                f"{model_name} - Final Test 2025":
                    training["final_test_metrics"],
            }
            metadata = {
                "upload_batch_id": upload_batch_id,
                "model_key": config["model_key"],
                "model_name": model_name,
                "algorithm": config["algorithm"],
                "master_rows": len(clean_df),
                "missing_target_rows": int(
                    clean_df["Produktivitas"].isna().sum()
                ),
                "supervised_rows": len(training["supervised_dataset"]),
                "model_params": config["params"],
                "validation_scheme": VALIDATION_SCHEME,
                "final_test_predictions": _prediction_records(
                    training["final_test_predictions"]
                ),
                "temporal_validation_predictions": _prediction_records(
                    training["temporal_validation_predictions"]
                ),
                "shap_by_region": training["shap_by_region"],
                "ale_by_region": training["ale_by_region"],
                "evaluation_metadata": {
                    "temporal_validation_origins": len(
                        training["temporal_validation_origins"]
                    ),
                    "temporal_validation_predictions": len(
                        training["temporal_validation_predictions"]
                    ),
                    "final_test_origins": len(training["final_test_origins"]),
                    "final_test_predictions": len(
                        training["final_test_predictions"]
                    ),
                    "regional_shap_scope": "rolling_origin_2025_oof",
                    "regional_ale_scope": "final_model_by_region",
                    "global_shap_scope": "final_model_in_sample",
                    "validation_scheme": VALIDATION_SCHEME,
                },
            }
            training_runs.append(
                TrainingRun(
                    id=run_id,
                    filename=filename,
                    created_at=pd.Timestamp.now().isoformat(),
                    rows_count=len(clean_df),
                    supervised_rows=len(training["supervised_dataset"]),
                    features=_json_dumps(FEATURES),
                    target_column="Produktivitas",
                    best_model=model_name,
                    model_params=_json_dumps(model_params),
                    validation_scheme=VALIDATION_SCHEME,
                    temporal_validation_metrics=_json_dumps(
                        training["temporal_validation_metrics"]
                    ),
                    final_test_metrics=_json_dumps(
                        training["final_test_metrics"]
                    ),
                    metrics=_json_dumps(evaluations),
                    shap_data=_json_dumps(training["shap_data"]),
                    ale_data=_json_dumps(training["ale_data"]),
                    metadata_json=_json_dumps(metadata),
                    model_path=str(training["model_path"]),
                    uploaded_by=admin.email,
                )
            )

            for row in clean_df.to_dict(orient="records"):
                records_to_insert.append(
                    DatasetRecord(
                        run_id=run_id,
                        kabupaten=str(row["Kabupaten"]),
                        tahun=int(row["Tahun"]),
                        bulan=float(row["Bulan"]),
                        luas_panen_ha=(
                            None if pd.isna(row["Luas_Panen_ha"])
                            else float(row["Luas_Panen_ha"])
                        ),
                        produksi_ton=(
                            None if pd.isna(row["Produksi_ton"])
                            else float(row["Produksi_ton"])
                        ),
                        produktivitas=(
                            None if pd.isna(row["Produktivitas"])
                            else float(row["Produktivitas"])
                        ),
                        ndvi=float(row["NDVI"]),
                        lst=float(row["LST"]),
                        rainfall=float(row["Rainfall"]),
                        status_lst=(
                            None if pd.isna(row["Status_LST"])
                            else str(row["Status_LST"])
                        ),
                    )
                )

            run_responses.append({
                "id": run_id,
                "model_key": config["model_key"],
                "model_name": model_name,
                "metrics": evaluations,
                "model_params": model_params,
                "temporal_validation_metrics":
                    training["temporal_validation_metrics"],
                "final_test_metrics": training["final_test_metrics"],
                "shap": training["shap_data"],
                "ale": training["ale_data"],
            })

        db.add_all(training_runs)
        db.add_all(records_to_insert)
        db.commit()
    except HTTPException:
        db.rollback()
        for path in artifact_paths:
            _remove_file(path)
        raise
    except Exception:
        db.rollback()
        for path in artifact_paths:
            _remove_file(path)
        logger.exception("Dual-model training or persistence failed.")
        raise HTTPException(
            status_code=500,
            detail=(
                "Pelatihan dua model atau penyimpanan dataset gagal. "
                "Tidak ada perubahan database yang disimpan."
            ),
        ) from None
    finally:
        _remove_file(temp_path)
        await file.close()

    baseline_config, baseline_result = trainings[0]
    baseline_run = run_responses[0]
    return {
        "id": baseline_result["run_id"],
        "upload_batch_id": upload_batch_id,
        "filename": filename,
        "rows": len(clean_df),
        "supervised_rows": len(baseline_result["supervised_dataset"]),
        "features": FEATURES,
        "target": "Produktivitas",
        "best_model": baseline_config["name"],
        "metrics": baseline_run["metrics"],
        "model_params": baseline_run["model_params"],
        "validation_scheme": VALIDATION_SCHEME,
        "temporal_validation_metrics":
            baseline_result["temporal_validation_metrics"],
        "final_test_metrics": baseline_result["final_test_metrics"],
        "shap": baseline_result["shap_data"],
        "ale": baseline_result["ale_data"],
        "uploaded_by": admin.email,
        "runs": run_responses,
    }


def serialize_run(run: TrainingRun) -> Dict:
    metadata = _training_run_metadata(run)
    return {
        "id": run.id,
        "run_id": run.id,
        "filename": run.filename,
        "created_at": run.created_at,
        "rows": run.rows_count,
        "features": json.loads(run.features),
        "target": run.target_column,
        "best_model": run.best_model,
        "supervised_rows": run.supervised_rows,
        "model_params": json.loads(run.model_params) if run.model_params else None,
        "validation_scheme": run.validation_scheme,
        "temporal_validation_metrics": (
            json.loads(run.temporal_validation_metrics)
            if run.temporal_validation_metrics else None
        ),
        "final_test_metrics": (
            json.loads(run.final_test_metrics)
            if run.final_test_metrics else None
        ),
        "metadata": json.loads(run.metadata_json) if run.metadata_json else None,
        "model_key": metadata.get("model_key"),
        "upload_batch_id": metadata.get("upload_batch_id"),
        "metrics": json.loads(run.metrics),
        "shap": json.loads(run.shap_data),
        "ale": json.loads(run.ale_data),
        "uploaded_by": run.uploaded_by,
        "artifact_status": (
            "available" if run.model_path and Path(run.model_path).is_file() else "missing"
        ),
    }


def serialize_run_summary(run: TrainingRun) -> Dict:
    metadata = _training_run_metadata(run)
    return {
        "id": run.id,
        "run_id": run.id,
        "filename": run.filename,
        "created_at": run.created_at,
        "rows": run.rows_count,
        "supervised_rows": run.supervised_rows,
        "best_model": run.best_model,
        "model_key": metadata.get("model_key"),
        "upload_batch_id": metadata.get("upload_batch_id"),
        "model_params": json.loads(run.model_params) if run.model_params else None,
        "validation_scheme": run.validation_scheme,
        "temporal_validation_metrics": (
            json.loads(run.temporal_validation_metrics)
            if run.temporal_validation_metrics else None
        ),
        "final_test_metrics": (
            json.loads(run.final_test_metrics)
            if run.final_test_metrics else None
        ),
        "shap": json.loads(run.shap_data) if run.shap_data else [],
        "artifact_status": (
            "available" if run.model_path and Path(run.model_path).is_file() else "missing"
        ),
    }


@app.get("/api/runs")
def get_runs(
    upload_batch_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    runs = db.query(TrainingRun).order_by(TrainingRun.created_at.desc()).all()
    serialized = []
    for run in runs:
        run_metadata = _training_run_metadata(run)
        if (
            upload_batch_id is not None
            and run_metadata.get("upload_batch_id") != upload_batch_id
        ):
            continue
        serialized.append(serialize_run_summary(run))
    return {"runs": serialized, "count": len(serialized)}


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


@app.get("/api/runs/{run_id}/predictions")
def get_run_predictions(
    run_id: str,
    kabupaten: Optional[str] = None,
    db: Session = Depends(get_db),
):
    run = _select_training_run(db, run_id)
    metadata = _training_run_metadata(run)
    predictions = metadata.get("final_test_predictions", [])
    if kabupaten:
        requested = _normalize_region_name(kabupaten)
        predictions = [
            prediction for prediction in predictions
            if _normalize_region_name(prediction["Kabupaten"]) == requested
        ]
    return {
        "run_id": run.id,
        "upload_batch_id": metadata.get("upload_batch_id"),
        "model_key": metadata.get("model_key"),
        "kabupaten": kabupaten,
        "predictions": predictions,
        "count": len(predictions),
    }


@app.post("/api/predict")
def predict_yield(payload: PredictionRequest, db: Session = Depends(get_db)):
    run = _select_training_run(db, payload.run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Belum ada model machine learning yang dilatih.")

    region = payload.kabupaten or payload.regionId
    target_year = payload.tahun if payload.tahun is not None else payload.year
    target_month = payload.bulan if payload.bulan is not None else payload.month
    if not region or target_year is None or target_month is None:
        raise HTTPException(
            status_code=422,
            detail="Kabupaten, Tahun, dan Bulan wajib diisi untuk prediksi.",
        )
    if not 1 <= target_month <= 12:
        raise HTTPException(status_code=422, detail="Bulan harus berada pada rentang 1-12.")

    same_run_records = (
        db.query(DatasetRecord)
        .filter(DatasetRecord.run_id == run.id)
        .all()
    )
    normalized_requested_region = _normalize_region_name(region)
    region_records = [
        record for record in same_run_records
        if _normalize_region_name(record.kabupaten) == normalized_requested_region
    ]
    if not region_records:
        raise HTTPException(
            status_code=422,
            detail="Riwayat untuk Kabupaten tersebut tidak tersedia pada dataset model ini.",
        )

    history = pd.DataFrame([
        {
            "Tahun": record.tahun,
            "Bulan": record.bulan,
            "Produktivitas": record.produktivitas,
        }
        for record in region_records
    ])
    try:
        input_features = build_prediction_features(
            kabupaten=region_records[0].kabupaten,
            tahun=target_year,
            bulan=target_month,
            ndvi=payload.ndvi,
            lst=payload.lst,
            rainfall=payload.rainfall,
            history=history,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None

    try:
        artifact = load_model_artifact(run.model_path)
        run_model_key = _training_run_metadata(run).get("model_key")
        if (
            artifact.get("run_id") != run.id
            or artifact.get("features") != FEATURES
            or (
                run_model_key is not None
                and artifact.get("model_key") != run_model_key
            )
        ):
            raise HTTPException(
                status_code=409,
                detail="Artifact model tidak kompatibel dengan fitur Model B.",
            )
        model = artifact.get("model")
        if model is None or not callable(getattr(model, "predict", None)):
            raise HTTPException(
                status_code=409,
                detail="Artifact tidak berisi Pipeline prediksi yang valid.",
            )
        predicted_yield = float(model.predict(input_features)[0])
        if not math.isfinite(predicted_yield):
            raise HTTPException(
                status_code=500,
                detail="Model menghasilkan prediksi yang tidak valid.",
            )
    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Artifact model tidak ditemukan.") from None
    except Exception:
        logger.exception("Model prediction failed for training run %s.", run.id)
        raise HTTPException(
            status_code=500,
            detail="Prediksi tidak dapat diproses oleh model tersimpan.",
        ) from None

    return {
        "prediction": round(predicted_yield, 2),
        "unit": "ku/ha",
        "model": run.best_model,
        "model_key": run_model_key,
        "run_id": run.id,
        "prediction_ton_ha": round(predicted_yield / 10, 2),
        "features": input_features.iloc[0].to_dict(),
    }


@app.get("/api/meta/filters")
def get_filter_meta(db: Session = Depends(get_db)):
    raw_regions = db.query(DatasetRecord.kabupaten).distinct().order_by(DatasetRecord.kabupaten).all()
    raw_years = db.query(DatasetRecord.tahun).distinct().order_by(DatasetRecord.tahun).all()
    return {
        "regions": [
            {
                "id": _normalize_region_name(name).replace(" ", "-"),
                "name": name,
            }
            for (name,) in raw_regions
        ],
        "years": sorted({int(year) for (year,) in raw_years}),
    }


@app.get("/api/monitoring/data")
def get_monitoring_data(
    region: Optional[str] = None,
    year: Optional[int] = None,
    run_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    run = _select_training_run(db, run_id)
    requested_region = _normalize_region_name(region or "")
    records = []
    if run:
        records = [
            record
            for record in db.query(DatasetRecord)
            .filter(DatasetRecord.run_id == run.id)
            .all()
            if _normalize_region_name(record.kabupaten) == requested_region
        ]

    selected_year = year if year is not None else 2025
    selected_records = [record for record in records if record.tahun == selected_year]
    target_values = [
        record.produktivitas
        for record in selected_records
        if record.produktivitas is not None
    ]

    def mean_or_none(values, divisor=1.0, digits=2):
        return (
            round(sum(values) / len(values) / divisor, digits)
            if values else None
        )

    averages = {
        "productivity_raw": mean_or_none(target_values, digits=2),
        "productivity": mean_or_none(target_values, divisor=10, digits=2),
        "ndvi": mean_or_none([r.ndvi for r in selected_records], digits=3),
        "lst": mean_or_none([r.lst for r in selected_records], digits=2),
        "rainfall": mean_or_none([r.rainfall for r in selected_records], digits=2),
    }

    by_year = {}
    for record in records:
        if record.produktivitas is not None:
            by_year.setdefault(record.tahun, []).append(record.produktivitas)
    trend = [
        {
            "year": int(observed_year),
            "realisasi": mean_or_none(values, divisor=10, digits=2),
            "estimasi": None,
        }
        for observed_year, values in sorted(by_year.items())
    ]

    shap_data = json.loads(run.shap_data) if run and run.shap_data else []
    feature_importance = [
        {
            "feature": item["feature"],
            "label": item.get("displayName", item["feature"]),
            "weight": round(float(item.get("importance_pct", 0)) / 100, 5),
            "percentage": round(float(item.get("importance_pct", 0)), 2),
            "unit": "ku/ha mean absolute SHAP",
        }
        for item in shap_data
    ]
    region_name = records[0].kabupaten if records else (region or "")
    return {
        "count": len(selected_records),
        "productivity_samples": len(target_values),
        "region_name": region_name,
        "year": selected_year,
        "averages": averages,
        "trend": trend,
        "feature_importance": feature_importance,
        "feature_importance_scope": "global_training_run",
        "run_id": run.id if run else None,
        "model_key": (
            _training_run_metadata(run).get("model_key") if run else None
        ),
    }


def _to_region_id(name: str) -> str:
    normalized = _normalize_region_name(name)
    return "denpasar" if "denpasar" in normalized else normalized.replace(" ", "-")


def _build_insight_payload(
    db: Session,
    run: Optional[TrainingRun],
    region: Optional[str],
    year: Optional[int],
    force_refresh: bool = False,
) -> Dict:
    selected_year = year if year is not None else 2025
    requested_region = _normalize_region_name(region or "")
    run_records = (
        db.query(DatasetRecord).filter(DatasetRecord.run_id == run.id).all()
        if run else []
    )
    year_records = [record for record in run_records if record.tahun == selected_year]
    if not year_records:
        year_records = run_records

    region_records = [
        record for record in year_records
        if _normalize_region_name(record.kabupaten) == requested_region
    ]
    target_values = [
        record.produktivitas
        for record in region_records
        if record.produktivitas is not None
    ]

    def mean_or_none(values, divisor=1.0, digits=2):
        return round(sum(values) / len(values) / divisor, digits) if values else None

    grouped_by_kab: Dict[str, list] = {}
    for record in year_records:
        grouped_by_kab.setdefault(record.kabupaten, []).append(record)

    regional_ranking = []
    for kab_name, kab_rows in grouped_by_kab.items():
        kab_targets = [r.produktivitas for r in kab_rows if r.produktivitas is not None]
        avg_prod = mean_or_none(kab_targets, divisor=10)
        regional_ranking.append({
            "regionId": _to_region_id(kab_name),
            "name": kab_name,
            "avg_productivity_ton_ha": avg_prod,
            "avg_ndvi": mean_or_none([r.ndvi for r in kab_rows], digits=3),
            "avg_lst": mean_or_none([r.lst for r in kab_rows], digits=1),
            "avg_rainfall": mean_or_none([r.rainfall for r in kab_rows], digits=1),
            "samples": len(kab_rows),
        })

    regional_ranking.sort(
        key=lambda item: (
            item["avg_productivity_ton_ha"] if item["avg_productivity_ton_ha"] is not None else -1.0
        ),
        reverse=True,
    )
    for idx, item in enumerate(regional_ranking):
        item["rank"] = idx + 1

    matched_ranking = next(
        (r for r in regional_ranking if _normalize_region_name(r["name"]) == requested_region),
        regional_ranking[0] if regional_ranking else None,
    )
    reg_name = (
        region_records[0].kabupaten
        if region_records
        else (matched_ranking["name"] if matched_ranking else (region or ""))
    )

    averages = {
        "productivity_ton_ha": mean_or_none(target_values, divisor=10),
        "ndvi": mean_or_none([record.ndvi for record in region_records], digits=3),
        "lst": mean_or_none([record.lst for record in region_records]),
        "rainfall": mean_or_none([record.rainfall for record in region_records]),
    }

    avg_yield = averages["productivity_ton_ha"]
    avg_ndvi = averages["ndvi"] if averages["ndvi"] is not None else 0.65
    avg_lst = averages["lst"] if averages["lst"] is not None else 29.0
    avg_rain = averages["rainfall"] if averages["rainfall"] is not None else 13000.0

    # Determine harvest category grounded on provincial median
    valid_yields = [
        r["avg_productivity_ton_ha"]
        for r in regional_ranking
        if r.get("avg_productivity_ton_ha") is not None
    ]
    median_yield = round(float(pd.Series(valid_yields).median()), 2) if valid_yields else 5.8
    reg_rank = matched_ranking["rank"] if matched_ranking else 1
    total_regs = len(regional_ranking) or 9

    if avg_yield is None:
        harvest_category = "Waspada"
        harvest_note = f"Data target produktivitas untuk {reg_name} pada tahun {selected_year} belum lengkap."
        default_headline = f"Data lingkungan {reg_name} tahun {selected_year} tersedia untuk pemantauan agroklimat."
    else:
        diff_median = round(avg_yield - median_yield, 2)
        diff_sign = "+" if diff_median >= 0 else ""
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
                f"Produktivitas aktual ({avg_yield} ton/ha, peringkat #{reg_rank}) berada di bawah median Bali ({median_yield} ton/ha); "
                "disarankan evaluasi varietas dan drainase."
            )
        default_headline = (
            f"Data observasi tahun {selected_year} di {reg_name} mencatat rata-rata produktivitas "
            f"{avg_yield} ton/ha (Kategori {harvest_category}) dengan indeks kehijauan NDVI {avg_ndvi:.3f}, "
            f"suhu permukaan {avg_lst:.1f} °C, dan curah hujan {avg_rain:,.0f} mm."
        ).replace(",", ".")

    # Key drivers combining environmental baselines with Model B regional context
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

    monthly_observations = sorted(
        [
            {
                "month": int(record.bulan),
                "ndvi": round(float(record.ndvi), 3),
                "lst": round(float(record.lst), 1),
                "rainfall": round(float(record.rainfall), 1),
                "productivity": (
                    round(float(record.produktivitas) / 10 if float(record.produktivitas) > 20 else float(record.produktivitas), 2)
                    if record.produktivitas is not None else None
                ),
            }
            for record in region_records
        ],
        key=lambda item: item["month"],
    )

    synthesis = get_or_create_insight_synthesis(
        db=db,
        run=run,
        region_id=_to_region_id(reg_name or "tabanan"),
        region_name=reg_name,
        year=selected_year,
        selected_metric=matched_ranking,
        ranking=regional_ranking,
        monthly_observations=monthly_observations,
        harvest_category=harvest_category,
        default_headline=default_headline,
        default_note=harvest_note,
        force_refresh=force_refresh,
    )

    return {
        "year": selected_year,
        "run_id": run.id if run else None,
        "model_key": (
            _training_run_metadata(run).get("model_key") if run else None
        ),
        "region_name": reg_name,
        "observation_count": len(region_records),
        "productivity_observation_count": len(target_values),
        "averages": averages,
        "selected_region": (
            {
                "name": reg_name,
                "average_productivity_ton_ha": averages["productivity_ton_ha"],
                "samples": len(target_values),
            }
            if region_records else None
        ),
        "regional_ranking": regional_ranking,
        "monthly_observations": monthly_observations,
        "headlineSummary": synthesis["headlineSummary"],
        "harvestCategory": harvest_category,
        "harvestCategoryNote": synthesis["harvestCategoryNote"],
        "keyDrivers": key_drivers,
        "conclusion": synthesis.get("conclusion"),
        "aiMeta": synthesis.get("aiMeta"),
        "parcels": [],
    }


@app.get("/api/insight/data")
def get_insight_data(
    region: Optional[str] = None,
    year: Optional[int] = None,
    run_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    run = _select_training_run(db, run_id)
    return _build_insight_payload(db=db, run=run, region=region, year=year, force_refresh=False)


@app.post("/api/admin/insight/regenerate")
def regenerate_insight_summary(
    region: str = "tabanan",
    year: int = 2025,
    run_id: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    run = _select_training_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Belum ada training run aktif.")
    payload = _build_insight_payload(db=db, run=run, region=region, year=year, force_refresh=True)
    return {
        "region": payload["region_name"],
        "year": payload["year"],
        "run_id": payload["run_id"],
        "regenerated_by": admin.email,
        "headlineSummary": payload["headlineSummary"],
        "harvestCategoryNote": payload["harvestCategoryNote"],
        "conclusion": payload.get("conclusion"),
        "aiMeta": payload.get("aiMeta"),
    }


@app.get("/api/analysis/data")
def get_analysis_data(
    region: Optional[str] = None,
    year: Optional[int] = None,
    run_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    run = _select_training_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Belum ada hasil training untuk dianalisis.")

    run_metadata = _training_run_metadata(run)
    shap_results = json.loads(run.shap_data) if run.shap_data else []
    stored_ale = json.loads(run.ale_data) if run.ale_data else {}
    feature_importance_scope = "global_training_run"
    if region:
        normalized_region = _normalize_region_name(region)
        regional_shap = run_metadata.get("shap_by_region", {})
        for district, data in regional_shap.items():
            if _normalize_region_name(district) == normalized_region:
                shap_results = data.get("features", [])
                feature_importance_scope = data.get("scope", "regional_training_run")
                break

    regional_ale = run_metadata.get("ale_by_region", {})
    regional_ale_selected = False
    if region:
        normalized_region = _normalize_region_name(region)
        for district, curves in regional_ale.items():
            if _normalize_region_name(district) == normalized_region:
                stored_ale = curves
                regional_ale_selected = True
                break

    feature_titles = {
        "NDVI": "NDVI",
        "LST": "Land Surface Temperature",
        "Rainfall": "Rainfall",
        "Produktivitas_lag1": "Produktivitas Lag-1",
        "Produktivitas_roll3_lag1": "Produktivitas Rolling-3",
    }
    feature_units = {
        "NDVI": "indeks",
        "LST": "°C",
        "Rainfall": "mm",
        "Produktivitas_lag1": "ku/ha",
        "Produktivitas_roll3_lag1": "ku/ha",
    }
    ale_curves = {}
    ale_keys = (
        tuple(stored_ale)
        if regional_ale_selected
        else ("NDVI", "LST", "Rainfall")
    )
    for key in ale_keys:
        response_key = key.lower()
        ale_curves[response_key] = {
            "featureKey": response_key,
            "featureTitle": feature_titles.get(key, key),
            "unit": feature_units.get(key, ""),
            "currentObservedValue": None,
            "baseline": None,
            "summaryText": (
                f"Kurva ALE untuk training run {run.id}; "
                "bukan interpretasi agronomis."
            ),
            "dataPoints": [
                {
                    "featureValue": point["x"],
                    "aleEffect": point["y"],
                    "observationCount": point.get("n"),
                }
                for point in stored_ale.get(key, [])
            ],
        }

    return {
        "region": _normalize_region_name(region or ""),
        "region_name": region or "",
        "year": year,
        "run_id": run.id,
        "model_key": run_metadata.get("model_key"),
        "model_name": run.best_model,
        "validation_scheme": run.validation_scheme,
        "feature_importance_scope": feature_importance_scope,
        "ale_scope": (
            "final_model_by_region"
            if regional_ale_selected else "final_model_global"
        ),
        "features": shap_results,
        "ale": ale_curves,
    }
