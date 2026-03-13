"""
Guardian orchestrator: when a trade is detected, run risk + strategy + emotion checks and send alerts.
"""
from typing import Any, Dict, List, Optional

from app.models import (
    AccountSnapshot,
    GuardianAlert,
    RiskRule,
    Trade,
)
from app.config import get_settings
from modules.exchange_connector import BinanceConnector, BybitConnector, BaseExchangeConnector
from modules.risk_engine import check_position_risk, check_leverage, check_daily_drawdown
from modules.strategy_validator import validate_trade_against_rules, StrategyRules
from modules.emotion_detector import detect_emotional_patterns
from modules.ai_analysis import scan_market_risk
from modules.alerts import send_telegram_alert, send_discord_alert


def get_connector(exchange: str) -> Optional[BaseExchangeConnector]:
    s = get_settings()
    if exchange.lower() == "binance" and s.binance_api_key:
        return BinanceConnector()
    if exchange.lower() == "bybit" and s.bybit_api_key:
        return BybitConnector()
    return None


async def run_guardian_checks(
    trade: Trade,
    account: Optional[AccountSnapshot],
    risk_rules: RiskRule,
    strategy_rules: Optional[StrategyRules] = None,
    market_context: Optional[Dict[str, Any]] = None,
    recent_trades: Optional[List[Trade]] = None,
    daily_pnl: float = 0.0,
) -> List[GuardianAlert]:
    """
    Run full pipeline: risk, leverage, drawdown, strategy, emotion.
    Returns list of alerts (caller or this function can send them).
    """
    all_alerts: List[GuardianAlert] = []

    # Risk engine
    all_alerts.extend(check_position_risk(trade, account, risk_rules))
    all_alerts.extend(check_leverage(trade, risk_rules))
    all_alerts.extend(check_daily_drawdown(account, daily_pnl, risk_rules))

    # Strategy validator
    if strategy_rules:
        all_alerts.extend(
            validate_trade_against_rules(trade, strategy_rules, market_context)
        )

    # Emotion detector
    if recent_trades is not None:
        all_alerts.extend(detect_emotional_patterns(trade, recent_trades))

    return all_alerts


async def send_alerts(alerts: List[GuardianAlert]) -> None:
    """Send all alerts to Telegram and Discord."""
    for a in alerts:
        await send_telegram_alert(a)
        await send_discord_alert(a)


async def on_trade_opened(
    trade: Trade,
    account: Optional[AccountSnapshot] = None,
    risk_rules: Optional[RiskRule] = None,
    strategy_rules: Optional[StrategyRules] = None,
    market_context: Optional[Dict[str, Any]] = None,
    recent_trades: Optional[List[Trade]] = None,
    daily_pnl: float = 0.0,
    send_to_telegram_discord: bool = True,
) -> List[GuardianAlert]:
    """
    Main entry: call when a new trade is opened. Optionally fetches account from exchange.
    """
    s = get_settings()
    risk_rules = risk_rules or RiskRule(
        max_risk_per_trade_pct=s.default_max_risk_per_trade_pct,
        max_daily_loss_pct=s.default_max_daily_loss_pct,
        max_leverage=s.default_max_leverage,
    )
    alerts = await run_guardian_checks(
        trade=trade,
        account=account,
        risk_rules=risk_rules,
        strategy_rules=strategy_rules,
        market_context=market_context,
        recent_trades=recent_trades or [],
        daily_pnl=daily_pnl,
    )
    if send_to_telegram_discord and alerts:
        await send_alerts(alerts)
    return alerts


async def on_market_scan(
    symbol: str,
    current_price: float,
    liquidation_cluster_price: Optional[float] = None,
    funding_rate: Optional[float] = None,
    volatility_24h: Optional[float] = None,
    send_alerts: bool = True,
):
    """Run market risk scanner and optionally send alerts."""
    from modules.ai_analysis import scan_market_risk
    result, alerts = scan_market_risk(
        symbol=symbol,
        current_price=current_price,
        liquidation_cluster_price=liquidation_cluster_price,
        funding_rate=funding_rate,
        volatility_24h=volatility_24h,
    )
    if send_alerts and alerts:
        await send_alerts(alerts)
    return result, alerts
