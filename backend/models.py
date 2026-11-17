import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, default="Administrator")
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="admin")
    created_at = Column(DateTime, default=datetime.utcnow)


class TrainingRun(Base):
    __tablename__ = "training_runs"

    id = Column(String(64), primary_key=True)
    filename = Column(String(255), nullable=False)
    created_at = Column(String(50), nullable=False)

    # Jumlah baris master dan baris supervised yang benar-benar digunakan.
    rows_count = Column(Integer, nullable=False)
    supervised_rows = Column(Integer, nullable=True)

    # JSON string agar tetap kompatibel dengan pola serialisasi API saat ini.
    features = Column(Text, nullable=False)
    target_column = Column(String(100), nullable=False)
    best_model = Column(String(120), nullable=False)

    # Konfigurasi dan hasil evaluasi untuk eksperimen Model B.
    model_params = Column(Text, nullable=True)
    validation_scheme = Column(String(200), nullable=True)
    temporal_validation_metrics = Column(Text, nullable=True)
    final_test_metrics = Column(Text, nullable=True)

    # Dipertahankan untuk kompatibilitas dengan endpoint lama.
    metrics = Column(Text, nullable=False)
    shap_data = Column(Text, nullable=False)
    ale_data = Column(Text, nullable=False)

    # Hindari nama atribut "metadata" karena Base.metadata milik SQLAlchemy.
    metadata_json = Column(Text, nullable=True)

    model_path = Column(String(500), nullable=False)
    uploaded_by = Column(String(120), nullable=True)

    records = relationship(
        "DatasetRecord",
        back_populates="run",
        cascade="all, delete-orphan",
    )


class DatasetRecord(Base):
    """
    Menyimpan observasi Master Dataset yang sudah divalidasi.

    Fitur lag, rolling, sin_month, dan cos_month tidak disimpan di tabel ini.
    Fitur tersebut dibentuk oleh ml_engine.py berdasarkan urutan waktu
    per kabupaten/kota setiap kali proses modeling dijalankan.
    """

    __tablename__ = "dataset_records"

    __table_args__ = (
        UniqueConstraint(
            "run_id",
            "kabupaten",
            "tahun",
            "bulan",
            name="uq_dataset_record_run_period",
        ),
        Index(
            "ix_dataset_record_region_year",
            "kabupaten",
            "tahun",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(
        String(64),
        ForeignKey("training_runs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Key observasi bulanan.
    # Float dipertahankan agar kompatibel dengan tipe kolom database lama;
    # validator tetap memastikan nilainya bilangan bulat 1 sampai 12.
    kabupaten = Column(String(100), index=True, nullable=False)
    tahun = Column(Integer, index=True, nullable=False)
    bulan = Column(Float, nullable=False)

    # Kolom Master Dataset.
    # Luas panen dan produksi boleh NULL bila sumber data tidak menyediakannya.
    luas_panen_ha = Column(Float, nullable=True)
    produksi_ton = Column(Float, nullable=True)
    produktivitas = Column(Float, nullable=True)

    # Variabel lingkungan wajib tersedia menurut validator.
    ndvi = Column(Float, nullable=False)
    lst = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)

    # Metadata kualitas/sumber LST.
    status_lst = Column(String(100), nullable=True)

    run = relationship("TrainingRun", back_populates="records")


class InsightSummary(Base):
    __tablename__ = "insight_summaries"
    __table_args__ = (
        UniqueConstraint("run_id", "kabupaten", "tahun", name="uq_insight_run_region_year"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(
        String(64),
        ForeignKey("training_runs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    kabupaten = Column(String(100), index=True, nullable=False)
    tahun = Column(Integer, index=True, nullable=False)

    # Konten Card Executive Summary
    headline_summary = Column(Text, nullable=False)
    harvest_category_note = Column(Text, nullable=False)

    # Konten 4 Pilar Card Kesimpulan Secara Keseluruhan
    evaluasi_panen = Column(Text, nullable=False)
    kondisi_biofisik = Column(Text, nullable=False)
    validasi_xai = Column(Text, nullable=False)
    aksi_lapangan = Column(Text, nullable=False)

    # Metadata Audit & Cache
    generated_by = Column(String(80), nullable=False, default="gemini-3.5-flash-lite")
    created_at = Column(DateTime, default=datetime.utcnow)

    run = relationship("TrainingRun")
