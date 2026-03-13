"""
Telegram alerts for Guardian warnings.
"""
import asyncio
from typing import Optional

from app.config import get_settings
from app.models import GuardianAlert


async def send_telegram_alert(alert: GuardianAlert) -> bool:
    """Send a single alert to Telegram. Returns True if sent."""
    s = get_settings()
    if not s.telegram_bot_token or not s.telegram_chat_id:
        return False
    emoji = {"info": "ℹ️", "warning": "⚠️", "critical": "🛑"}.get(alert.level.value, "📌")
    text = f"{emoji} *{alert.title}*\n\n{alert.message}"
    if alert.trade:
        text += f"\n\n_Trade: {alert.trade.symbol} {alert.trade.side.value} | {alert.trade.size} @ {alert.trade.entry_price}_"
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"https://api.telegram.org/bot{s.telegram_bot_token}/sendMessage",
                json={
                    "chat_id": s.telegram_chat_id,
                    "text": text,
                    "parse_mode": "Markdown",
                },
                timeout=10.0,
            )
            return r.is_success
    except Exception:
        return False


async def send_telegram_alert_sync_fallback(alert: GuardianAlert) -> bool:
    """Fallback using sync run if needed."""
    try:
        return await send_telegram_alert(alert)
    except Exception:
        return False
