import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from app.config import settings
from app.database import DatabaseDep
from app.models import AccountType, TokenScope, BaseUser
from app.redis import RedisDep
from app.schemas import (
    ActivateAccountResponse,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    ResendOtpRequest,
    ResendOtpResponse,
    SwitchUserScopeResponse,
    VerifyAccountResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
)
from app.utils.auth import (
    CurrentBaseUserDep,
    OtpBaseUserDep,
    TokenCredentialsDep,
    create_jwt,
    decode_jwt,
)
from app.services.users import authenticate_user
from app.utils.email import (
    blacklist_token,
    generate_otp,
    send_otp_email,
    send_verified_welcome_email,
    store_otp_in_redis,
    verify_otp_from_redis,
)

logger = logging.getLogger("app.routers.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    db: DatabaseDep,
) -> LoginResponse:
    """Authenticate credentials and generate scoped JWT access token."""
    try:
        user_info = await authenticate_user(
            db, payload.identifier, payload.password
        )
    except ValueError as e:
        logger.warning(f"Failed login attempt for {payload.identifier}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    # Fetch full BaseUser object to identify scope
    stmt = select(BaseUser).filter(BaseUser.id == user_info.id)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BaseUser not found",
        )

    # Scopes map: Attendee -> access, Host -> host
    scope = (
        TokenScope.Host.value
        if user.account_type == AccountType.Host
        else TokenScope.Attendee.value
    )

    token = create_jwt(
        user.id,
        scope,
        expires_in=settings.jwt_expiry_seconds,
    )

    logger.info(f"BaseUser {user.id} successfully authenticated with scope '{scope}'")

    return LoginResponse(
        token=token,
        token_type="Bearer",
        expires_in=settings.jwt_expiry_seconds,
        account_type=user.account_type.value,
    )


@router.post("/verify-otp", response_model=VerifyOtpResponse)
async def verify_otp(
    payload: VerifyOtpRequest,
    redis_client: RedisDep,
    db: DatabaseDep,
) -> VerifyOtpResponse:
    """Verify 6-digit email OTP and issue short-lived verification token."""
    # Check OTP correctness from Redis
    is_valid = await verify_otp_from_redis(
        redis_client, payload.email, payload.otp
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    # Retrieve BaseUser ID to issue verification token
    stmt = select(BaseUser).filter(BaseUser.email == payload.email)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BaseUser not found",
        )

    # Issue "otp" scoped JWT token
    token = create_jwt(
        user.id,
        "otp",
        expires_in=settings.verification_token_expiry_seconds,
    )

    logger.info(f"OTP verified successfully for {payload.email}")

    return VerifyOtpResponse(
        token=token,
        token_type="Bearer",
        message="OTP verified successfully. Use the provided bearer token for verification/activation endpoints.",
    )


@router.post("/verify-account", response_model=VerifyAccountResponse)
async def verify_account(
    otp_user: OtpBaseUserDep,
    db: DatabaseDep,
) -> VerifyAccountResponse:
    """Verify and activate registration (requires active otp bearer token)."""
    user_id = otp_user.id
    email = otp_user.email
    first_name = otp_user.first_name or otp_user.username

    otp_user.verified = True
    otp_user.is_active = True
    await db.commit()

    try:
        await send_verified_welcome_email(email, first_name)
    except Exception as e:
        logger.error(f"Failed to dispatch welcome verified email to {email}: {e}")

    token = create_jwt(
        otp_user.id,
        TokenScope.Attendee.value,
        expires_in=settings.jwt_expiry_seconds,
    )

    logger.info(f"Account verified successfully for user {user_id}")

    return VerifyAccountResponse(
        success=True,
        message="Account verified successfully.",
        token=token,
        token_type="Bearer",
    )

@router.post("/logout", response_model=LogoutResponse)
async def logout(
    current_user: CurrentBaseUserDep,
    credentials: TokenCredentialsDep,
    redis_client: RedisDep,
) -> LogoutResponse:
    """Revoke and blacklist current active access token."""
    token = credentials.credentials

    # Blacklist the current token with a standard 24h (86400s) window
    await blacklist_token(redis_client, token, settings.jwt_expiry_seconds)

    logger.info(f"BaseUser {current_user.id} logged out successfully")

    return LogoutResponse(
        success=True,
        message="Logged out successfully",
    )


@router.post("/resend-otp", response_model=ResendOtpResponse)
async def resend_otp(
    payload: ResendOtpRequest,
    db: DatabaseDep,
    redis_client: RedisDep,
) -> ResendOtpResponse:
    """Regenerate and email a fresh 6-digit OTP code to the user."""
    stmt = select(BaseUser).filter(BaseUser.email == payload.email)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BaseUser not found with this email",
        )

    # Generate and store OTP code
    otp = generate_otp()
    await store_otp_in_redis(
        redis_client, payload.email, otp, settings.otp_expiry_seconds
    )

    # Deliver via email helper
    try:
        await send_otp_email(payload.email, otp)
    except Exception as e:
        logger.error(f"Failed to deliver OTP to {payload.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email",
        )

    logger.info(f"OTP resent successfully to {payload.email}")

    return ResendOtpResponse(
        success=True,
        message="OTP sent successfully. Please check your email.",
    )


@router.post("/activate-account", response_model=ActivateAccountResponse)
async def activate_account_handler(
    otp_user: OtpBaseUserDep,
    db: DatabaseDep,
) -> ActivateAccountResponse:
    """Reactivate account (requires active otp bearer token)."""
    user_id = otp_user.id

    otp_user.is_active = True
    await db.commit()

    logger.info(f"Account reactivated successfully for user {user_id}")

    return ActivateAccountResponse(
        success=True,
        message="Account activated successfully. You can now log in.",
    )

@router.post("/switch-scope", response_model=SwitchUserScopeResponse)
async def switch_user_scope(
    current_user: CurrentBaseUserDep,
    credentials: TokenCredentialsDep,
    redis_client: RedisDep,
) -> SwitchUserScopeResponse:
    """Toggle bearer access token scopes between Attendee ('access') and Host ('host')."""
    token = credentials.credentials

    try:
        claims = decode_jwt(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    current_scope = claims.get("scope", "access")

    # Determine target scope
    if current_scope == "access":
        target_scope = "host"
    elif current_scope == "host":
        target_scope = "access"
    else:
        target_scope = "host"

    # Revoke current token
    await blacklist_token(redis_client, token, settings.jwt_expiry_seconds)

    # Generate new scoped token
    new_token = create_jwt(
        current_user.id,
        target_scope,
        expires_in=settings.jwt_expiry_seconds,
    )

    logger.info(
        f"BaseUser {current_user.id} switched from scope '{current_scope}' to '{target_scope}'"
    )

    return SwitchUserScopeResponse(
        new_access_token=new_token,
        new_scope=target_scope,
        message=f"Switched to {target_scope} scope successfully",
    )
