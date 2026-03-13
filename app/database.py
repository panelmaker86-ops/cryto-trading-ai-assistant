"""
Database setup for Strategy Guardian AI.
Uses SQLite by default (async via aiosqlite); set DATABASE_URL for PostgreSQL.
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


def get_engine():
    url = get_settings().database_url
    if url.startswith("sqlite"):
        url = url.replace("sqlite+aiosqlite", "sqlite+aiosqlite", 1)
    return create_async_engine(
        url,
        echo=False,
    )


class Base(DeclarativeBase):
    pass


engine = get_engine()
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session() as session:
        yield session


async def init_db():
    """Create tables. Call on startup."""
    import app.db.models  # noqa: F401 - register tables with Base.metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
