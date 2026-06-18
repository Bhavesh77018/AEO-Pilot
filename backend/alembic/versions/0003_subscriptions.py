"""billing — subscriptions (razorpay)

Revision ID: 0003_subscriptions
Revises: 0002_visibility
Create Date: 2026-06-17
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_subscriptions"
down_revision: Union[str, None] = "0002_visibility"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), index=True),
        sa.Column("plan", sa.String(32), nullable=False),
        sa.Column("period", sa.String(16), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(8), nullable=False, server_default="INR"),
        sa.Column("status", sa.String(16), nullable=False, server_default="created"),
        sa.Column("razorpay_order_id", sa.String(64), index=True),
        sa.Column("razorpay_payment_id", sa.String(64)),
        sa.Column("razorpay_signature", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("subscriptions")
