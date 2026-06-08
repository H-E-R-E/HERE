from typing import Annotated
from fastapi import Depends
import redis.asyncio as aioredis
from app.config import settings


# Initialize connection pool with standard decoded responses
redis_pool = aioredis.ConnectionPool.from_url(
    settings.redis_url, decode_responses=True
)


async def get_redis():
    """Dependency yielding an active async Redis connection."""
    client = aioredis.Redis(connection_pool=redis_pool, decode_responses=True)
    try:
        yield client
    finally:
        await client.aclose()


# FastAPI dependency injection alias
RedisDep = Annotated[aioredis.Redis, Depends(get_redis)]
