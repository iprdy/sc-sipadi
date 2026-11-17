"""
Model registry for SI-PADI.

Each experiment has an independent configuration. Feature engineering,
preprocessing, temporal evaluation, SHAP/ALE and artifact handling remain
in ml_engine.py.
"""

from copy import deepcopy
from typing import Any, Dict

from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor


MODEL_REGISTRY = {
    "xgboost": XGBRegressor,
    "random_forest": RandomForestRegressor,
}

BASELINE_MODEL_KEY = "xgboost_baseline"
TUNED_MODEL_KEY = "xgboost_tuned"

MODEL_CONFIGS: Dict[str, Dict[str, Any]] = {
    BASELINE_MODEL_KEY: {
        "model_key": BASELINE_MODEL_KEY,
        "name": "XGBoost Baseline - Model B",
        "algorithm": "xgboost",
        "params": {
            "n_estimators": 100,
            "learning_rate": 0.1,
            "max_depth": 3,
            "objective": "reg:squarederror",
            "random_state": 42,
            "n_jobs": 1,
        },
    },
    TUNED_MODEL_KEY: {
        "model_key": TUNED_MODEL_KEY,
        "name": "XGBoost Tuned - Model B",
        "algorithm": "xgboost",
        "params": {
            "n_estimators": 500,
            "learning_rate": 0.01,
            "max_depth": 7,
            "subsample": 0.9,
            "colsample_bytree": 0.9,
            "min_child_weight": 3,
            "reg_alpha": 1,
            "reg_lambda": 3,
            "objective": "reg:squarederror",
            "random_state": 42,
            "n_jobs": 1,
        },
    },
}


def get_model_config(model_key: str) -> Dict[str, Any]:
    """Return a defensive copy of one registered experiment configuration."""
    try:
        return deepcopy(MODEL_CONFIGS[model_key])
    except KeyError:
        raise ValueError(
            f"Model key '{model_key}' tidak terdaftar. "
            f"Pilihan: {sorted(MODEL_CONFIGS)}"
        ) from None


def get_all_model_configs() -> Dict[str, Dict[str, Any]]:
    """Return defensive copies of all registered experiment configurations."""
    return deepcopy(MODEL_CONFIGS)


def get_active_model_config() -> Dict[str, Any]:
    """Backward-compatible default configuration: XGBoost Baseline."""
    return get_model_config(BASELINE_MODEL_KEY)
