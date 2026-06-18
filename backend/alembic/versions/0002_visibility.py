"""phase 2 — prompts, monitoring_runs, visibility_checks

Revision ID: 0002_visibility
Revises: 0001_initial
Create Date: 2026-06-15
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_visibility"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "prompts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("projects.id"), index=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("intent", sa.String(32), nullable=False, server_default="custom"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "monitoring_runs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("projects.id"), index=True),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("error", sa.Text()),
        sa.Column("engines", sa.JSON()),
        sa.Column("checks_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("summary", sa.JSON()),
        sa.Column("has_live", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "visibility_checks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("run_id", sa.String(36), sa.ForeignKey("monitoring_runs.id"), index=True),
        sa.Column("prompt_id", sa.String(36), sa.ForeignKey("prompts.id"), index=True),
        sa.Column("prompt_text", sa.Text(), nullable=False),
        sa.Column("engine", sa.String(32), nullable=False),
        sa.Column("mode", sa.String(16), nullable=False, server_default="simulated"),
        sa.Column("model", sa.String(64)),
        sa.Column("answer_text", sa.Text()),
        sa.Column("brand_mentioned", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("rank", sa.Integer()),
        sa.Column("cited", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("competitors", sa.JSON()),
        sa.Column("citations", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("visibility_checks")
    op.drop_table("monitoring_runs")
    op.drop_table("prompts")
