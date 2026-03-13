"""
Repository: CRUD for settings, alerts, trades.
"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import UserSettingsModel, StoredAlertModel, StoredTradeModel
from app.models import RiskRule, GuardianAlert, Trade, ExchangeName, TradeSide


USER_ID = "default"


# ----- Settings -----
async def get_settings(db: AsyncSession, user_id: str = USER_ID) -> Optional[UserSettingsModel]:
    r = await db.execute(select(UserSettingsModel).where(UserSettingsModel.user_id == user_id))
    return r.scalars().first()


async def get_risk_rules(db: AsyncSession, user_id: str = USER_ID) -> RiskRule:
    row = await get_settings(db, user_id)
    if not row:
        return RiskRule()
    return RiskRule(
        max_risk_per_trade_pct=row.max_risk_per_trade_pct,
        max_daily_loss_pct=row.max_daily_loss_pct,
        max_leverage=row.max_leverage,
        max_position_pct_of_balance=row.max_position_pct_of_balance,
    )


async def upsert_settings(
    db: AsyncSession,
    risk_rule: Optional[RiskRule] = None,
    strategy_name: Optional[str] = None,
    entry_conditions: Optional[dict] = None,
    exit_conditions: Optional[dict] = None,
    user_id: str = USER_ID,
) -> UserSettingsModel:
    row = await get_settings(db, user_id)
    if not row:
        row = UserSettingsModel(user_id=user_id)
        db.add(row)
    if risk_rule is not None:
        row.max_risk_per_trade_pct = risk_rule.max_risk_per_trade_pct
        row.max_daily_loss_pct = risk_rule.max_daily_loss_pct
        row.max_leverage = risk_rule.max_leverage
        row.max_position_pct_of_balance = risk_rule.max_position_pct_of_balance
    if strategy_name is not None:
        row.strategy_name = strategy_name
    if entry_conditions is not None:
        row.entry_conditions = entry_conditions
    if exit_conditions is not None:
        row.exit_conditions = exit_conditions
    await db.commit()
    await db.refresh(row)
    return row


# ----- Alerts -----
async def store_alert(db: AsyncSession, alert: GuardianAlert) -> StoredAlertModel:
    row = StoredAlertModel(
        level=alert.level.value,
        title=alert.title,
        message=alert.message,
        source=alert.source,
        trade_snapshot=alert.trade.model_dump(mode="json") if alert.trade else None,
        created_at=alert.created_at,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def list_alerts(db: AsyncSession, limit: int = 100) -> List[StoredAlertModel]:
    r = await db.execute(
        select(StoredAlertModel).order_by(desc(StoredAlertModel.created_at)).limit(limit)
    )
    return list(r.scalars().all())


# ----- Trades -----
def _trade_to_snapshot(t: Trade) -> dict:
    return {
        "exchange": t.exchange.value,
        "symbol": t.symbol,
        "side": t.side.value,
        "size": t.size,
        "entry_price": t.entry_price,
        "leverage": t.leverage,
        "opened_at": t.opened_at.isoformat() if t.opened_at else None,
        "closed_at": t.closed_at.isoformat() if t.closed_at else None,
        "exit_price": t.exit_price,
        "pnl": t.pnl,
        "order_id": t.order_id,
        "position_id": t.position_id,
    }


async def store_trade(db: AsyncSession, trade: Trade) -> StoredTradeModel:
    row = StoredTradeModel(
        exchange=trade.exchange.value,
        symbol=trade.symbol,
        side=trade.side.value,
        size=trade.size,
        entry_price=trade.entry_price,
        leverage=trade.leverage,
        opened_at=trade.opened_at,
        closed_at=trade.closed_at,
        exit_price=trade.exit_price,
        pnl=trade.pnl,
        order_id=trade.order_id,
        position_id=trade.position_id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def list_trades(
    db: AsyncSession,
    exchange: Optional[str] = None,
    limit: int = 100,
) -> List[StoredTradeModel]:
    q = select(StoredTradeModel).order_by(desc(StoredTradeModel.opened_at)).limit(limit)
    if exchange:
        q = q.where(StoredTradeModel.exchange == exchange)
    r = await db.execute(q)
    return list(r.scalars().all())
