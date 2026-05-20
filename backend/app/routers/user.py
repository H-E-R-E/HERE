import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from app.database import DatabaseDep
from app.models import (
    Attendee,
    EventCategoryRecord,
    Host,
    MotivationRecord,
    SkillRecord,
    BaseUser,
    attendee_motivations,
    categories_join,
)
from app.redis import RedisDep
from app.schemas import (
    DeleteAccountResponse,
    SignShow,
    SignUp,
    UpdateProfileRequest,
    UpdateProfileResponse,
    UserMeResponse,
)
from app.services import users as user_service
from app.utils.auth import CurrentBaseUserDep, TokenCredentialsDep
from app.utils.email import blacklist_token
from app.config import settings

logger = logging.getLogger("app.routers.user")
router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "/signup",
    response_model=SignShow,
    status_code=status.HTTP_201_CREATED,
)
async def signup(
    payload: SignUp,
    db: DatabaseDep,
    redis_client: RedisDep,
) -> SignShow:
    """Create a new local or OAuth user account (Initializes Joined Attendee and Host records)."""
    try:
        user_show = await user_service.create_user(db, redis_client, payload)
        logger.info(f"Successfully signed up user {user_show.id}")
        return user_show
    except ValueError as e:
        error_msg = str(e)
        logger.warning(f"Signup validation conflict: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=error_msg,
        )
    except Exception as e:
        logger.error(f"Internal database error during user signup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the account.",
        )


@router.get("/me", response_model=UserMeResponse)
async def get_me(
    current_user: CurrentBaseUserDep,
    db: DatabaseDep,
) -> UserMeResponse:
    """Retrieve detailed user account metadata, including polymorphic profile preferences."""
    # 1. Fetch skills
    skills_stmt = select(SkillRecord).filter(
        SkillRecord.user_id == current_user.id
    )
    skills_res = await db.execute(skills_stmt)
    skills = [s.name for s in skills_res.scalars().all()]

    # 2. Fetch Attendee profile relations
    attendee_stmt = select(Attendee).filter(
        Attendee.user_id == current_user.id
    )
    attendee_res = await db.execute(attendee_stmt)
    attendee = attendee_res.scalars().first()

    preferred_categories = []
    motivations = []
    preferred_event_type = None

    if attendee:
        preferred_event_type = attendee.preferred_event_type

        # Fetch Category relations
        cat_stmt = (
            select(EventCategoryRecord)
            .join(
                categories_join,
                categories_join.c.category_id == EventCategoryRecord.id,
            )
            .filter(categories_join.c.attendee_id == current_user.id)
        )
        cat_res = await db.execute(cat_stmt)
        preferred_categories = [c.name for c in cat_res.scalars().all()]

        # Fetch Motivation relations
        mot_stmt = (
            select(MotivationRecord)
            .join(
                attendee_motivations,
                attendee_motivations.c.motivation_id == MotivationRecord.id,
            )
            .filter(attendee_motivations.c.attendee_id == current_user.id)
        )
        mot_res = await db.execute(mot_stmt)
        motivations = [m.motivation for m in mot_res.scalars().all()]

    # 3. Fetch Host profile relations
    host_stmt = select(Host).filter(Host.user_id == current_user.id)
    host_res = await db.execute(host_stmt)
    host = host_res.scalars().first()

    org_name = host.organization_name if host else None
    org_website = host.organization_website if host else None

    return UserMeResponse(
        id=current_user.id,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        account_type=current_user.account_type.value,
        verified=current_user.verified,
        skills=skills,
        preferred_categories=preferred_categories,
        motivations=motivations,
        organization_name=org_name,
        organization_website=org_website,
        preferred_event_type=preferred_event_type,
    )


@router.put("/profile", response_model=UpdateProfileResponse)
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: CurrentBaseUserDep,
    db: DatabaseDep,
) -> UpdateProfileResponse:
    """Modify user basic profile names, avatar, and preferred event scopes."""
    try:
        await user_service.update_user_profile(db, current_user.id, payload)
        logger.info(f"BaseUser {current_user.id} profile updated successfully")
        return UpdateProfileResponse(
            success=True,
            message="Profile updated successfully",
        )
    except Exception as e:
        logger.error(f"Error updating profile for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile",
        )


@router.delete("/me", response_model=DeleteAccountResponse)
async def delete_account(
    current_user: CurrentBaseUserDep,
    credentials: TokenCredentialsDep,
    db: DatabaseDep,
    redis_client: RedisDep,
) -> DeleteAccountResponse:
    """Deactivate user account status and blacklist active access token."""
    user_id = current_user.id
    token = credentials.credentials

    try:
        # Mark user as inactive in database
        await user_service.deactivate_account(db, user_id)

        # Blacklist the current token
        await blacklist_token(redis_client, token, settings.jwt_expiry_seconds)

        logger.info(f"Account deactivated successfully for user {user_id}")
        return DeleteAccountResponse(
            success=True,
            message="Account deleted successfully. You can reactivate it anytime by using the activation code.",
        )
    except Exception as e:
        logger.error(f"Failed to deactivate user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account",
        )


@router.get("/health", response_model=str)
async def health_check() -> str:
    """API health-check responder."""
    return "OK"
