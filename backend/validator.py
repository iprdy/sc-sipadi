import re
import numpy as np
import pandas as pd
from fastapi import HTTPException


# ============================================================
# MASTER DATASET SCHEMA
# ============================================================

MASTER_COLUMNS = [
    "Kabupaten",
    "Tahun",
    "Bulan",
    "Luas_Panen_ha",
    "Produksi_ton",
    "Produktivitas",
    "NDVI",
    "LST",
    "Rainfall",
    "Status_LST",
]

KEYS = ["Kabupaten", "Tahun", "Bulan"]

NUMERIC_COLUMNS = [
    "Tahun",
    "Bulan",
    "Luas_Panen_ha",
    "Produksi_ton",
    "Produktivitas",
    "NDVI",
    "LST",
    "Rainfall",
]

ENVIRONMENT_COLUMNS = ["NDVI", "LST", "Rainfall"]

SUPERVISED_FEATURES = [
    "Kabupaten",
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


# ============================================================
# COLUMN ALIASES
# ============================================================

COLUMN_ALIASES = {
    "kabupaten": "Kabupaten",
    "namobj": "Kabupaten",
    "wilayah": "Kabupaten",
    "daerah": "Kabupaten",
    "region": "Kabupaten",
    "district": "Kabupaten",
    "kabupaten_kota": "Kabupaten",

    "tahun": "Tahun",
    "year": "Tahun",

    "bulan": "Bulan",
    "month": "Bulan",

    "luas_panen_ha": "Luas_Panen_ha",
    "luas_panen": "Luas_Panen_ha",
    "harvested_area_ha": "Luas_Panen_ha",

    "produksi_ton": "Produksi_ton",
    "produksi": "Produksi_ton",
    "production_ton": "Produksi_ton",

    "produktivitas": "Produktivitas",
    "produktivitas_turunan": "Produktivitas",
    "produktivitas_bulanan": "Produktivitas",
    "productivity": "Produktivitas",
    "yield": "Produktivitas",

    "ndvi": "NDVI",
    "lst": "LST",

    "rainfall": "Rainfall",
    "curah_hujan": "Rainfall",
    "curah_hujan_mm": "Rainfall",
    "precipitation": "Rainfall",

    "status_lst": "Status_LST",
    "data_status": "Status_LST",
    "status_landsat": "Status_LST",
}


def _normalize_column_key(column_name: str) -> str:
    """Normalize headers such as 'Kabupaten/Kota' and 'Luas Panen-ha'."""
    key = str(column_name).replace("\ufeff", "").strip().lower()
    key = re.sub(r"[\s/\-]+", "_", key)
    key = re.sub(r"_+", "_", key).strip("_")
    return key


def normalize_and_validate_columns(df: pd.DataFrame) -> pd.DataFrame:
    if df is None or not isinstance(df, pd.DataFrame):
        raise HTTPException(
            status_code=400,
            detail="File dataset tidak terbaca sebagai tabel."
        )

    data = df.copy()
    rename_map = {}

    for column in data.columns:
        key = _normalize_column_key(column)
        if key in COLUMN_ALIASES:
            rename_map[column] = COLUMN_ALIASES[key]

    data = data.rename(columns=rename_map)

    if data.columns.duplicated().any():
        duplicated = data.columns[data.columns.duplicated()].tolist()
        raise HTTPException(
            status_code=400,
            detail=(
                "Terdapat kolom yang menjadi duplikat setelah standardisasi: "
                f"{duplicated}. Pastikan hanya ada satu kolom untuk setiap variabel."
            )
        )

    missing = [column for column in MASTER_COLUMNS if column not in data.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Kolom master dataset tidak lengkap: {missing}"
        )

    return data


# ============================================================
# MASTER DATASET VALIDATION
# ============================================================

def _validate_complete_monthly_panel(data: pd.DataFrame) -> None:
    """
    Check that each district has one row for every month in the dataset's
    common date range. This is important because lag-1 and rolling-3 are
    row-based temporal operations and must not jump over absent months.
    """
    dates = pd.to_datetime(
        dict(year=data["Tahun"], month=data["Bulan"], day=1)
    )
    expected_dates = pd.date_range(
        start=dates.min(),
        end=dates.max(),
        freq="MS"
    )

    for district, group in data.assign(_Date=dates).groupby("Kabupaten"):
        actual_dates = pd.DatetimeIndex(group["_Date"].sort_values().unique())

        if len(actual_dates) != len(expected_dates) or not actual_dates.equals(expected_dates):
            missing_dates = expected_dates.difference(actual_dates)
            extra_dates = actual_dates.difference(expected_dates)
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Panel bulanan {district} tidak lengkap. "
                    f"Jumlah baris={len(actual_dates)}, seharusnya={len(expected_dates)}. "
                    f"Contoh bulan hilang={list(missing_dates[:5].strftime('%Y-%m'))}; "
                    f"bulan di luar rentang={list(extra_dates[:5].strftime('%Y-%m'))}."
                )
            )


def validate_master_dataset(
    df: pd.DataFrame,
    require_complete_monthly_panel: bool = True
) -> pd.DataFrame:
    """
    Validate the clean master dataset.

    Missing Produktivitas is intentionally allowed and retained.
    NDVI, LST, and Rainfall must be present because they are model inputs.
    Luas_Panen_ha and Produksi_ton may be zero; they are not model features.
    """
    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="Master dataset kosong.")

    data = normalize_and_validate_columns(df)
    data = data[MASTER_COLUMNS].copy()

    data["Kabupaten"] = (
        data["Kabupaten"]
        .astype("string")
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )

    for column in NUMERIC_COLUMNS:
        original = data[column]
        converted = pd.to_numeric(original, errors="coerce")

        # Blank/NA values are allowed for supporting BPS columns and target,
        # but non-empty text that cannot be parsed as a number is an error.
        invalid_text = original.notna() & converted.isna()
        if invalid_text.any():
            examples = original.loc[invalid_text].astype(str).head(5).tolist()
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Kolom {column} mengandung nilai non-numerik: {examples}"
                )
            )

        data[column] = converted

    # Keys must always be present and valid.
    if data[KEYS].isna().any().any():
        raise HTTPException(
            status_code=400,
            detail="Kabupaten, Tahun, atau Bulan memiliki nilai kosong."
        )

    if (data["Kabupaten"] == "").any():
        raise HTTPException(
            status_code=400,
            detail="Nama kabupaten/kota tidak boleh berupa teks kosong."
        )

    # Year and month must be integer-valued.
    for column in ["Tahun", "Bulan"]:
        values = data[column].to_numpy(dtype=float)
        if not np.isfinite(values).all():
            raise HTTPException(
                status_code=400,
                detail=f"Nilai {column} tidak valid."
            )
        if not np.equal(values % 1, 0).all():
            raise HTTPException(
                status_code=400,
                detail=f"Kolom {column} harus berupa bilangan bulat."
            )
        data[column] = data[column].astype(int)

    if not data["Bulan"].between(1, 12).all():
        raise HTTPException(
            status_code=400,
            detail="Bulan harus berada pada rentang 1-12."
        )

    # Infinity is never allowed. NaN is allowed only for target/supporting
    # columns; environmental predictors and keys are checked separately.
    for column in NUMERIC_COLUMNS:
        values = data[column].dropna().to_numpy(dtype=float)
        if not np.isfinite(values).all():
            raise HTTPException(
                status_code=400,
                detail=f"Nilai infinite ditemukan pada {column}."
            )

    if data[ENVIRONMENT_COLUMNS].isna().any().any():
        missing_counts = data[ENVIRONMENT_COLUMNS].isna().sum()
        raise HTTPException(
            status_code=400,
            detail=(
                "Ditemukan missing value pada variabel lingkungan: "
                f"{missing_counts[missing_counts > 0].to_dict()}. "
                "NDVI, LST, dan Rainfall harus lengkap."
            )
        )

    if not np.isfinite(data[ENVIRONMENT_COLUMNS].to_numpy(dtype=float)).all():
        raise HTTPException(
            status_code=400,
            detail="Variabel lingkungan mengandung nilai infinite."
        )

    if not data["NDVI"].between(-1, 1).all():
        raise HTTPException(
            status_code=400,
            detail="Nilai NDVI di luar rentang -1 sampai 1."
        )

    if (data["Rainfall"] < 0).any():
        raise HTTPException(
            status_code=400,
            detail="Curah hujan tidak boleh negatif."
        )

    for column in ["Luas_Panen_ha", "Produksi_ton"]:
        valid_values = data[column].dropna()
        if (valid_values < 0).any():
            raise HTTPException(
                status_code=400,
                detail=f"{column} tidak boleh negatif."
            )

    # Zero-area/zero-production rows may legitimately have undefined
    # productivity. Keep these target values missing; never convert to zero.
    valid_target = data["Produktivitas"].dropna()
    if (valid_target <= 0).any():
        raise HTTPException(
            status_code=400,
            detail="Produktivitas aktual yang terisi harus lebih besar dari nol."
        )

    data["Status_LST"] = data["Status_LST"].astype("string").str.strip()
    if data["Status_LST"].isna().any() or (data["Status_LST"] == "").any():
        raise HTTPException(
            status_code=400,
            detail="Status_LST tidak boleh kosong."
        )

    if data.duplicated(KEYS).any():
        duplicated = data.loc[data.duplicated(KEYS, keep=False), KEYS].head(10)
        raise HTTPException(
            status_code=400,
            detail=(
                "Terdapat duplikasi Kabupaten-Tahun-Bulan. "
                f"Contoh: {duplicated.to_dict(orient='records')}"
            )
        )

    data = data.sort_values(
        ["Kabupaten", "Tahun", "Bulan"]
    ).reset_index(drop=True)

    if require_complete_monthly_panel:
        _validate_complete_monthly_panel(data)

    print("=" * 60)
    print("MASTER DATASET VALIDATION")
    print("=" * 60)
    print("Total observasi:", len(data))
    print("Jumlah wilayah:", data["Kabupaten"].nunique())
    print("Rentang tahun:", data["Tahun"].min(), "-", data["Tahun"].max())
    print("Missing produktivitas:", int(data["Produktivitas"].isna().sum()))
    print("Missing lingkungan:", int(data[ENVIRONMENT_COLUMNS].isna().sum().sum()))
    print("Duplicate keys:", int(data.duplicated(KEYS).sum()))

    return data


# ============================================================
# SUPERVISED DATASET VALIDATION
# ============================================================

def validate_supervised_dataset(df: pd.DataFrame) -> pd.DataFrame:
    if df is None or df.empty:
        raise HTTPException(
            status_code=400,
            detail="Supervised dataset kosong."
        )

    required = SUPERVISED_FEATURES + ["Produktivitas"]
    missing = [column for column in required if column not in df.columns]

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Fitur supervised tidak lengkap: {missing}"
        )

    data = df.copy()
    data["Kabupaten"] = data["Kabupaten"].astype("string").str.strip()

    numeric_features = [
        "Tahun", "Bulan", "NDVI", "LST", "Rainfall",
        "Produktivitas_lag1", "Produktivitas_roll3_lag1",
        "sin_month", "cos_month", "Produktivitas"
    ]

    for column in numeric_features:
        data[column] = pd.to_numeric(data[column], errors="coerce")

    if data[required].isna().any().any():
        missing_counts = data[required].isna().sum()
        raise HTTPException(
            status_code=400,
            detail=(
                "Masih terdapat missing value pada supervised dataset: "
                f"{missing_counts[missing_counts > 0].to_dict()}"
            )
        )

    numeric_values = data[numeric_features].to_numpy(dtype=float)
    if not np.isfinite(numeric_values).all():
        raise HTTPException(
            status_code=400,
            detail="Ditemukan nilai infinite pada supervised dataset."
        )

    if (data["Produktivitas"] <= 0).any():
        raise HTTPException(
            status_code=400,
            detail="Target supervised harus lebih besar dari nol."
        )

    if {"Tahun", "Bulan"}.issubset(data.columns):
        if not data["Bulan"].between(1, 12).all():
            raise HTTPException(
                status_code=400,
                detail="Bulan supervised harus berada pada rentang 1-12."
            )

    if set(KEYS).issubset(data.columns) and data.duplicated(KEYS).any():
        raise HTTPException(
            status_code=400,
            detail="Terdapat duplikasi key pada supervised dataset."
        )

    return data


# Backward-compatible function name used by the current main.py.
def validate_dataset(df: pd.DataFrame) -> pd.DataFrame:
    return validate_master_dataset(df)
