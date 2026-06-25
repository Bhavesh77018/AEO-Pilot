"""project owner — user_id, user_email (per-user data isolation)

Revision ID: 0004_project_owner
Revises: 0003_subscriptions
Create Date: 2026-06-25
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_project_owner"
down_revision: Union[str, None] = "0003_subscriptions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("user_id", sa.String(36), nullable=True))
    op.add_column("projects", sa.Column("user_email", sa.String(255), nullable=True))
    op.create_index("ix_projects_user_id", "projects", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_projects_user_id", table_name="projects")
    op.drop_column("projects", "user_email")
    op.drop_column("projects", "user_id")
