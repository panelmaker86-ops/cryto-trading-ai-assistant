"""
Strategy rule engine: validate trade against entry/exit conditions.
Uses market context (RSI, support, trend) when provided.
"""
from typing import Any, Dict, List, Optional

from app.models import GuardianAlert, AlertLevel, Trade


class StrategyRules:
    """User-defined strategy (entry/exit conditions)."""

    def __init__(
        self,
        entry_conditions: Optional[Dict[str, Any]] = None,
        exit_conditions: Optional[Dict[str, Any]] = None,
        name: str = "default",
    ):
        self.name = name
        self.entry_conditions = entry_conditions or {}
        self.exit_conditions = exit_conditions or {}

    # Example entry_conditions: {"rsi_max": 30, "rsi_min": None, "near_support": True, "btc_trend": "bullish"}
    # Example exit_conditions: {"profit_target_r": 2, "stop_below_support": True}


def validate_trade_against_rules(
    trade: Trade,
    rules: StrategyRules,
    market_context: Optional[Dict[str, Any]] = None,
) -> List[GuardianAlert]:
    """
    Check if the trade matches strategy entry rules using market_context.
    market_context can include: rsi, near_support, btc_trend, etc.
    """
    alerts: List[GuardianAlert] = []
    ctx = market_context or {}
    entry = rules.entry_conditions

    # RSI entry rule: e.g. RSI < 30 for long
    rsi_max = entry.get("rsi_max")
    if rsi_max is not None:
        rsi = ctx.get("rsi")
        if rsi is not None and rsi > rsi_max:
            alerts.append(
                GuardianAlert(
                    level=AlertLevel.WARNING,
                    title="Entry rule mismatch: RSI",
                    message=(
                        f"RSI is {rsi} but strategy requires RSI < {rsi_max}."
                    ),
                    trade=trade,
                    source="strategy_validator.rule_engine",
                )
            )

    rsi_min = entry.get("rsi_min")
    if rsi_min is not None:
        rsi = ctx.get("rsi")
        if rsi is not None and rsi < rsi_min:
            alerts.append(
                GuardianAlert(
                    level=AlertLevel.WARNING,
                    title="Entry rule mismatch: RSI",
                    message=(
                        f"RSI is {rsi} but strategy requires RSI > {rsi_min}."
                    ),
                    trade=trade,
                    source="strategy_validator.rule_engine",
                )
            )

    # Near support
    if entry.get("near_support") and ctx.get("near_support") is False:
        alerts.append(
            GuardianAlert(
                level=AlertLevel.WARNING,
                title="Entry rule mismatch: support",
                message="Strategy requires price near support. Current context says not near support.",
                trade=trade,
                source="strategy_validator.rule_engine",
            )
        )

    # BTC trend
    required_trend = entry.get("btc_trend")
    if required_trend:
        actual = (ctx.get("btc_trend") or "").lower()
        if actual and actual != required_trend.lower():
            alerts.append(
                GuardianAlert(
                    level=AlertLevel.WARNING,
                    title="Entry rule mismatch: trend",
                    message=f"Strategy requires BTC trend {required_trend}. Current: {actual or 'unknown'}.",
                    trade=trade,
                    source="strategy_validator.rule_engine",
                )
            )

    return alerts
