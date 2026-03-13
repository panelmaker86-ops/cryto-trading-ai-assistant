"""
Leverage check: ensure position leverage does not exceed rule.
"""
from typing import List, Optional

from app.models import GuardianAlert, AlertLevel, RiskRule, Trade


def check_leverage(
    trade: Trade,
    rules: RiskRule,
) -> List[GuardianAlert]:
    """Alert if leverage exceeds max allowed."""
    alerts: List[GuardianAlert] = []
    if trade.leverage > rules.max_leverage:
        alerts.append(
            GuardianAlert(
                level=AlertLevel.WARNING,
                title="Max leverage exceeded",
                message=(
                    f"Position uses {trade.leverage}x leverage. "
                    f"Your strategy rule is max {rules.max_leverage}x."
                ),
                trade=trade,
                source="risk_engine.leverage_check",
            )
        )
    return alerts
