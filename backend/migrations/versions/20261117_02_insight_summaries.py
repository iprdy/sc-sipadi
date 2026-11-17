"""Add insight_summaries table for Structured RAG caching.

Revision ID: 20261117_02
Revises: 20261116_01
Create Date: 2026-11-17
"""
from alembic import op
import sqlalchemy as sa


revision = "20261117_02"
down_revision = "20261116_01"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "insight_summaries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("run_id", sa.String(length=64), nullable=False),
        sa.Column("kabupaten", sa.String(length=100), nullable=False),
        sa.Column("tahun", sa.Integer(), nullable=False),
        sa.Column("headline_summary", sa.Text(), nullable=False),
        sa.Column("harvest_category_note", sa.Text(), nullable=False),
        sa.Column("evaluasi_panen", sa.Text(), nullable=False),
        sa.Column("kondisi_biofisik", sa.Text(), nullable=False),
        sa.Column("validasi_xai", sa.Text(), nullable=False),
        sa.Column("aksi_lapangan", sa.Text(), nullable=False),
        sa.Column("generated_by", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["run_id"],
            ["training_runs.id"],
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("run_id", "kabupaten", "tahun", name="uq_insight_run_region_year"),
    )
    op.create_index("ix_insight_summaries_run_id", "insight_summaries", ["run_id"])
    op.create_index("ix_insight_summaries_kabupaten", "insight_summaries", ["kabupaten"])
    op.create_index("ix_insight_summaries_tahun", "insight_summaries", ["tahun"])


def downgrade():
    op.drop_index("ix_insight_summaries_tahun", table_name="insight_summaries")
    op.drop_index("ix_insight_summaries_kabupaten", table_name="insight_summaries")
    op.drop_index("ix_insight_summaries_run_id", table_name="insight_summaries")
    op.drop_table("insight_summaries")
