"""
Post-trade feedback: entry quality, risk management, strategy compliance scores.
"""
from typing import Optional

from app.models import Trade
from pydantic import BaseModel


class TradeFeedback(BaseModel):
    """Structured feedback for a closed trade."""
    entry_quality_score: int  # 1-10
    risk_management_score: int  # 1-10
    strategy_compliance_pct: float  # 0-100
    suggestion: str


def generate_trade_feedback(
    trade: Trade,
    strategy_compliance_pct: float = 80.0,
    volatility_during_trade: Optional[float] = None,
) -> TradeFeedback:
    """
    Generate feedback for a closed trade. Can be extended with ML later.
    For now uses heuristics: R-multiple if exit/entry known, size vs typical, etc.
    """
    entry_quality = 7
    risk_management = 5

    if trade.exit_price and trade.entry_price and trade.pnl is not None:
        # Reward positive R (e.g. 2R target)
        move_pct = abs(trade.exit_price - trade.entry_price) / trade.entry_price * 100
        if move_pct > 0 and trade.leverage:
            rough_r = (trade.pnl / (trade.size * trade.entry_price)) * trade.leverage
            if rough_r >= 1.5:
                entry_quality = min(10, entry_quality + 2)
            if trade.pnl > 0:
                risk_management = min(10, risk_management + 2)

    if volatility_during_trade and volatility_during_trade > 0.05:
        risk_management = max(1, risk_management - 1)
        suggestion = "Reduce position size during high volatility periods."
    else:
        suggestion = "Keep following your rules. Consider reviewing stop placement on losing trades."

    return TradeFeedback(
        entry_quality_score=entry_quality,
        risk_management_score=risk_management,
        strategy_compliance_pct=strategy_compliance_pct,
        suggestion=suggestion,
    )
