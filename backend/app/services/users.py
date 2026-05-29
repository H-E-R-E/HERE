import asyncio
import logging
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.config import settings
from app.models import AccountType, Attendee, EventType, Host, SignupType, BaseUser
from app.schemas import SignShow, SignUp, UpdateProfileRequest
from app.utils.auth import hash_password, verify_password
from app.utils.email import (
    generate_otp,
    send_verified_welcome_email,
    send_welcome_email,
    store_otp_in_redis,
)
import redis.asyncio as aioredis

from sqlalchemy import insert
from sqlalchemy import or_

logger = logging.getLogger("app.services.users")


async def create_attendee_and_host_records(
    db: AsyncSession, user_id: int
) -> None:
    """Create linked Attendee and Host records for a new user bypassing ORM duplication."""
    # Insert directly into attendees table via Core
    await db.execute(
        insert(Attendee.__table__).values(
            user_id=user_id,
            preferred_event_type=EventType.Physical,
        )
    )

    # Insert directly into hosts table via Core
    await db.execute(
        insert(Host.__table__).values(
            user_id=user_id,
            organization_name=None,
            organization_website=None,
            events_hosted_count=0,
        )
    )
    await db.flush()


async def create_user(
    db: AsyncSession,
    redis_client: aioredis.Redis,
    signup: SignUp,
) -> SignShow:
    """Create a new user, initiate polymorphic records, and schedule a welcome email."""
    # Check for existing email or username
    existing_stmt = select(BaseUser).filter(
        or_(BaseUser.email == signup.email, BaseUser.username == signup.username)
    )
    existing_res = await db.execute(existing_stmt)
    existing_user = existing_res.scalars().first()

    if existing_user:
        if existing_user.email == signup.email:
            raise ValueError("BaseUser with this email already exists")
        else:
            raise ValueError("BaseUser with this username already exists")

    is_verified = signup.signup_type in (
        SignupType.Google,
        SignupType.Facebook,
        SignupType.Apple,
    )

    # Create base user
    new_user = BaseUser(
        username=signup.username,
        email=signup.email,
        first_name=signup.first_name,
        last_name=signup.last_name,
        avatar_url=signup.avatar_url,
        signup_type=signup.signup_type,
        account_type=AccountType.Attendee,
        verified=is_verified,
        password=hash_password(signup.password),
    )
    db.add(new_user)
    await db.flush()

    # Create Attendee and Host subclass records
    await create_attendee_and_host_records(db, new_user.id)
    await db.commit()

    # Dispatch welcome emails asynchronously (as background tasks)
    user_id = new_user.id
    email = signup.email
    first_name = signup.first_name or signup.username
    signup_type = signup.signup_type

    async def handle_welcome_flow():
        if signup_type == SignupType.Local:
            otp = generate_otp()
            try:
                # Store in Redis
                await store_otp_in_redis(
                    redis_client, email, otp, settings.otp_expiry_seconds
                )
                # Send email
                await send_welcome_email(email, first_name, otp)
            except Exception as e:
                logger.error(f"Failed welcome flow for local user {user_id}: {e}")
        else:
            try:
                await send_verified_welcome_email(email, first_name)
            except Exception as e:
                logger.error(f"Failed welcome flow for OAuth user {user_id}: {e}")

    asyncio.create_task(handle_welcome_flow())

    return SignShow(
        id=user_id,
        username=signup.username,
        first_name=signup.first_name,
        last_name=signup.last_name,
        email=signup.email,
        avatar_url=signup.avatar_url,
    )


async def authenticate_user(
    db: AsyncSession, identifier: str, password: str
) -> SignShow:
    """Authenticate active user by username/email and password."""
    stmt = select(BaseUser).filter(
        or_(BaseUser.email == identifier, BaseUser.username == identifier)
    )
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        raise ValueError("BaseUser not found")

    if not user.is_active:
        raise ValueError(
            "Account has been disabled. Please contact support or reactivate your account."
        )

    if not verify_password(password, user.password):
        raise ValueError("Invalid password")

    return SignShow(
        id=user.id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        avatar_url=user.avatar_url,
    )


async def deactivate_account(db: AsyncSession, user_id: int) -> None:
    """Deactivate a user account."""
    stmt = select(BaseUser).filter(BaseUser.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        raise ValueError("BaseUser not found")

    user.is_active = False
    await db.commit()
    logger.info(f"BaseUser {user_id} account deactivated")


async def activate_account(db: AsyncSession, email: str) -> None:
    """Re-activate a user account using email identification."""
    stmt = select(BaseUser).filter(BaseUser.email == email)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        raise ValueError("BaseUser not found")

    user.is_active = True
    await db.commit()
    logger.info(f"BaseUser account with email {email} activated")


async def get_user_by_id(db: AsyncSession, user_id: int) -> SignShow:
    """Fetch user basic serialization profile by ID."""
    stmt = select(BaseUser).filter(BaseUser.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        raise ValueError("BaseUser not found")

    return SignShow(
        id=user.id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        avatar_url=user.avatar_url,
    )


async def update_user_profile(
    db: AsyncSession, user_id: int, update_data: UpdateProfileRequest
) -> None:
    """Update user basic profiles and polymorphic attendee/host tables."""
    # 1. Update basic BaseUser columns
    if (
        update_data.first_name is not None
        or update_data.last_name is not None
        or update_data.avatar_url is not None
    ):
        stmt = select(BaseUser).filter(BaseUser.id == user_id)
        res = await db.execute(stmt)
        user = res.scalars().first()

        if not user:
            raise ValueError("BaseUser not found")

        if update_data.first_name is not None:
            user.first_name = update_data.first_name
        if update_data.last_name is not None:
            user.last_name = update_data.last_name
        if update_data.avatar_url is not None:
            user.avatar_url = update_data.avatar_url

        logger.info(f"BaseUser {user_id} basic info updated")

    # 2. Update Attendee specific preference
    if update_data.preferred_event_type is not None:
        stmt = select(Attendee).filter(Attendee.user_id == user_id)
        res = await db.execute(stmt)
        attendee = res.scalars().first()

        if attendee:
            attendee.preferred_event_type = update_data.preferred_event_type
            logger.info(f"BaseUser {user_id} attendee preferences updated")

    # 3. Update Host specific organization details
    if (
        update_data.organization_name is not None
        or update_data.organization_website is not None
    ):
        stmt = select(Host).filter(Host.user_id == user_id)
        res = await db.execute(stmt)
        host = res.scalars().first()

        if host:
            if update_data.organization_name is not None:
                host.organization_name = update_data.organization_name
            if update_data.organization_website is not None:
                host.organization_website = update_data.organization_website
            logger.info(f"User {user_id} host organization updated")

    await db.commit()
