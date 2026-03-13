"""
Base interface for exchange connectors.
Strategy Guardian only reads data; it does not place orders.
"""
from abc import ABC, abstractmethod
from typing import List, Optional

from app.models import AccountSnapshot, ExchangeName, Trade


class BaseExchangeConnector(ABC):
    """Abstract connector: positions, account, recent trades."""

    @property
    @abstractmethod
    def exchange_name(self) -> ExchangeName:
        pass

    @abstractmethod
    async def get_account_snapshot(self) -> Optional[AccountSnapshot]:
        """Current balance and equity."""
        pass

    @abstractmethod
    async def get_open_positions(self) -> List[Trade]:
        """All open positions (converted to Trade models)."""
        pass

    @abstractmethod
    async def get_recent_trades(self, symbol: Optional[str] = None, limit: int = 50) -> List[Trade]:
        """Recent closed trades for behavior and feedback."""
        pass

    @abstractmethod
    async def get_current_price(self, symbol: str) -> Optional[float]:
        """Current mark/mid price for the symbol."""
        pass
