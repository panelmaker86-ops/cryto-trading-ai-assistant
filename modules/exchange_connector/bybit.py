"""
Bybit connector (read-only: positions, account, trades).
"""
from datetime import datetime
from typing import List, Optional

from app.models import AccountSnapshot, ExchangeName, Trade, TradeSide
from app.config import get_settings
from .base import BaseExchangeConnector


class BybitConnector(BaseExchangeConnector):
    """Bybit (USDT perpetual). Read-only."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        testnet: Optional[bool] = None,
    ):
        s = get_settings()
        self._api_key = api_key or s.bybit_api_key
        self._api_secret = api_secret or s.bybit_api_secret
        self._testnet = testnet if testnet is not None else s.bybit_testnet
        self._client = None

    @property
    def exchange_name(self) -> ExchangeName:
        return ExchangeName.BYBIT

    def _get_client(self):
        if self._client is None:
            from pybit.unified_trading import HTTP
            self._client = HTTP(
                api_key=self._api_key,
                api_secret=self._api_secret,
                testnet=self._testnet,
            )
        return self._client

    async def get_account_snapshot(self) -> Optional[AccountSnapshot]:
        try:
            client = self._get_client()
            r = client.get_wallet_balance(accountType="UNIFIED")
            data = (r.get("result") or {}).get("list") or []
            if not data:
                return None
            acc = data[0]
            total_equity = float(acc.get("totalEquity", 0) or 0)
            total_wallet = float(acc.get("totalWalletBalance", 0) or 0)
            total_unrealized = float(acc.get("totalPerpUPL", 0) or 0)
            return AccountSnapshot(
                exchange=ExchangeName.BYBIT,
                balance=total_wallet,
                equity=total_equity,
                unrealized_pnl=total_unrealized,
            )
        except Exception:
            return None

    async def get_open_positions(self) -> List[Trade]:
        out: List[Trade] = []
        try:
            client = self._get_client()
            r = client.get_positions(category="linear", settleCoin="USDT")
            data = (r.get("result") or {}).get("list") or []
            for p in data:
                size = float(p.get("size", 0) or 0)
                if size == 0:
                    continue
                side = TradeSide.LONG if (p.get("side") or "").upper() == "BUY" else TradeSide.SHORT
                entry = float(p.get("avgPrice", 0) or 0)
                leverage = int(float(p.get("leverage", 1) or 1))
                out.append(
                    Trade(
                        exchange=ExchangeName.BYBIT,
                        symbol=p.get("symbol", ""),
                        side=side,
                        size=size,
                        entry_price=entry,
                        leverage=leverage,
                        position_id=p.get("positionId"),
                    )
                )
        except Exception:
            pass
        return out

    async def get_recent_trades(self, symbol: Optional[str] = None, limit: int = 50) -> List[Trade]:
        out: List[Trade] = []
        try:
            client = self._get_client()
            r = client.get_closed_pnl(category="linear", limit=limit, symbol=symbol or "")
            data = (r.get("result") or {}).get("list") or []
            for t in data:
                size = float(t.get("size", 0) or 0)
                side = TradeSide.LONG if (t.get("side") or "").upper() == "BUY" else TradeSide.SHORT
                entry = float(t.get("avgEntryPrice", 0) or 0)
                exit_p = float(t.get("avgExitPrice", 0) or 0)
                pnl = float(t.get("closedPnl", 0) or 0)
                closed = t.get("updatedTime")
                closed_at = datetime.utcfromtimestamp(int(closed) / 1000) if closed else None
                out.append(
                    Trade(
                        exchange=ExchangeName.BYBIT,
                        symbol=t.get("symbol", ""),
                        side=side,
                        size=size,
                        entry_price=entry,
                        exit_price=exit_p,
                        pnl=pnl,
                        closed_at=closed_at,
                        order_id=t.get("orderId"),
                    )
                )
        except Exception:
            pass
        return out

    async def get_current_price(self, symbol: str) -> Optional[float]:
        try:
            client = self._get_client()
            r = client.get_tickers(category="linear", symbol=symbol)
            data = (r.get("result") or {}).get("list") or []
            if not data:
                return None
            return float(data[0].get("lastPrice", 0) or 0)
        except Exception:
            return None
