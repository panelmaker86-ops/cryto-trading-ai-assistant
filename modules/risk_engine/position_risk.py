"""
Position risk: max risk per trade, position size vs balance.
"""
from typing import List, Optional

from app.models import AccountSnapshot, GuardianAlert, AlertLevel, RiskRule, Trade


def check_position_risk(
    trade: Trade,
    account: Optional[AccountSnapshot],
    rules: RiskRule,
) -> List[GuardianAlert]:
    """
    Check if this trade violates max risk per trade or position size vs balance.
    """
    alerts: List[GuardianAlert] = []
    if not account or account.equity <= 0:
        return alerts

    # Position notional
    notional = trade.size * trade.entry_price
    position_pct = (notional / account.equity) * 100

    if position_pct > rules.max_position_pct_of_balance:
        alerts.append(
            GuardianAlert(
                level=AlertLevel.WARNING,
                title="Position size too large",
                message=(
                    f"This trade is {position_pct:.1f}% of your account balance. "
                    f"Your rule is max {rules.max_position_pct_of_balance}%."
                ),
                trade=trade,
                source="risk_engine.position_risk",
            )
        )

    # Approximate risk % if we assume stop at e.g. 1% move against (simplified)
    # Real implementation would use stop distance; here we use notional/equity as proxy
    risk_pct = position_pct / trade.leverage  # rough: full liquidation risk share
    if risk_pct > rules.max_risk_per_trade_pct:
        alerts.append(
            GuardianAlert(
                level=AlertLevel.WARNING,
                title="Risk per trade exceeded",
                message=(
                    f"This trade risks ~{risk_pct:.1f}% of your capital. "
                    f"Your strategy rule is max {rules.max_risk_per_trade_pct}%."
                ),
                trade=trade,
                source="risk_engine.position_risk",
            )
        )

    return alerts
