from typing import Dict, List, Tuple
from fastapi import HTTPException
import numpy as np
import pandas as pd

REQUIRED_COLUMNS = [
    "Kabupaten",
    "Tahun",
    "Bulan",
    "NDVI",
    "LST",
    "Rainfall",
    "Produktivitas",
]

COLUMN_ALIASES = {
    "kabupaten": "Kabupaten",
    "wilayah": "Kabupaten",
    "daerah": "Kabupaten",
    "region": "Kabupaten",
    "district": "Kabupaten",

    "tahun": "Tahun",
    "year": "Tahun",

    "bulan": "Bulan",
    "month": "Bulan",

    "ndvi": "NDVI",
    "vegetation_index": "NDVI",

    "lst": "LST",
    "land_surface_temperature": "LST",
    "suhu_permukaan": "LST",
    "temperature": "LST",

    "rainfall": "Rainfall",
    "curah_hujan": "Rainfall",
    "precipitation": "Rainfall",
    "hujan": "Rainfall",

    "produktivitas": "Produktivitas",
    "productivity": "Produktivitas",
    "yield": "Produktivitas",
    "production": "Produktivitas",
    "hasil_panen": "Produktivitas",
}


def normalize_and_validate_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
    rename_map = {}
    for col in df.columns:
        clean_key = str(col).strip().lower().replace(" ", "_").replace("-", "")
        if clean_key in COLUMN_ALIASES:
            target_name = COLUMN_ALIASES[clean_key]
            if target_name not in rename_map.values():
                rename_map[col] = target_name

    standardized_df = df.rename(columns=rename_map)

    # Check required columns
    missing = [c for c in REQUIRED_COLUMNS if c not in standardized_df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Dataset tidak valid. Kolom wajib berikut tidak ditemukan: {', '.join(missing)}. "
                f"Kolom wajib yang harus ada dalam CSV/Excel: {', '.join(REQUIRED_COLUMNS)}."
            ),
        )

    return standardized_df, rename_map


def validate_dataset(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        raise HTTPException(status_code=400, detail="Dataset yang diunggah kosong.")

    standardized_df, _ = normalize_and_validate_columns(df)

    # Validate numeric types for numerical columns
    num_cols = ["Tahun", "Bulan", "NDVI", "LST", "Rainfall", "Produktivitas"]
    for c in num_cols:
        standardized_df[c] = pd.to_numeric(standardized_df[c], errors="coerce")

    # Drop rows with NaN in critical target or features
    initial_rows = len(standardized_df)
    clean_df = standardized_df.dropna(subset=["NDVI", "LST", "Rainfall", "Produktivitas"]).copy()

    # Range validation
    invalid_ndvi = (clean_df["NDVI"] < -1.0) | (clean_df["NDVI"] > 1.0)
    invalid_rainfall = clean_df["Rainfall"] < 0
    invalid_prod = clean_df["Produktivitas"] <= 0

    if invalid_ndvi.sum() > 0:
        # Filter out extreme invalid sensor noise
        clean_df = clean_df.loc[~invalid_ndvi]
    if invalid_rainfall.sum() > 0:
        clean_df = clean_df.loc[~invalid_rainfall]
    if invalid_prod.sum() > 0:
        clean_df = clean_df.loc[~invalid_prod]

    if len(clean_df) < 20:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Data valid setelah validasi dan pembersihan tersisa {len(clean_df)} baris (dari {initial_rows} baris). "
                "Dibutuhkan minimal 20 baris data valid untuk melakukan pelatihan model XGBoost dan Random Forest."
            ),
        )

    return clean_df

