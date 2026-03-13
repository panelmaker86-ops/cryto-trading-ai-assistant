"""
Discord webhook alerts for Guardian warnings.
"""
from typing import Optional

from app.config import get_settings
from app.models import GuardianAlert, AlertLevel


async def send_discord_alert(alert: GuardianAlert) -> bool:
    """Send a single alert to Discord via webhook. Returns True if sent."""
    s = get_settings()
    if not s.discord_webhook_url:
        return False
    color = {"info": 3447003, "warning": 15105570, "critical": 15158332}.get(alert.level.value, 9807270)
    desc = alert.message
    if alert.trade:
        desc += f"\n\nTrade: {alert.trade.symbol} {alert.trade.side.value} | {alert.trade.size} @ {alert.trade.entry_price}"
    payload = {
        "embeds": [
            {
                "title": alert.title,
                "description": desc,
                "color": color,
                "footer": {"text": f"Strategy Guardian AI · {alert.source}"},
            }
        ]
    }
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            r = await client.post(s.discord_webhook_url, json=payload, timeout=10.0)
            return r.is_success
    except Exception:
        return False
