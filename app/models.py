"""
Shared data models for Strategy Guardian AI.
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ExchangeName(str, Enum):
    BINANCE = "binance"
    BYBIT = "bybit"


class TradeSide(str, Enum):
    LONG = "long"
    SHORT = "short"


class Trade(BaseModel):
    """Represents a single trade (open or closed)."""
    exchange: ExchangeName
    symbol: str
    side: TradeSide
    size: float
    entry_price: float
    leverage: int = 1
    opened_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None
    exit_price: Optional[float] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    order_id: Optional[str] = None
    position_id: Optional[str] = None


class AccountSnapshot(BaseModel):
    """Account balance and equity for risk calculations."""
    exchange: ExchangeName
    balance: float
    equity: float
    unrealized_pnl: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class RiskRule(BaseModel):
    """User-defined risk limits."""
    max_risk_per_trade_pct: float = 3.0
    max_daily_loss_pct: float = 5.0
    max_leverage: int = 10
    max_position_pct_of_balance: float = 20.0


class AlertLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class GuardianAlert(BaseModel):
    """Single alert to send to the trader."""
    level: AlertLevel
    title: str
    message: str
    trade: Optional[Trade] = None
    source: str = ""  # e.g. "risk_engine", "strategy_validator"
    created_at: datetime = Field(default_factory=datetime.utcnow)
