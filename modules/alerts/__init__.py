"""
Alerts: Telegram, Discord.
"""
from .telegram_alerts import send_telegram_alert
from .discord_alerts import send_discord_alert

__all__ = ["send_telegram_alert", "send_discord_alert"]
