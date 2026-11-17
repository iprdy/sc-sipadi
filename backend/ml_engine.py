"""
SI-PADI ML Engine
-----------------
Research-aligned monthly rice-productivity modelling engine.

Important:
- Upload the CLEAN MASTER dataset (864 rows), not the supervised dataset.
- Missing PRODUCTIVITY targets are retained in the master and are never imputed.
- Features are generated chronologically per district/city.
- Validation and 2025 testing use rolling-origin one-step-ahead evaluation
  with an expanding training window.
- The active model and hyperparameters are read from model_config.py.
- The rolling-monthly evaluation is not claimed to be identical to a research
  notebook unless its split method is independently verified.
- The model factory can switch to Random Forest without changing the
  feature-engineering, preprocessing, evaluation, SHAP/ALE or artifact code.
"""

from __future__ import annotations

import uuid
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
import shap

from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from xgboost import XGBRegressor

try:
    from .model_config import (
        MODEL_REGISTRY,
        get_active_model_config,
        get_model_config,
    )
    from .validator import validate_master_dataset
except ImportError:
    # Supports running the module from inside the backend directory.
    from model_config import (
        MODEL_REGISTRY,
        get_active_model_config,
        get_model_config,
    )
    from validator import validate_master_dataset


# ============================================================
# PATHS AND MODEL CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "artifacts"
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

TARGET = "Produktivitas"

KEYS = ["Kabupaten", "Tahun", "Bulan"]

CATEGORICAL_FEATURES = ["Kabupaten"]

NUMERIC_FEATURES = [
    "Tahun",
    "Bulan",
    "NDVI",
    "LST",
    "Rainfall",
    "Produktivitas_lag1",
    "Produktivitas_roll3_lag1",
    "sin_month",
    "cos_month",
]

FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES

REGIONAL_ALE_FEATURES = [
    "NDVI",
    "LST",
    "Rainfall",
    "Produktivitas_lag1",
    "Produktivitas_roll3_lag1",
]

MASTER_REQUIRED_COLUMNS = [
    "Kabupaten",
    "Tahun",
    "Bulan",
    "NDVI",
    "LST",
    "Rainfall",
    "Produktivitas",
]

RANDOM_STATE = 42

# Backward-compatible constant. The active configuration is maintained in
# model_config.py so estimator and parameters can be changed in one place.
XGB_BASELINE_PARAMS: Dict[str, Any] = {
    "n_estimators": 100,
    "learning_rate": 0.1,
    "max_depth": 3,
    "objective": "reg:squarederror",
    "random_state": RANDOM_STATE,
    "n_jobs": 1,
}

VALIDATION_START = "2022-01-01"
VALIDATION_END = "2024-12-01"
FINAL_TEST_START = "2025-01-01"
FINAL_TEST_END = "2025-12-01"
INITIAL_TRAIN_END = "2021-12-01"
VALIDATION_SCHEME = (
    "Rolling-origin one-step-ahead expanding window; validation "
    "Jan 2022-Dec 2024; final test Jan-Dec 2025"
)


# ============================================================
# DATA VALIDATION AND FEATURE ENGINEERING
# ============================================================

def validate_master_for_modeling(
    df: pd.DataFrame,
    master_is_validated: bool = False,
) -> pd.DataFrame:
    """
    Delegate validation to validator.py unless the upload endpoint already
    validated this master dataset.
    The model engine then keeps only columns required by Model B.
    """
    data = (
        df.copy()
        if master_is_validated
        else validate_master_dataset(df)
    )
    data = data[MASTER_REQUIRED_COLUMNS].copy()

    data["Date"] = pd.to_datetime(
        dict(year=data["Tahun"], month=data["Bulan"], day=1)
    )
    data = data.sort_values(
        ["Kabupaten", "Date"]
    ).reset_index(drop=True)

    return data


def create_temporal_features(
    df_master: pd.DataFrame,
    master_is_validated: bool = False,
) -> pd.DataFrame:
    """
    Create lag-1, lagged rolling-3, and cyclic month features.
    Target history is shifted before rolling; no current/future target
    value is used to construct the features for the same row.
    """
    data = validate_master_for_modeling(
        df_master,
        master_is_validated=master_is_validated,
    )

    data["sin_month"] = np.sin(
        2 * np.pi * (data["Bulan"] - 1) / 12
    )
    data["cos_month"] = np.cos(
        2 * np.pi * (data["Bulan"] - 1) / 12
    )

    grouped_target = data.groupby("Kabupaten", sort=False)[TARGET]

    data["Produktivitas_lag1"] = grouped_target.shift(1)

    data["Produktivitas_roll3_lag1"] = (
        data.groupby("Kabupaten", sort=False)[TARGET]
        .transform(
            lambda series: series.shift(1).rolling(
                window=3, min_periods=3
            ).mean()
        )
    )

    # Keep missing targets and unavailable initial lag rows out of the
    # supervised table. No target/lag imputation is performed.
    data = data.sort_values(
        ["Tahun", "Bulan", "Kabupaten"]
    ).reset_index(drop=True)

    return data


def prepare_supervised_dataset(
    df_master: pd.DataFrame,
    master_is_validated: bool = False,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Returns:
      df_supervised: rows with complete features and observed target
      df_features_all: feature-engineered master, including missing targets
    """
    df_features_all = create_temporal_features(
        df_master,
        master_is_validated=master_is_validated,
    )

    required = FEATURES + [TARGET]

    df_supervised = df_features_all.dropna(
        subset=required
    ).copy()

    df_supervised = df_supervised.sort_values(
        ["Date", "Kabupaten"]
    ).reset_index(drop=True)

    if df_supervised.empty:
        raise ValueError("Tidak ada observasi supervised yang dapat digunakan.")

    if df_supervised[required].isna().any().any():
        raise ValueError("Supervised dataset masih mengandung missing value.")

    return df_supervised, df_features_all


def build_prediction_features(
    kabupaten: str,
    tahun: int,
    bulan: int,
    ndvi: float,
    lst: float,
    rainfall: float,
    history: pd.DataFrame,
) -> pd.DataFrame:
    """Build the exact Model B feature row from the three prior calendar months."""
    try:
        numeric_inputs = np.asarray(
            [tahun, bulan, ndvi, lst, rainfall],
            dtype=float,
        )
    except (OverflowError, TypeError, ValueError):
        raise ValueError("Tahun, bulan, NDVI, LST, dan Rainfall harus numerik.") from None
    if not np.isfinite(numeric_inputs).all():
        raise ValueError("Tahun, bulan, NDVI, LST, dan Rainfall harus finite.")

    numeric_year, numeric_month = numeric_inputs[:2]
    if not numeric_year.is_integer() or not numeric_month.is_integer():
        raise ValueError("Tahun dan bulan harus berupa bilangan bulat.")
    year = int(numeric_year)
    month = int(numeric_month)

    if not 1 <= month <= 12:
        raise ValueError("Bulan prediksi harus berada pada rentang 1-12.")

    ndvi_value, lst_value, rainfall_value = numeric_inputs[2:]
    if not -1 <= ndvi_value <= 1:
        raise ValueError("NDVI harus berada pada rentang -1 sampai 1.")
    if rainfall_value < 0:
        raise ValueError("Rainfall tidak boleh negatif.")

    required_history = {"Tahun", "Bulan", "Produktivitas"}
    if not required_history.issubset(history.columns):
        raise ValueError(
            "Data riwayat harus memiliki kolom Tahun, Bulan, dan Produktivitas."
        )

    try:
        target_date = pd.Timestamp(year=year, month=month, day=1)
    except (OverflowError, ValueError):
        raise ValueError("Tahun dan bulan tidak membentuk tanggal yang valid.") from None
    prior_dates = [
        target_date - pd.DateOffset(months=offset)
        for offset in (3, 2, 1)
    ]

    prior_history = history.loc[:, ["Tahun", "Bulan", "Produktivitas"]].copy()
    prior_history["Date"] = pd.to_datetime(
        dict(
            year=pd.to_numeric(prior_history["Tahun"], errors="coerce"),
            month=pd.to_numeric(prior_history["Bulan"], errors="coerce"),
            day=1,
        ),
        errors="coerce",
    )
    prior_history = prior_history[prior_history["Date"].isin(prior_dates)]

    if prior_history["Date"].duplicated().any():
        raise ValueError("Riwayat produktivitas memiliki bulan duplikat.")

    values_by_date = prior_history.set_index("Date")["Produktivitas"]
    missing_dates = [
        date
        for date in prior_dates
        if date not in values_by_date.index
        or pd.isna(values_by_date.loc[date])
    ]
    if missing_dates:
        missing_labels = ", ".join(date.strftime("%Y-%m") for date in missing_dates)
        raise ValueError(
            "Riwayat produktivitas tiga bulan kalender sebelumnya belum lengkap "
            f"atau bernilai NULL: {missing_labels}."
        )

    prior_values = pd.to_numeric(
        values_by_date.loc[prior_dates],
        errors="coerce",
    ).to_numpy(dtype=float)
    if not np.isfinite(prior_values).all() or (prior_values <= 0).any():
        raise ValueError(
            "Produktivitas pada tiga bulan sebelumnya harus berupa nilai "
            "terukur yang valid."
        )

    row = {
        "Kabupaten": str(kabupaten).strip(),
        "Tahun": year,
        "Bulan": month,
        "NDVI": float(ndvi_value),
        "LST": float(lst_value),
        "Rainfall": float(rainfall_value),
        "Produktivitas_lag1": float(prior_values[-1]),
        "Produktivitas_roll3_lag1": float(np.mean(prior_values)),
        "sin_month": float(np.sin(2 * np.pi * (month - 1) / 12)),
        "cos_month": float(np.cos(2 * np.pi * (month - 1) / 12)),
    }
    return pd.DataFrame([row], columns=FEATURES)


# ============================================================
# PREPROCESSOR AND MODEL PIPELINE
# ============================================================

def build_preprocessor() -> ColumnTransformer:
    """
    One-Hot Encode Kabupaten.
    Numeric variables are passed through unchanged; tree-based XGBoost
    does not require standard scaling.
    """
    try:
        one_hot = OneHotEncoder(
            handle_unknown="ignore",
            sparse_output=True,
        )
    except TypeError:
        # Compatibility with older scikit-learn releases.
        one_hot = OneHotEncoder(
            handle_unknown="ignore",
            sparse=True,
        )

    return ColumnTransformer(
        transformers=[
            ("district", one_hot, CATEGORICAL_FEATURES),
            ("numeric", "passthrough", NUMERIC_FEATURES),
        ],
        remainder="drop",
        verbose_feature_names_out=True,
    )


def _resolve_model_config(
    model_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if model_config is None:
        config = get_active_model_config()
    elif isinstance(model_config, str):
        config = get_model_config(model_config)
    else:
        config = {
            "model_key": model_config.get("model_key"),
            "name": model_config.get("name"),
            "algorithm": model_config.get("algorithm"),
            "params": dict(model_config.get("params") or {}),
        }

    required = ("model_key", "name", "algorithm", "params")
    if any(not config.get(key) for key in required):
        raise ValueError(
            "Konfigurasi model harus memiliki model_key, name, algorithm, dan params."
        )
    if config["algorithm"] not in MODEL_REGISTRY:
        raise ValueError(
            f"Algoritma '{config['algorithm']}' belum terdaftar. "
            f"Pilihan: {sorted(MODEL_REGISTRY)}"
        )
    return config


def build_model_pipeline(
    params: Optional[Dict[str, Any]] = None,
    model_config: Optional[Dict[str, Any]] = None,
) -> Pipeline:
    """
    Build the explicitly configured model pipeline.

    Change algorithm/name/initial parameters in model_config.py. Optional
    params passed here override the configured estimator parameters.
    """
    config = _resolve_model_config(model_config)
    algorithm = config["algorithm"]

    estimator_class = MODEL_REGISTRY[algorithm]
    model_params = dict(config["params"])
    if params:
        model_params.update(params)

    return Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            ("model", estimator_class(**model_params)),
        ]
    )


def build_xgboost_pipeline(
    params: Optional[Dict[str, Any]] = None,
    model_config: Optional[Dict[str, Any]] = None,
) -> Pipeline:
    """Build the configured XGBoost estimator with the shared preprocessing."""
    config = _resolve_model_config(model_config)
    if config["algorithm"] != "xgboost":
        raise ValueError("build_xgboost_pipeline hanya mendukung algoritma XGBoost.")
    model_params = dict(config["params"])
    if params:
        model_params.update(params)

    return Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            ("model", MODEL_REGISTRY["xgboost"](**model_params)),
        ]
    )


# ============================================================
# METRICS
# ============================================================

def calculate_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> Dict[str, float]:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    valid = np.isfinite(y_true) & np.isfinite(y_pred)
    y_true = y_true[valid]
    y_pred = y_pred[valid]

    if len(y_true) == 0:
        return {
            "n": 0, "mae": np.nan, "rmse": np.nan, "r2": np.nan,
            "bias": np.nan, "wape_pct": np.nan,
            "mape_nonzero_pct": np.nan, "smape_pct": np.nan,
        }

    errors = y_pred - y_true
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred) if len(y_true) >= 2 else np.nan
    bias = np.mean(errors)

    sum_actual = np.sum(np.abs(y_true))
    wape = (
        np.sum(np.abs(errors)) / sum_actual * 100
        if sum_actual > 0 else np.nan
    )

    nonzero = y_true != 0
    mape = (
        np.mean(np.abs(errors[nonzero] / y_true[nonzero])) * 100
        if nonzero.any() else np.nan
    )

    denominator = np.abs(y_true) + np.abs(y_pred)
    smape_values = np.divide(
        2 * np.abs(errors),
        denominator,
        out=np.zeros_like(errors, dtype=float),
        where=denominator != 0,
    )
    smape = np.mean(smape_values) * 100

    return {
        "n": int(len(y_true)),
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2) if np.isfinite(r2) else np.nan,
        "bias": float(bias),
        "wape_pct": float(wape) if np.isfinite(wape) else np.nan,
        "mape_nonzero_pct": float(mape) if np.isfinite(mape) else np.nan,
        "smape_pct": float(smape),
    }


# ============================================================
# ROLLING-ORIGIN EXPANDING-WINDOW EVALUATION
# ============================================================

def _evaluate_monthly_origins(
    df_supervised: pd.DataFrame,
    start: str,
    end: str,
    initial_train_end: str,
    label: str,
    model_params: Optional[Dict[str, Any]] = None,
    model_config: Optional[Dict[str, Any]] = None,
    oof_shap_by_region: Optional[Dict[str, List[Dict[str, float]]]] = None,
) -> Tuple[Dict[str, float], pd.DataFrame, pd.DataFrame]:
    """
    At each monthly origin:
      - train on all supervised observations strictly before that month
      - predict all available district/city rows in that month
      - move to the next month and expand the training window

    Lag/rolling features are based only on earlier observed target values.
    """
    start_date = pd.Timestamp(start)
    end_date = pd.Timestamp(end)
    initial_end = pd.Timestamp(initial_train_end)

    period_starts = pd.date_range(
        start=start_date,
        end=end_date,
        freq="MS",
    )

    predictions = []
    origin_metrics = []

    for origin in period_starts:
        train_data = df_supervised[
            df_supervised["Date"] < origin
        ].copy()

        valid_data = df_supervised[
            df_supervised["Date"] == origin
        ].copy()

        if origin <= initial_end:
            continue

        if train_data.empty or valid_data.empty:
            print(
                f"{label}: {origin:%Y-%m} dilewati "
                "(training/validation tidak tersedia)."
            )
            continue

        X_train = train_data[FEATURES]
        y_train = train_data[TARGET]
        X_valid = valid_data[FEATURES]

        model = build_model_pipeline(model_params, model_config=model_config)
        model.fit(X_train, y_train)

        y_pred = model.predict(X_valid)
        y_true = valid_data[TARGET].to_numpy(dtype=float)

        if oof_shap_by_region is not None:
            row_importances = _compute_shap_importances_by_row(model, X_valid)
            for district, importances in zip(
                valid_data["Kabupaten"].astype(str),
                row_importances,
            ):
                oof_shap_by_region.setdefault(district, []).append(importances)

        month_result = calculate_metrics(y_true, y_pred)

        origin_metrics.append({
            "Origin": origin,
            "Tahun": origin.year,
            "Bulan": origin.month,
            **month_result,
        })

        detail = valid_data[
            ["Kabupaten", "Tahun", "Bulan", "Date", TARGET]
        ].copy()
        detail["Prediksi"] = y_pred
        detail["Error"] = detail["Prediksi"] - detail[TARGET]
        detail["Evaluation"] = label
        detail["Origin"] = origin

        predictions.append(detail)

        print(
            f"{label}: {origin:%Y-%m} selesai | "
            f"training={len(train_data)} | "
            f"prediksi={len(valid_data)}"
        )

    if not predictions:
        raise ValueError(
            f"Tidak ada prediksi yang dihasilkan untuk {label}."
        )

    prediction_df = pd.concat(
        predictions, ignore_index=True
    )

    origin_metrics_df = pd.DataFrame(origin_metrics)

    pooled_metrics = calculate_metrics(
        prediction_df[TARGET].to_numpy(),
        prediction_df["Prediksi"].to_numpy(),
    )

    return pooled_metrics, prediction_df, origin_metrics_df


def evaluate_temporal_validation(
    df_supervised: pd.DataFrame,
    model_params: Optional[Dict[str, Any]] = None,
    model_config: Optional[Dict[str, Any]] = None,
) -> Tuple[Dict[str, float], pd.DataFrame, pd.DataFrame]:
    """Rolling-origin one-step-ahead validation for Jan 2022-Dec 2024."""
    return _evaluate_monthly_origins(
        df_supervised=df_supervised,
        start=VALIDATION_START,
        end=VALIDATION_END,
        initial_train_end=INITIAL_TRAIN_END,
        label="Temporal Validation",
        model_params=model_params,
        model_config=model_config,
    )


def evaluate_final_test(
    df_supervised: pd.DataFrame,
    model_params: Optional[Dict[str, Any]] = None,
    model_config: Optional[Dict[str, Any]] = None,
    oof_shap_by_region: Optional[Dict[str, List[Dict[str, float]]]] = None,
) -> Tuple[Dict[str, float], pd.DataFrame, pd.DataFrame]:
    """Rolling-origin one-step-ahead final test for Jan-Dec 2025."""
    return _evaluate_monthly_origins(
        df_supervised=df_supervised,
        start=FINAL_TEST_START,
        end=FINAL_TEST_END,
        initial_train_end=INITIAL_TRAIN_END,
        label="Final Test 2025",
        model_params=model_params,
        model_config=model_config,
        oof_shap_by_region=oof_shap_by_region,
    )


# ============================================================
# FINAL FIT AND MODEL ARTIFACT
# ============================================================

def fit_final_model(
    df_supervised: pd.DataFrame,
    model_params: Optional[Dict[str, Any]] = None,
    model_config: Optional[Dict[str, Any]] = None,
) -> Pipeline:
    """
    Fit the deployable model on all available supervised observations.
    Run temporal validation and 2025 final testing BEFORE calling this
    function if those evaluation results are to remain independent.
    """
    model = build_model_pipeline(model_params, model_config=model_config)
    model.fit(
        df_supervised[FEATURES],
        df_supervised[TARGET],
    )
    return model


def save_model_artifact(
    run_id: str,
    best_model_name: str,
    model: Pipeline,
    metadata: Optional[Dict[str, Any]] = None,
    model_config: Optional[Dict[str, Any]] = None,
) -> str:
    artifact_path = ARTIFACT_DIR / f"{run_id}.joblib"
    if artifact_path.exists():
        raise FileExistsError("Model artifact path already exists.")

    config = _resolve_model_config(model_config)
    model_name = best_model_name or config["name"]
    estimator = model.named_steps.get("model")
    if estimator is None:
        raise ValueError("Artifact harus berisi estimator pada Pipeline.")

    payload = {
        "run_id": run_id,
        "model_key": config["model_key"],
        "model_name": model_name,
        "best_model_name": model_name,
        "algorithm": config["algorithm"],
        "model_params": dict(config["params"]),
        "estimator_params": estimator.get_params(deep=False),
        "model": model,
        "pipeline": model,
        "preprocessing_pipeline": model.named_steps["preprocessor"],
        "preprocessor": model.named_steps["preprocessor"],
        "features": FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "target": TARGET,
        "created_at": pd.Timestamp.now().isoformat(),
        "metadata": metadata or {},
    }

    temporary_path = ARTIFACT_DIR / (
        f".{artifact_path.name}.{uuid.uuid4().hex}.tmp"
    )
    try:
        joblib.dump(payload, temporary_path)
        temporary_path.replace(artifact_path)
    finally:
        if temporary_path.exists():
            temporary_path.unlink()
    return str(artifact_path)


@lru_cache(maxsize=8)
def _load_model_artifact_cached(
    artifact_path: str,
    modified_time_ns: int,
) -> Dict[str, Any]:
    del modified_time_ns
    return joblib.load(artifact_path)


def load_model_artifact(artifact_path: str) -> Dict[str, Any]:
    path = Path(artifact_path).resolve()
    if not path.exists():
        raise FileNotFoundError("Model artifact tidak ditemukan.")
    return _load_model_artifact_cached(str(path), path.stat().st_mtime_ns)


# ============================================================
# SHAP ANALYSIS
# ============================================================

def _aggregate_encoded_feature_name(name: str) -> str:
    """Map one-hot encoded district columns back to Kabupaten."""
    if "Kabupaten_" in name or "district__Kabupaten_" in name:
        return "Kabupaten"

    for prefix in ("numeric__", "district__"):
        if name.startswith(prefix):
            return name[len(prefix):]

    return name


def _compute_shap_importances_by_row(
    model: Pipeline,
    X: pd.DataFrame,
) -> List[Dict[str, float]]:
    if X.empty:
        return []

    sample = X[FEATURES].copy()
    preprocessor = model.named_steps["preprocessor"]
    estimator = model.named_steps["model"]
    transformed = preprocessor.transform(sample)

    try:
        feature_names = preprocessor.get_feature_names_out()
    except Exception:
        feature_names = np.array([
            f"feature_{i}" for i in range(transformed.shape[1])
        ])

    shap_values = np.asarray(
        shap.TreeExplainer(estimator).shap_values(transformed)
    )
    if shap_values.ndim == 3:
        shap_values = shap_values[:, :, 0]
    if shap_values.ndim != 2 or shap_values.shape[1] != len(feature_names):
        raise ValueError("Dimensi SHAP tidak cocok dengan fitur Pipeline.")

    grouped_indices: Dict[str, List[int]] = {}
    for index, encoded_name in enumerate(feature_names):
        feature_name = _aggregate_encoded_feature_name(str(encoded_name))
        grouped_indices.setdefault(feature_name, []).append(index)

    rows = []
    for row_values in shap_values:
        grouped_values = {}
        for feature_name, indices in grouped_indices.items():
            grouped_values[feature_name] = float(
                np.abs(row_values[indices]).sum()
            )
        rows.append(grouped_values)
    return rows


def compute_shap_analysis(
    model: Pipeline,
    X: pd.DataFrame,
    max_samples: int = 300,
) -> List[Dict[str, Any]]:
    if X.empty:
        return []

    grouped: Dict[str, float] = {}
    row_importances = _compute_shap_importances_by_row(
        model,
        X[FEATURES].head(max_samples),
    )
    for row in row_importances:
        for feature, value in row.items():
            grouped[feature] = grouped.get(feature, 0.0) + value
    if row_importances:
        grouped = {
            feature: value / len(row_importances)
            for feature, value in grouped.items()
        }

    display_names = {
        "Kabupaten": "Kabupaten/Kota",
        "Tahun": "Tahun",
        "Bulan": "Bulan",
        "NDVI": "NDVI",
        "LST": "Land Surface Temperature",
        "Rainfall": "Curah Hujan",
        "Produktivitas_lag1": "Produktivitas Lag-1",
        "Produktivitas_roll3_lag1": "Produktivitas Rolling-3",
        "sin_month": "Sinus Bulan",
        "cos_month": "Cosinus Bulan",
    }

    result = []
    total = sum(grouped.values())

    for feature, value in sorted(
        grouped.items(), key=lambda item: item[1], reverse=True
    ):
        result.append({
            "feature": feature,
            "importance": round(value, 6),
            "displayName": display_names.get(feature, feature),
            "importance_pct": round(value / total * 100, 4)
            if total > 0 else 0.0,
        })

    return result


def summarize_oof_shap_by_region(
    oof_shap_by_region: Dict[str, List[Dict[str, float]]],
) -> Dict[str, Dict[str, Any]]:
    display_names = {
        "Kabupaten": "Kabupaten/Kota",
        "Tahun": "Tahun",
        "Bulan": "Bulan",
        "NDVI": "NDVI",
        "LST": "Land Surface Temperature",
        "Rainfall": "Curah Hujan",
        "Produktivitas_lag1": "Produktivitas Lag-1",
        "Produktivitas_roll3_lag1": "Produktivitas Rolling-3",
        "sin_month": "Sinus Bulan",
        "cos_month": "Cosinus Bulan",
    }

    regional_results = {}
    for district, rows in oof_shap_by_region.items():
        if not rows:
            continue
        features = sorted(
            {feature for row in rows for feature in row},
            key=lambda feature: sum(row.get(feature, 0.0) for row in rows),
            reverse=True,
        )
        mean_importance = {
            feature: float(np.mean([row.get(feature, 0.0) for row in rows]))
            for feature in features
        }
        total = sum(mean_importance.values())
        regional_results[district] = {
            "scope": "rolling_origin_2025_oof",
            "n_observations": len(rows),
            "features": [
                {
                    "feature": feature,
                    "importance": round(mean_importance[feature], 6),
                    "displayName": display_names.get(feature, feature),
                    "importance_pct": (
                        round(mean_importance[feature] / total * 100, 4)
                        if total > 0 else 0.0
                    ),
                }
                for feature in features
            ],
        }
    return regional_results


# ============================================================
# FIRST-ORDER ALE FOR NUMERIC FEATURES
# ============================================================

def compute_ale_curves(
    model: Pipeline,
    X: pd.DataFrame,
    bins: int = 12,
    features: Optional[List[str]] = None,
) -> Dict[str, List[Dict[str, float]]]:
    """
    First-order accumulated local effects for numeric features.
    Kabupaten is excluded because it is categorical.
    """
    ale_results: Dict[str, List[Dict[str, float]]] = {}

    if X.empty:
        return ale_results

    selected_features = features or NUMERIC_FEATURES
    unknown_features = set(selected_features) - set(NUMERIC_FEATURES)
    if unknown_features:
        raise ValueError(
            f"ALE hanya mendukung fitur numerik Model B: {sorted(unknown_features)}"
        )

    for feature in selected_features:
        series = pd.to_numeric(X[feature], errors="coerce").dropna()

        if series.nunique() < 4:
            continue

        quantiles = np.linspace(0, 1, bins + 1)
        edges = np.unique(series.quantile(quantiles).to_numpy())

        if len(edges) < 3:
            continue

        # Assign observations to quantile intervals.
        bin_codes = pd.cut(
            series,
            bins=edges,
            include_lowest=True,
            labels=False,
            duplicates="drop",
        )

        local_effects = []
        centers = []
        weights = []

        for bin_id in sorted(pd.Series(bin_codes).dropna().unique()):
            indices = bin_codes.index[bin_codes == bin_id]
            if len(indices) == 0:
                continue

            lower = float(edges[int(bin_id)])
            upper = float(edges[int(bin_id) + 1])

            lower_data = X.loc[indices, FEATURES].copy()
            upper_data = X.loc[indices, FEATURES].copy()

            lower_data[feature] = lower
            upper_data[feature] = upper

            difference = (
                model.predict(upper_data) -
                model.predict(lower_data)
            )

            local_effects.append(float(np.mean(difference)))
            centers.append(float(series.loc[indices].mean()))
            weights.append(int(len(indices)))

        if not local_effects:
            continue

        accumulated = np.cumsum(np.asarray(local_effects))
        weights_array = np.asarray(weights, dtype=float)

        # Center ALE around its weighted mean.
        weighted_mean = np.average(accumulated, weights=weights_array)
        centered = accumulated - weighted_mean

        ale_results[feature] = [
            {
                "x": round(float(x), 5),
                "y": round(float(y), 6),
                "n": int(n),
            }
            for x, y, n in zip(centers, centered, weights)
        ]

    return ale_results


def compute_regional_ale_curves(
    model: Pipeline,
    X: pd.DataFrame,
    bins: int = 6,
) -> Dict[str, Dict[str, List[Dict[str, float]]]]:
    regional_results = {}
    for district, row_indices in X.groupby("Kabupaten", sort=True).groups.items():
        district_rows = X.loc[row_indices, FEATURES]
        regional_results[str(district)] = compute_ale_curves(
            model,
            district_rows,
            bins=bins,
            features=REGIONAL_ALE_FEATURES,
        )
    return regional_results


# ============================================================
# HIGH-LEVEL TRAINING ORCHESTRATION
# ============================================================

def run_research_training(
    df_master: pd.DataFrame,
    model_params: Optional[Dict[str, Any]] = None,
    save_artifact: bool = True,
    model_config: Optional[Dict[str, Any]] = None,
    master_is_validated: bool = False,
) -> Dict[str, Any]:
    """
    Full workflow:
      1. Validate master
      2. Create temporal features
      3. Rolling-origin temporal validation (2022-2024)
      4. Rolling-origin final test (2025)
      5. Fit deployable model on all available supervised rows
      6. Compute SHAP and ALE
      7. Save artifact
    """
    df_supervised, df_features_all = prepare_supervised_dataset(
        df_master,
        master_is_validated=master_is_validated,
    )
    resolved_config = _resolve_model_config(model_config)
    if model_params:
        resolved_config["params"].update(model_params)

    print("=" * 60)
    print("SI-PADI DATASET AUDIT")
    print("=" * 60)
    print("Master rows:", len(df_master))
    print("Supervised rows:", len(df_supervised))
    print("Missing target in master:", df_master[TARGET].isna().sum())
    print("Supervised target missing:", df_supervised[TARGET].isna().sum())
    print("Districts:", df_supervised["Kabupaten"].nunique())

    temporal_metrics, temporal_predictions, temporal_origins = (
        evaluate_temporal_validation(
            df_supervised,
            model_config=resolved_config,
        )
    )

    oof_shap_rows_by_region: Dict[str, List[Dict[str, float]]] = {}
    test_metrics, test_predictions, test_origins = (
        evaluate_final_test(
            df_supervised,
            model_config=resolved_config,
            oof_shap_by_region=oof_shap_rows_by_region,
        )
    )

    # The final deployable model is fitted only after independent evaluation.
    final_model = fit_final_model(
        df_supervised,
        model_config=resolved_config,
    )

    shap_data = compute_shap_analysis(
        final_model,
        df_supervised[FEATURES],
    )
    ale_data = compute_ale_curves(
        final_model,
        df_supervised[FEATURES],
    )
    shap_by_region = summarize_oof_shap_by_region(oof_shap_rows_by_region)
    ale_by_region = compute_regional_ale_curves(
        final_model,
        df_supervised[FEATURES],
        bins=6,
    )

    run_id = str(uuid.uuid4())
    artifact_path = None

    model_name = resolved_config["name"]
    effective_params = dict(resolved_config["params"])

    if save_artifact:
        artifact_path = save_model_artifact(
            run_id=run_id,
            best_model_name=model_name,
            model=final_model,
            metadata={
                "master_rows": int(len(df_master)),
                "supervised_rows": int(len(df_supervised)),
                "temporal_validation": temporal_metrics,
                "final_test_2025": test_metrics,
                "temporal_validation_origins": len(temporal_origins),
                "final_test_origins": len(test_origins),
                "final_test_predictions": len(test_predictions),
                "global_shap_scope": "final_model_in_sample",
                "algorithm": resolved_config["algorithm"],
                "model_key": resolved_config["model_key"],
                "model_name": model_name,
                "model_params": effective_params,
                "validation_scheme": VALIDATION_SCHEME,
            },
            model_config=resolved_config,
        )

    return {
        "run_id": run_id,
        "model_key": resolved_config["model_key"],
        "model_name": model_name,
        "model_config": resolved_config,
        "model": final_model,
        "supervised_dataset": df_supervised,
        "feature_engineered_master": df_features_all,
        "temporal_validation_metrics": temporal_metrics,
        "temporal_validation_predictions": temporal_predictions,
        "temporal_validation_origins": temporal_origins,
        "final_test_metrics": test_metrics,
        "final_test_predictions": test_predictions,
        "final_test_origins": test_origins,
        "shap_data": shap_data,
        "shap_by_region": shap_by_region,
        "ale_data": ale_data,
        "ale_by_region": ale_by_region,
        "model_path": artifact_path,
    }


# ============================================================
# LEGACY ADAPTER
# ============================================================

def train_dual_models(
    df: pd.DataFrame,
) -> Tuple[str, Any, Dict[str, Dict[str, float]], pd.DataFrame, pd.DataFrame]:
    """
    Temporary adapter for older main.py code that still calls
    train_dual_models(). It trains only the currently active model from
    model_config.py; it does not compare two algorithms.

    Returns the same five-item tuple shape as the old function:
      model name, model, evaluations, X, X_test

    Update main.py to use run_research_training() for full evaluation
    outputs and avoid relying on this compatibility adapter long-term.
    """
    result = run_research_training(df, save_artifact=True)

    evaluations = {
        f"{result['model_name']} - Temporal Validation":
            result["temporal_validation_metrics"],
        f"{result['model_name']} - Final Test 2025":
            result["final_test_metrics"],
    }

    X = result["supervised_dataset"][FEATURES].copy()
    # Keep the legacy five-item return contract. The old main.py currently
    # ignores this fifth value; return the feature rows for the 2025 period.
    test_mask = result["supervised_dataset"]["Tahun"].eq(2025)
    X_test = X.loc[test_mask].copy()

    return (
        result["model_name"],
        result["model"],
        evaluations,
        X,
        X_test,
    )
