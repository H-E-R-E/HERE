import re
import struct
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import CHAR, TypeDecorator, UserDefinedType
from app.config import settings


# --- Geographic point support (PostGIS vs. WKT SQLite) ---
class GeometryPoint(UserDefinedType):
    """PostgreSQL PostGIS custom column specification."""

    def get_col_spec(self, **kw):
        return "geometry(Point, 4326)"


class PgPoint:
    """Geographic coordinate point (x: longitude, y: latitude)."""

    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def __repr__(self) -> str:
        return f"PgPoint(x={self.x}, y={self.y})"

    def to_wkt(self) -> str:
        return f"POINT({self.x} {self.y})"

    @classmethod
    def from_wkt(cls, wkt: str) -> "PgPoint":
        match = re.match(
            r"POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)", wkt, re.IGNORECASE
        )
        if match:
            return cls(x=float(match.group(1)), y=float(match.group(2)))
        raise ValueError(f"Invalid WKT point format: {wkt}")


class PgPointAdaptor(TypeDecorator):
    """SQLAlchemy TypeDecorator mapping coordinates to binary geometry columns

    on PostgreSQL, and plain WKT strings on SQLite.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(GeometryPoint())
        else:
            return dialect.type_descriptor(CHAR(100))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, PgPoint):
            return value.to_wkt()
        if isinstance(value, dict) and "x" in value and "y" in value:
            return f"POINT({value['x']} {value['y']})"
        if isinstance(value, str):
            return value
        raise ValueError(f"Cannot serialize type {type(value)} to Point")

    def process_result_value(self, value, dialect):
        if value is None:
            return None

        # PostgreSQL PostGIS geometry column returns bytes (WKB / EWKB)
        if isinstance(value, bytes):
            # Parse WKB/EWKB format safely
            byte_order = "<" if value[0] == 1 else ">"
            geom_type = struct.unpack(byte_order + "I", value[1:5])[0]
            has_srid = bool(geom_type & 0x20000000)

            if has_srid:
                x, y = struct.unpack(byte_order + "dd", value[9:25])
            else:
                x, y = struct.unpack(byte_order + "dd", value[5:21])
            return PgPoint(x=x, y=y)

        # SQLite/CHAR text-based representations (WKT text)
        if isinstance(value, str):
            try:
                return PgPoint.from_wkt(value)
            except ValueError:
                # Fallback if hex-encoded string of EWKB returned by Postgres driver
                try:
                    hex_val = bytes.fromhex(value)
                    return self.process_result_value(hex_val, dialect)
                except Exception:
                    return value

        return value


# --- SQLAlchemy Async Engine & Session ---
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=settings.debug,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """Dependency yielding an active async database session."""
    async with async_session_factory() as session:
        yield session


# FastAPI dependency injection alias
DatabaseDep = Annotated[AsyncSession, Depends(get_db)]
