import datetime
from typing import Annotated
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy.future import select
from app.config import settings
from app.database import DatabaseDep
from app.models import Attendee, Host, BaseUser
from app.redis import RedisDep
from app.utils.email import is_token_blacklisted, blacklist_token

# --- 1. Password Cryptography Helpers ---
def hash_password(password: str) -> str:
    """Hash a password using bcrypt with settings rounds."""
    salt = bcrypt.gensalt(rounds=settings.hash_rounds)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hashed value."""
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


# --- 2. JWT Generation & Decoding ---
def create_jwt(user_id: int, scope: str, expires_in: int) -> str:
    """Create a signed JWT token for the user and scope."""
    payload = {
        "sub": str(user_id),
        "scope": scope,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_jwt(token: str) -> dict:
    """Decode a JWT token and extract claims. Raises PyJWTError if invalid."""
    return jwt.decode(token, settings.secret_key, algorithms=["HS256"])


# --- 3. Dependency Security Schemes & Parameter Annotations ---
oauth2_scheme = HTTPBearer(auto_error=True)

TokenCredentialsDep = Annotated[
    HTTPAuthorizationCredentials, Depends(oauth2_scheme)
]


# --- 4. Custom Auth Extractor Dependencies ---
async def get_current_user_id(
    credentials: TokenCredentialsDep,
    redis_client: RedisDep,
) -> int:
    """Verify JWT and return user ID, ensuring token is not blacklisted."""
    token = credentials.credentials
    if await is_token_blacklisted(redis_client, token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is blacklisted",
        )

    try:
        payload = decode_jwt(token)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identification",
        )

    try:
        return int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identification format",
        )


async def verify_scoped_token(
    credentials: TokenCredentialsDep,
    redis_client: RedisDep,
    expected_scope: str,
) -> int:
    """Validate token and check if the scope matches.

    OTP tokens are blacklisted immediately upon validation.
    """
    token = credentials.credentials
    if await is_token_blacklisted(redis_client, token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is blacklisted",
        )

    try:
        payload = decode_jwt(token)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    scope = payload.get("scope")
    if scope != expected_scope:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token scope. Expected: '{expected_scope}', got: '{scope}'",
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identification",
        )

    user_id = int(user_id_str)

    # Immediately blacklist OTP tokens to prevent reuse
    if expected_scope == "otp":
        await blacklist_token(
            redis_client,
            token,
            settings.verification_token_expiry_seconds,
        )

    return user_id


# --- 5. Base BaseUser Extractor ---
async def get_current_user(
    credentials: TokenCredentialsDep,
    redis_client: RedisDep,
    db: DatabaseDep,
) -> BaseUser:
    """Verify token, return standard active BaseUser."""
    user_id = await get_current_user_id(credentials, redis_client)

    result = await db.execute(select(BaseUser).filter(BaseUser.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="BaseUser not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="BaseUser account is deactivated",
        )
    return user


CurrentBaseUserDep = Annotated[BaseUser, Depends(get_current_user)]


# --- 6. Scoped Profile Extractors ---
async def get_current_attendee(
    credentials: TokenCredentialsDep,
    redis_client: RedisDep,
    db: DatabaseDep,
) -> tuple[BaseUser, Attendee]:
    """Verify 'access' scope, return BaseUser and Attendee records."""
    user_id = await verify_scoped_token(credentials, redis_client, "access")

    result = await db.execute(
        select(Attendee).filter(Attendee.user_id == user_id)
    )
    attendee = result.scalars().first()
    if not attendee:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Attendee profile not found",
        )
    if not attendee.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="BaseUser account is deactivated",
        )
    return attendee, attendee


CurrentAttendeeDep = Annotated[
    tuple[BaseUser, Attendee], Depends(get_current_attendee)
]


async def get_current_host(
    credentials: TokenCredentialsDep,
    redis_client: RedisDep,
    db: DatabaseDep,
) -> tuple[BaseUser, Host]:
    """Verify 'host' scope, return BaseUser and Host records."""
    user_id = await verify_scoped_token(credentials, redis_client, "host")

    result = await db.execute(select(Host).filter(Host.user_id == user_id))
    host = result.scalars().first()
    if not host:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Host profile not found",
        )
    if not host.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="BaseUser account is deactivated",
        )
    return host, host


CurrentHostDep = Annotated[tuple[BaseUser, Host], Depends(get_current_host)]


# --- 7. Verified BaseUser Extractors ---
async def get_verified_attendee(
    current: CurrentAttendeeDep,
) -> tuple[BaseUser, Attendee]:
    """Requires active AND verified Attendee profile."""
    user, attendee = current
    if not user.verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="BaseUser account is not verified",
        )
    return user, attendee


VerifiedAttendeeDep = Annotated[
    tuple[BaseUser, Attendee], Depends(get_verified_attendee)
]


async def get_verified_host(
    current: CurrentHostDep,
) -> tuple[BaseUser, Host]:
    """Requires active AND verified Host profile."""
    user, host = current
    if not user.verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="BaseUser account is not verified",
        )
    return user, host


VerifiedHostDep = Annotated[tuple[BaseUser, Host], Depends(get_verified_host)]


# --- 8. OTP-Scoped Extractor ---
async def get_otp_user(
    credentials: TokenCredentialsDep,
    redis_client: RedisDep,
    db: DatabaseDep,
) -> BaseUser:
    """Verify short-lived 'otp' scope, blacklists OTP token, returns BaseUser."""
    user_id = await verify_scoped_token(credentials, redis_client, "otp")

    result = await db.execute(select(BaseUser).filter(BaseUser.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="BaseUser not found",
        )
    # We do not assert is_active here so that deactivated users can reactivate
    return user


OtpBaseUserDep = Annotated[BaseUser, Depends(get_otp_user)]
