"""
Behavior model: detect revenge trading, overtrading, trading after loss.
Uses recent trade history (timestamps, PnL, size).
"""
from datetime import datetime, timedelta
from typing import List, Optional

from app.models import GuardianAlert, AlertLevel, Trade


def detect_emotional_patterns(
    current_trade: Trade,
    recent_trades: List[Trade],
    window_minutes: int = 60,
    revenge_window_minutes: int = 12,
    revenge_trade_count_threshold: int = 4,
    overtrade_count_threshold: int = 10,
) -> List[GuardianAlert]:
    """
    Analyze recent_trades + current_trade for emotional patterns.
    - Revenge: many trades shortly after a loss.
    - Overtrading: too many trades in window.
    - Size increase after loss: next position larger after losing trade.
    """
    alerts: List[GuardianAlert] = []
    now = current_trade.opened_at
    window_start = now - timedelta(minutes=window_minutes)
    revenge_start = now - timedelta(minutes=revenge_window_minutes)

    # Trades in the short window (for revenge) and in the longer window (for overtrading)
    in_revenge_window = [t for t in recent_trades if t.opened_at >= revenge_start and t.opened_at <= now]
    in_window = [t for t in recent_trades if t.opened_at >= window_start and t.opened_at <= now]

    # Revenge: multiple trades in revenge_window after a loss
    recent_closed = [t for t in recent_trades if t.closed_at and t.pnl is not None]
    last_loss_time = None
    for t in sorted(recent_closed, key=lambda x: x.closed_at or datetime.min, reverse=True):
        if t.pnl < 0:
            last_loss_time = t.closed_at
            break
    if last_loss_time and revenge_start <= last_loss_time:
        count_after_loss = sum(1 for t in in_revenge_window if t.opened_at >= last_loss_time)
        if count_after_loss >= revenge_trade_count_threshold:
            alerts.append(
                GuardianAlert(
                    level=AlertLevel.WARNING,
                    title="Possible revenge trading detected",
                    message=(
                        f"{count_after_loss} trades opened within {revenge_window_minutes} minutes after a loss."
                    ),
                    trade=current_trade,
                    source="emotion_detector.behavior_model",
                )
            )

    # Overtrading
    if len(in_window) >= overtrade_count_threshold:
        alerts.append(
            GuardianAlert(
                level=AlertLevel.WARNING,
                title="Overtrading",
                message=(
                    f"You have {len(in_window)} trades in the last {window_minutes} minutes. "
                    f"Consider slowing down."
                ),
                trade=current_trade,
                source="emotion_detector.behavior_model",
            )
        )

    # Size increase after loss: current size > avg size of recent trades and last was loss
    if recent_closed and recent_closed[0].pnl is not None and recent_closed[0].pnl < 0:
        avg_size = sum(t.size * t.entry_price for t in recent_trades[:5]) / max(len(recent_trades[:5]), 1)
        current_notional = current_trade.size * current_trade.entry_price
        if avg_size > 0 and current_notional > avg_size * 1.5:
            alerts.append(
                GuardianAlert(
                    level=AlertLevel.WARNING,
                    title="Position size increased after loss",
                    message="Your position size is notably larger than recent trades after a loss. Consider sticking to your usual size.",
                    trade=current_trade,
                    source="emotion_detector.behavior_model",
                )
            )

    return alerts
