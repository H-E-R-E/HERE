from typing import List
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload

from app.database import DatabaseDep
from app.models.notification import Notification
from app.schemas import NotificationResponse, NotificationListResponse
from app.utils.auth import CurrentBaseUserDep

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=NotificationListResponse)
async def get_notifications(db: DatabaseDep, current_user: CurrentBaseUserDep):
    """Retrieve all notifications for the current user."""
    # Fetch notifications
    result = await db.execute(
        select(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()
    
    # Calculate unread count
    unread_count = sum(1 for n in notifications if not n.is_read)
    
    return NotificationListResponse(
        notifications=[
            NotificationResponse(
                id=n.id,
                user_id=n.user_id,
                title=n.title,
                message=n.message,
                is_read=n.is_read,
                created_at=n.created_at,
                event_id=n.event_id,
            )
            for n in notifications
        ],
        unread_count=unread_count
    )

@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: int, 
    db: DatabaseDep, 
    current_user: CurrentBaseUserDep
):
    """Mark a specific notification as read."""
    result = await db.execute(
        select(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    notification = result.scalars().first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
        
    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    
    return NotificationResponse(
        id=notification.id,
        user_id=notification.user_id,
        title=notification.title,
        message=notification.message,
        is_read=notification.is_read,
        created_at=notification.created_at,
        event_id=notification.event_id,
    )

@router.put("/read_all", response_model=dict)
async def mark_all_notifications_as_read(db: DatabaseDep, current_user: CurrentBaseUserDep):
    """Mark all notifications for the current user as read."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    
    return {"success": True, "message": "All notifications marked as read"}
