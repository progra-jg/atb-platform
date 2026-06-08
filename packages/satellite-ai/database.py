import asyncpg
from config import DATABASE_URL

pool: asyncpg.Pool | None = None

async def init_db():
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)

async def close_db():
    global pool
    if pool:
        await pool.close()

async def fetch_rows(query: str, *args):
    async with pool.acquire() as conn:
        return await conn.fetch(query, *args)

async def fetch_row(query: str, *args):
    async with pool.acquire() as conn:
        return await conn.fetchrow(query, *args)

async def execute(query: str, *args):
    async with pool.acquire() as conn:
        return await conn.execute(query, *args)
