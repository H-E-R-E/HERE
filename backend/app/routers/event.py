import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.future import select
from app.database import DatabaseDep
from app.models import Attendance, AttendanceStatus, EventStatus, BaseUser
from app.schemas import (
    CancelEventRequest,
    CancelEventResponse,
    CreatePhysicalEventRequest,
    EventAttendanceSummary,
    EventType,
    MarkAttendanceRequest,
    AttendanceResponse,
    PhysicalEventResponse,
    PhysicalEventsListResponse,
    RsvpEventRequest,
    RsvpResponse,
    RsvpStatusResponse,
    UpdatePhysicalEventRequest,
)
from app.services import events as event_service
from app.utils.auth import (
    CurrentAttendeeDep,
    CurrentHostDep,
    VerifiedAttendeeDep,
)

logger = logging.getLogger("app.routers.event")
router = APIRouter(prefix="/api", tags=["Events"])


@router.post(
    "/events/{event_type}",
    response_model=PhysicalEventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    event_type: str,
    payload: CreatePhysicalEventRequest,
    db: DatabaseDep,
    current_host: CurrentHostDep,
) -> PhysicalEventResponse:
    """Create a new physical event (Host only)."""
    if event_type.lower() != "physical":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 'physical' event type is supported",
        )

    host_user, host_record = current_host

    try:
        event = await event_service.create_physical_event(
            db=db,
            host_id=host_record.user_id,
            name=payload.name,
            description=payload.description,
            category=payload.category,
            visibility=payload.visibility,
            start_time=payload.start_time,
            end_time=payload.end_time,
            latitude=payload.latitude,
            longitude=payload.longitude,
            geofence_radius=payload.geofence_radius,
            attendance_profile=payload.attendance_profile,
            recurrence=payload.recurrence,
        )

        logger.info(
            f"Host {host_record.user_id} created physical event {event.id}"
        )

        # Convert to response
        return await event_service.event_to_response(
            db, event, host_user.username
        )
    except Exception as e:
        logger.error(f"Failed to create event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create event",
        )


@router.get(
    "/events/{event_type}/{event_id}",
    response_model=PhysicalEventResponse,
)
async def get_event(
    event_type: str,
    event_id: int,
    db: DatabaseDep,
) -> PhysicalEventResponse:
    """Retrieve event profile details and attendance aggregate counts by ID."""
    if event_type.lower() != "physical":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 'physical' event type is supported",
        )

    try:
        event, host_user = await event_service.get_event_by_id(db, event_id)
        return await event_service.event_to_response(
            db, event, host_user.username
        )
    except ValueError as e:
        logger.warning(f"Event lookup failed for {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to retrieve event details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.put(
    "/events/{event_type}/{event_id}",
    response_model=PhysicalEventResponse,
)
async def update_event_handler(
    event_type: str,
    event_id: int,
    payload: UpdatePhysicalEventRequest,
    db: DatabaseDep,
    current_host: CurrentHostDep,
) -> PhysicalEventResponse:
    """Update event properties, location coordinates and attendance ranges (Host only)."""
    if event_type.lower() != "physical":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 'physical' event type is supported",
        )

    host_user, host_record = current_host

    try:
        event = await event_service.update_event(
            db=db,
            event_id=event_id,
            host_id=host_record.user_id,
            name=payload.name,
            description=payload.description,
            category=payload.category,
            visibility=payload.visibility,
            start_time=payload.start_time,
            end_time=payload.end_time,
            latitude=payload.latitude,
            longitude=payload.longitude,
            geofence_radius=payload.geofence_radius,
            attendance_profile=payload.attendance_profile,
            recurrence=payload.recurrence,
        )

        logger.info(f"Host {host_record.user_id} updated event {event.id}")
        return await event_service.event_to_response(
            db, event, host_user.username
        )
    except PermissionError as e:
        logger.warning(f"Unauthorized update attempt on event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to update event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update event",
        )


@router.delete(
    "/events/{event_type}/{event_id}",
    response_model=CancelEventResponse,
)
async def cancel_event_handler(
    event_type: str,
    event_id: int,
    db: DatabaseDep,
    current_host: CurrentHostDep,
) -> CancelEventResponse:
    """Transition event status to Cancelled (Host only)."""
    if event_type.lower() != "physical":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 'physical' event type is supported",
        )

    _, host_record = current_host

    try:
        event = await event_service.cancel_event(
            db, event_id, host_record.user_id
        )
        logger.info(f"Host {host_record.user_id} cancelled event {event.id}")
        return CancelEventResponse(
            event_id=event.id,
            status=event.status,
            message="Event cancelled successfully",
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to cancel event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel event",
        )


@router.get("/events/{event_type}", response_model=PhysicalEventsListResponse)
async def list_events(
    event_type: str,
    db: DatabaseDep,
    status_filter: Optional[EventStatus] = Query(default=None, alias="status"),
    limit: Optional[int] = Query(default=None, ge=1),
    offset: Optional[int] = Query(default=None, ge=0),
) -> PhysicalEventsListResponse:
    """List physical or virtual events with dynamic filtering and page limit offsets."""

    # Validate and resolve event type
    try:
        resolved_type = EventType(event_type.capitalize())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid event type '{event_type}'. Must be 'physical' or 'virtual'.",
        )

    try:
        events, total = await event_service.list_events_by_type(
            db=db,
            event_type=resolved_type,
            status=status_filter,
            host_id=None,
            limit=limit,
            offset=offset,
        )
        event_responses = []
        for event in events:
            host_stmt = select(BaseUser).filter(BaseUser.id == event.host_id)
            host_res = await db.execute(host_stmt)
            host_user = host_res.scalars().first()
            host_name = host_user.username if host_user else "Unknown"
            resp = await event_service.event_to_response(db, event, host_name)
            event_responses.append(resp)

        return PhysicalEventsListResponse(events=event_responses, total=total)

    except Exception as e:
        logger.error(f"Failed to list {event_type} events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list events",
        )
@router.post(
    "/events/{event_type}/{event_id}/rsvp",
    response_model=RsvpResponse,
)
async def rsvp_event_handler(
    event_type: str,
    event_id: int,
    db: DatabaseDep,
    current_attendee: CurrentAttendeeDep,
) -> RsvpResponse:
    """Reserve a registration spot for an upcoming event (Attendee only)."""
    if event_type.lower() != "physical":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 'physical' event type is supported",
        )

    _, attendee_record = current_attendee

    try:
        attendance = await event_service.rsvp_event(
            db, event_id, attendee_record.user_id
        )
        logger.info(
            f"Attendee {attendee_record.user_id} RSVPed for event {event_id}"
        )
        return RsvpResponse(
            event_id=attendance.event_id,
            attendee_id=attendance.attendee_id,
            status=attendance.status,
            message="RSVP successful",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to RSVP for event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to RSVP",
        )


@router.get(
    "/events/{event_type}/{event_id}/rsvp",
    response_model=RsvpStatusResponse,
)
async def check_rsvp_status_handler(
    event_type: str,
    event_id: int,
    db: DatabaseDep,
    current_attendee: CurrentAttendeeDep,
) -> RsvpStatusResponse:
    """Check if the current attendee has RSVPed for a specific physical event."""
    if event_type.lower() != "physical":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 'physical' event type is supported",
        )

    _, attendee_record = current_attendee

    try:
        return await event_service.check_rsvp_status(
            db, event_id, attendee_record.user_id
        )
    except ValueError as e:
        logger.warning(f"RSVP status check failed for event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to check RSVP status for event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check RSVP status",
        )



@router.post(
    "/events/{event_type}/{event_id}/attendance",
    response_model=AttendanceResponse,
)
async def mark_attendance_handler(
    event_type: str,
    event_id: int,
    payload: MarkAttendanceRequest,
    db: DatabaseDep,
    current_attendee: CurrentAttendeeDep,
) -> AttendanceResponse:
    """Check-in attendee to physical event validating ranges and geofences (Attendee only)."""
    if event_type.lower() != "physical":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 'physical' event type is supported",
        )

    _, attendee_record = current_attendee

    if payload.verify_location and (
        payload.latitude is None or payload.longitude is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude and longitude required when verify_location is true",
        )

    try:
        attendance, location_verified, is_late = (
            await event_service.mark_attendance(
                db=db,
                event_id=event_id,
                attendee_id=attendee_record.user_id,
                verify_location=payload.verify_location,
                user_latitude=payload.latitude,
                user_longitude=payload.longitude,
            )
        )

        logger.info(
            f"Attendee {attendee_record.user_id} checked in for event {event_id}"
        )
        msg = (
            "Checked in successfully (late)"
            if is_late
            else "Checked in successfully"
        )

        return AttendanceResponse(
            id=attendance.id,
            event_id=attendance.event_id,
            attendee_id=attendance.attendee_id,
            status=attendance.status,
            checked_in_at=attendance.updated_at,
            location_verified=location_verified,
            is_late=is_late,
            message=msg,
        )
    except ValueError as e:
        err_msg = str(e)
        if "not found" in err_msg.lower() or "no rsvp" in err_msg.lower():
            status_code = status.HTTP_404_NOT_FOUND
        else:
            status_code = status.HTTP_400_BAD_REQUEST
        raise HTTPException(
            status_code=status_code,
            detail=err_msg,
        )
    except Exception as e:
        logger.error(f"Failed to check-in attendee for event {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark attendance",
        )


@router.get(
    "/events/{event_type}/{event_id}/attendance",
    response_model=EventAttendanceSummary,
)
async def get_attendance_summary(
    event_type: str,
    event_id: int,
    db: DatabaseDep,
    current_host: CurrentHostDep,
) -> EventAttendanceSummary:
    """Retrieve full attendance check-in list and summary metrics (Host only)."""
    if event_type.lower() != "physical":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 'physical' event type is supported",
        )

    _, host_record = current_host

    try:
        return await event_service.get_event_attendance_summary(
            db, event_id, host_record.user_id
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to fetch attendance summary for {event_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get attendance summary",
        )
