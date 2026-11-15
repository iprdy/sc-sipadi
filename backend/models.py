import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
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
    rows_count = Column(Integer, nullable=False)
    features = Column(Text, nullable=False)  # JSON-encoded array of feature names
    target_column = Column(String(100), nullable=False)
    best_model = Column(String(50), nullable=False)
    metrics = Column(Text, nullable=False)   # JSON-encoded dict of model metrics
    shap_data = Column(Text, nullable=False) # JSON-encoded SHAP attributions
    ale_data = Column(Text, nullable=False)  # JSON-encoded ALE curves
    model_path = Column(String(500), nullable=False)
    uploaded_by = Column(String(120), nullable=True)

    records = relationship("DatasetRecord", back_populates="run", cascade="all, delete-orphan")


class DatasetRecord(Base):
    __tablename__ = "dataset_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), ForeignKey("training_runs.id", ondelete="CASCADE"), index=True, nullable=False)
    kabupaten = Column(String(100), index=True, nullable=False)
    tahun = Column(Integer, index=True, nullable=False)
    bulan = Column(Float, nullable=True)
    ndvi = Column(Float, nullable=False)
    lst = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)
    produktivitas = Column(Float, nullable=False)

    run = relationship("TrainingRun", back_populates="records")

