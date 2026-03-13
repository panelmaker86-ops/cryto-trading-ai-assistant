"""
Binance Futures connector (read-only: positions, account, trades).
"""
from datetime import datetime
from typing import List, Optional

from app.models import AccountSnapshot, ExchangeName, Trade, TradeSide
from app.config import get_settings
from .base import BaseExchangeConnector


class BinanceConnector(BaseExchangeConnector):
    """Binance USDT-M Futures. Requires API key with read-only or full access."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        testnet: Optional[bool] = None,
    ):
        s = get_settings()
        self._api_key = api_key or s.binance_api_key
        self._api_secret = api_secret or s.binance_api_secret
        self._testnet = testnet if testnet is not None else s.binance_testnet
        self._client = None

    @property
    def exchange_name(self) -> ExchangeName:
        return ExchangeName.BINANCE

    def _get_client(self):
        if self._client is None:
            from binance.um_futures import UMFutures
            self._client = UMFutures(
                key=self._api_key,
                secret=self._api_secret,
                base_url="https://testnet.binancefuture.com" if self._testnet else None,
            )
        return self._client

    async def get_account_snapshot(self) -> Optional[AccountSnapshot]:
        try:
            client = self._get_client()
            # Sync call; in production wrap in run_in_executor or use async client
            acc = client.account()
            total_wallet_balance = float(acc.get("totalWalletBalance", 0) or 0)
            total_unrealized = float(acc.get("totalUnrealizedProfit", 0) or 0)
            return AccountSnapshot(
                exchange=ExchangeName.BINANCE,
                balance=total_wallet_balance,
                equity=total_wallet_balance + total_unrealized,
                unrealized_pnl=total_unrealized,
            )
        except Exception:
            return None

    async def get_open_positions(self) -> List[Trade]:
        out: List[Trade] = []
        try:
            client = self._get_client()
            acc = client.account()
            for p in acc.get("positions", []):
                amt = float(p.get("positionAmt", 0) or 0)
                if amt == 0:
                    continue
                side = TradeSide.LONG if amt > 0 else TradeSide.SHORT
                entry = float(p.get("entryPrice", 0) or 0)
                leverage = int(float(p.get("leverage", 1) or 1))
                out.append(
                    Trade(
                        exchange=ExchangeName.BINANCE,
                        symbol=p.get("symbol", ""),
                        side=side,
                        size=abs(amt),
                        entry_price=entry,
                        leverage=leverage,
                        order_id=None,
                        position_id=p.get("symbol"),
                    )
                )
        except Exception:
            pass
        return out

    async def get_recent_trades(self, symbol: Optional[str] = None, limit: int = 50) -> List[Trade]:
        out: List[Trade] = []
        try:
            client = self._get_client()
            # User trades (income) or account trades endpoint
            trades_raw = client.get_account_trades(symbol=symbol, limit=limit) if symbol else []
            # Binance returns individual fills; group by position or take last N
            for t in trades_raw[:limit]:
                qty = float(t.get("qty", 0) or 0)
                side = TradeSide.LONG if t.get("side") == "BUY" else TradeSide.SHORT
                out.append(
                    Trade(
                        exchange=ExchangeName.BINANCE,
                        symbol=t.get("symbol", ""),
                        side=side,
                        size=qty,
                        entry_price=float(t.get("price", 0) or 0),
                        opened_at=datetime.utcfromtimestamp(t.get("time", 0) / 1000),
                        order_id=str(t.get("id", "")),
                    )
                )
        except Exception:
            pass
        return out

    async def get_current_price(self, symbol: str) -> Optional[float]:
        try:
            client = self._get_client()
            ticker = client.ticker_price(symbol=symbol)
            return float(ticker.get("price", 0) or 0)
        except Exception:
            return None
