import uuid
from pathlib import Path
from typing import Any, Dict, List, Tuple
import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "artifacts"
ARTIFACT_DIR.mkdir(exist_ok=True)

FEATURES = ["NDVI", "LST", "Rainfall"]
TARGET = "Produktivitas"


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    mae = float(mean_absolute_error(y_true, y_pred))
    return {
        "r2": round(r2, 4),
        "rmse": round(rmse, 4),
        "mae": round(mae, 4),
    }


def train_dual_models(df: pd.DataFrame) -> Tuple[str, Any, Dict[str, Dict[str, float]], pd.DataFrame, pd.DataFrame]:
    X = df[FEATURES].copy()
    y = df[TARGET].copy()

    # Preprocessing: impute missing with median
    X = X.fillna(X.median())

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    candidate_models = {
        "XGBoost": XGBRegressor(
            n_estimators=300,
            max_depth=5,
            learning_rate=0.05,
            random_state=42,
            n_jobs=-1,
        ),
        "Random Forest": RandomForestRegressor(
            n_estimators=300,
            max_depth=12,
            random_state=42,
            n_jobs=-1,
        ),
    }

    evaluations: Dict[str, Dict[str, float]] = {}
    trained_instances: Dict[str, Any] = {}

    for name, model in candidate_models.items():
        model.fit(X_train, y_train)
        trained_instances[name] = model
        predictions = model.predict(X_test)
        evaluations[name] = calculate_metrics(y_test.values, predictions)

    # Select best model based on highest test R²
    best_model_name = max(evaluations, key=lambda k: evaluations[k]["r2"])
    best_model = trained_instances[best_model_name]

    return best_model_name, best_model, evaluations, X, X_test


def compute_shap_analysis(model: Any, X: pd.DataFrame, max_samples: int = 300) -> List[Dict[str, Any]]:
    sample = X.iloc[:max_samples]
    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(sample)
    except Exception:
        explainer = shap.Explainer(model.predict, sample)
        shap_values = explainer(sample).values

    shap_values = np.asarray(shap_values)
    if shap_values.ndim == 3:
        shap_values = shap_values[:, :, 0]

    mean_abs_importance = np.mean(np.abs(shap_values), axis=0)

    display_names = {
        "NDVI": "NDVI (INDEKS VEGETASI)",
        "LST": "LST (SUHU PERMUKAAN TANAH)",
        "Rainfall": "CURAH HUJAN (RAINFALL)",
    }

    result = []
    for feature, importance in sorted(zip(FEATURES, mean_abs_importance), key=lambda x: x[1], reverse=True):
        result.append({
            "feature": feature,
            "importance": round(float(importance), 4),
            "displayName": display_names.get(feature, feature.upper()),
        })
    return result


def compute_ale_curves(model: Any, X: pd.DataFrame, bins: int = 12) -> Dict[str, List[Dict[str, float]]]:
    ale_results: Dict[str, List[Dict[str, float]]] = {}

    for feature in FEATURES:
        series = X[feature].dropna()
        if series.nunique() < 4:
            continue

        quantiles = np.linspace(0, 1, bins + 1)
        edges = np.unique(series.quantile(quantiles).values)
        if len(edges) < 2:
            continue

        centers, effects = [], []
        categories = pd.cut(series, edges, include_lowest=True)

        for interval in categories.cat.categories:
            mask = categories == interval
            if mask.sum() == 0:
                continue
            sample = X.loc[series.index[mask]].copy()
            centers.append(float(sample[feature].mean()))
            effects.append(float(model.predict(sample).mean()))

        if effects:
            effects_arr = np.asarray(effects)
            effects_centered = effects_arr - effects_arr.mean()
            ale_results[feature] = [
                {"x": round(float(x), 3), "y": round(float(y), 3)}
                for x, y in zip(centers, effects_centered)
            ]

    return ale_results


def save_model_artifact(run_id: str, best_model_name: str, model: Any) -> str:
    artifact_path = ARTIFACT_DIR / f"{run_id}.joblib"
    payload = {
        "run_id": run_id,
        "best_model_name": best_model_name,
        "model": model,
        "features": FEATURES,
        "target": TARGET,
        "created_at": pd.Timestamp.now().isoformat(),
    }
    joblib.dump(payload, artifact_path)
    return str(artifact_path)

