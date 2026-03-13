"""
Daily drawdown monitor: alert when daily loss exceeds limit.
"""
from typing import List, Optional

from app.models import AccountSnapshot, GuardianAlert, AlertLevel, RiskRule, Trade


def check_daily_drawdown(
    account: Optional[AccountSnapshot],
    daily_pnl: float,
    rules: RiskRule,
) -> List[GuardianAlert]:
    """
    Alert if daily PnL (e.g. from exchange or stored session) exceeds max daily loss %.
    Caller should pass daily_pnl (negative = loss). account.equity used for %.
    """
    alerts: List[GuardianAlert] = []
    if not account or account.equity <= 0 or daily_pnl >= 0:
        return alerts

    loss_pct = abs(daily_pnl) / account.equity * 100
    if loss_pct >= rules.max_daily_loss_pct:
        alerts.append(
            GuardianAlert(
                level=AlertLevel.CRITICAL,
                title="Daily loss limit reached",
                message=(
                    f"Today's loss is {loss_pct:.1f}% of equity. "
                    f"Your rule is max {rules.max_daily_loss_pct}% daily loss. Consider stopping for today."
                ),
                source="risk_engine.drawdown_monitor",
            )
        )
    return alerts
