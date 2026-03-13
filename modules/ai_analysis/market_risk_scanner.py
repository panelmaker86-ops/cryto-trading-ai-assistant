"""
Market risk scanner: volatility spikes, liquidation clusters, funding, news.
Can be fed by exchange/API data; here we define the interface and a stub.
"""
from typing import List, Optional

from app.models import GuardianAlert, AlertLevel
from pydantic import BaseModel


class MarketRiskResult(BaseModel):
    """Result of a market risk scan."""
    high_risk: bool
    messages: List[str]
    liquidation_cluster_price: Optional[float] = None
    funding_rate: Optional[float] = None
    volatility_24h: Optional[float] = None


def scan_market_risk(
    symbol: str,
    current_price: float,
    liquidation_cluster_price: Optional[float] = None,
    funding_rate: Optional[float] = None,
    volatility_24h: Optional[float] = None,
    macro_news_risk: bool = False,
) -> tuple[MarketRiskResult, List[GuardianAlert]]:
    """
    Scan market conditions before entry. Returns result + alerts if high risk.
    """
    messages: List[str] = []
    alerts: List[GuardianAlert] = []

    if liquidation_cluster_price is not None and current_price is not None:
        distance_pct = abs(current_price - liquidation_cluster_price) / current_price * 100
        if distance_pct < 2:
            messages.append(f"Liquidation cluster near price: ${liquidation_cluster_price:,.0f}")
            alerts.append(
                GuardianAlert(
                    level=AlertLevel.WARNING,
                    title="Market risk: liquidation cluster",
                    message=f"BTC liquidation cluster at ${liquidation_cluster_price:,.0f}. Price may be volatile.",
                    source="ai_analysis.market_risk_scanner",
                )
            )

    if funding_rate is not None and abs(funding_rate) > 0.001:
        messages.append(f"Funding rate: {funding_rate:.4%}")
        if abs(funding_rate) > 0.01:
            alerts.append(
                GuardianAlert(
                    level=AlertLevel.WARNING,
                    title="Extreme funding rate",
                    message=f"Funding rate {funding_rate:.4%}. Consider waiting or sizing down.",
                    source="ai_analysis.market_risk_scanner",
                )
            )

    if volatility_24h is not None and volatility_24h > 0.05:
        messages.append(f"24h volatility: {volatility_24h:.2%}")
        alerts.append(
            GuardianAlert(
                level=AlertLevel.INFO,
                title="High volatility",
                message=f"24h volatility is {volatility_24h:.2%}. Consider smaller size.",
                source="ai_analysis.market_risk_scanner",
            )
        )

    if macro_news_risk:
        messages.append("Macro/news event risk reported.")
        alerts.append(
            GuardianAlert(
                level=AlertLevel.WARNING,
                title="Macro/news risk",
                message="Significant news or macro event. Consider reducing exposure.",
                source="ai_analysis.market_risk_scanner",
            )
        )

    result = MarketRiskResult(
        high_risk=len(alerts) > 0,
        messages=messages,
        liquidation_cluster_price=liquidation_cluster_price,
        funding_rate=funding_rate,
        volatility_24h=volatility_24h,
    )
    return result, alerts
