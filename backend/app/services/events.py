import datetime
import logging
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import (
    Attendance,
    AttendanceStatus,
    Attendee,
    Event,
    EventCategory,
    EventStatus,
    EventType,
    EventVisibility,
    Host,
    BaseUser,
)
from app.schemas import (
    AttendanceProfile,
    EventAttendanceSummary,
    EventAttendeeDetails,
    PhysicalEventResponse,
    RecurrenceRule,
)
from app.utils.geo import calculate_distance

logger = logging.getLogger("app.services.events")


async def get_attendance_counts(
    db: AsyncSession, event_id: int
) -> tuple[int, int]:
    """Retrieve aggregate RSVP and Checked-In attendance counts for an event."""
    rsvp_stmt = select(func.count(Attendance.id)).filter(
        Attendance.event_id == event_id
    )
    checked_stmt = select(func.count(Attendance.id)).filter(
        Attendance.event_id == event_id,
        Attendance.status == AttendanceStatus.CheckedIn,
    )

    rsvp_res = await db.execute(rsvp_stmt)
    checked_res = await db.execute(checked_stmt)

    return rsvp_res.scalar() or 0, checked_res.scalar() or 0


async def create_physical_event(
    db: AsyncSession,
    host_id: int,
    name: str,
    description: str | None,
    category: EventCategory,
    visibility: EventVisibility,
    start_time: datetime.datetime,
    end_time: datetime.datetime,
    latitude: float,
    longitude: float,
    geofence_radius: float | None,
    attendance_profile: AttendanceProfile,
    recurrence: RecurrenceRule | None,
) -> Event:
    """Create a new physical event with geofencing coordinates and recurrence metadata."""
    # Location coordinates string representation
    location_str = f"{latitude},{longitude}"

    # Build legacy description metadata structure
    metadata = {
        "latitude": latitude,
        "longitude": longitude,
        "geofence_radius": geofence_radius if geofence_radius is not None else 100.0,
        "attendance_profile": attendance_profile.value,
        "attendance_window_minutes": attendance_profile.duration_minutes(),
        "recurrence": recurrence.model_dump() if recurrence else None,
    }

    # Format description to include metadata block
    clean_desc = description.strip() if description else ""
    event = Event(
        title=name,
        description=clean_desc,  # Will serialize metadata via helper property
        location=location_str,
        event_type="Physical",
        category=category,
        status=EventStatus.Scheduled,
        visibility=visibility,
        host_id=host_id,
        start_time=start_time,
        end_time=end_time,
    )

    # Force setter to write metadata block to description
    event.parsed_metadata = metadata

    db.add(event)
    await db.commit()
    await db.refresh(event)

    return event


async def get_event_by_id(db: AsyncSession, event_id: int) -> tuple[Event, BaseUser]:
    """Retrieve event by ID alongside its host BaseUser profile details."""
    stmt = select(Event).filter(Event.id == event_id)
    res = await db.execute(stmt)
    event = res.scalars().first()

    if not event:
        raise ValueError("Event not found")

    host_stmt = select(BaseUser).filter(BaseUser.id == event.host_id)
    host_res = await db.execute(host_stmt)
    host_user = host_res.scalars().first()

    if not host_user:
        raise ValueError("Host user not found")

    return event, host_user


async def update_event(
    db: AsyncSession,
    event_id: int,
    host_id: int,
    name: str | None,
    description: str | None,
    category: EventCategory | None,
    visibility: EventVisibility | None,
    start_time: datetime.datetime | None,
    end_time: datetime.datetime | None,
    latitude: float | None,
    longitude: float | None,
    geofence_radius: float | None,
    attendance_profile: AttendanceProfile | None,
    recurrence: RecurrenceRule | None,
) -> Event:
    """Update event properties and internal coordinate metadata blocks."""
    event, _ = await get_event_by_id(db, event_id)

    if event.host_id != host_id:
        raise PermissionError("Unauthorized: You are not the host of this event")

    # Load current metadata properties
    metadata = event.parsed_metadata

    if latitude is not None:
        metadata["latitude"] = latitude
    if longitude is not None:
        metadata["longitude"] = longitude
    if geofence_radius is not None:
        metadata["geofence_radius"] = geofence_radius
    if attendance_profile is not None:
        metadata["attendance_profile"] = attendance_profile.value
        metadata["attendance_window_minutes"] = (
            attendance_profile.duration_minutes()
        )
    if recurrence is not None:
        metadata["recurrence"] = recurrence.model_dump()

    # Update description text
    clean_desc = (
        description
        if description is not None
        else (event.clean_description or "")
    )
    event.description = clean_desc
    event.parsed_metadata = metadata

    if name is not None:
        event.title = name
    if category is not None:
        event.category = category
    if visibility is not None:
        event.visibility = visibility
    if start_time is not None:
        event.start_time = start_time
    if end_time is not None:
        event.end_time = end_time

    if latitude is not None or longitude is not None:
        lat = latitude if latitude is not None else metadata.get("latitude", 0.0)
        lon = (
            longitude if longitude is not None else metadata.get("longitude", 0.0)
        )
        event.location = f"{lat},{lon}"

    event.updated_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(event)

    return event


async def cancel_event(db: AsyncSession, event_id: int, host_id: int) -> Event:
    """Transition scheduled event status to Cancelled."""
    event, _ = await get_event_by_id(db, event_id)

    if event.host_id != host_id:
        raise PermissionError("Unauthorized: You are not the host of this event")

    if event.status == EventStatus.Cancelled:
        raise ValueError("Event is already cancelled")

    event.status = EventStatus.Cancelled
    event.updated_at = datetime.datetime.utcnow()

    await db.commit()
    await db.refresh(event)

    return event


async def rsvp_event(
    db: AsyncSession, event_id: int, attendee_id: int
) -> Attendance:
    """Create a new RSVPs (Registered) record for an upcoming event."""
    event, _ = await get_event_by_id(db, event_id)

    if event.status == EventStatus.Cancelled:
        raise ValueError("Cannot RSVP to a cancelled event")
    if event.status == EventStatus.Completed:
        raise ValueError("Cannot RSVP to a completed event")

    # Check for existing RSVP
    stmt = select(Attendance).filter(
        Attendance.event_id == event_id,
        Attendance.attendee_id == attendee_id,
    )
    res = await db.execute(stmt)
    existing = res.scalars().first()

    if existing:
        raise ValueError("Already registered for this event")

    rsvp = Attendance(
        event_id=event_id,
        attendee_id=attendee_id,
        status=AttendanceStatus.Registered,
    )

    db.add(rsvp)
    await db.commit()
    await db.refresh(rsvp)

    return rsvp


async def mark_attendance(
    db: AsyncSession,
    event_id: int,
    attendee_id: int,
    verify_location: bool,
    user_latitude: float | None,
    user_longitude: float | None,
) -> tuple[Attendance, bool, bool]:
    """Execute event attendee check-in and location/timing validations."""
    event, _ = await get_event_by_id(db, event_id)
    metadata = event.parsed_metadata

    # Retrieve RSVP
    stmt = select(Attendance).filter(
        Attendance.event_id == event_id,
        Attendance.attendee_id == attendee_id,
    )
    res = await db.execute(stmt)
    rsvp = res.scalars().first()

    if not rsvp:
        raise ValueError("No RSVP found. Please RSVP first.")

    if rsvp.status == AttendanceStatus.CheckedIn:
        raise ValueError("Already checked in for this event")

    now = datetime.datetime.utcnow()
    # Align timezone naive datetime for comparison
    start_time = event.start_time.replace(tzinfo=None)
    end_time = event.end_time.replace(tzinfo=None)

    if now < start_time:
        raise ValueError("Event has not started yet")

    # Timing rules & late flags
    window_minutes = metadata.get("attendance_window_minutes")
    is_late = False

    if window_minutes is not None:
        window_end = start_time + datetime.timedelta(minutes=window_minutes)
        if now > window_end:
            if event.status != EventStatus.Completed:
                is_late = True
            else:
                raise ValueError("Attendance window has closed")
    else:
        if now > end_time and event.status == EventStatus.Completed:
            raise ValueError("Event has ended and been closed")
        elif now > end_time:
            is_late = True

    # Location rules & geofencing
    location_verified = False
    if verify_location:
        if user_latitude is None or user_longitude is None:
            raise ValueError("Coordinates required for location verification")

        event_lat = metadata.get("latitude", 0.0)
        event_lon = metadata.get("longitude", 0.0)
        geofence_radius = metadata.get("geofence_radius", 100.0)

        distance = calculate_distance(
            user_latitude, user_longitude, event_lat, event_lon
        )

        if distance > geofence_radius:
            raise ValueError(
                f"You are too far from the event location ({distance:.0f}m away, max: {geofence_radius:.0f}m)"
            )

        location_verified = True

    rsvp.status = AttendanceStatus.CheckedIn
    rsvp.updated_at = now

    await db.commit()
    await db.refresh(rsvp)

    return rsvp, location_verified, is_late


async def get_event_attendance_summary(
    db: AsyncSession, event_id: int, host_id: int
) -> EventAttendanceSummary:
    """Retrieve attendance RSVP registries and check-in aggregates for the host."""
    event, _ = await get_event_by_id(db, event_id)

    if event.host_id != host_id:
        raise PermissionError("Unauthorized: You are not the host of this event")

    window_minutes = event.parsed_metadata.get("attendance_window_minutes")
    start_time = event.start_time.replace(tzinfo=None)

    # Get RSVP list
    stmt = (
        select(Attendance, BaseUser)
        .join(BaseUser, BaseUser.id == Attendance.attendee_id)
        .filter(Attendance.event_id == event_id)
    )
    res = await db.execute(stmt)
    rows = res.all()

    attendees = []
    total_rsvp = 0
    total_checked_in = 0
    total_no_show = 0
    total_late = 0

    for attendance_rec, user_rec in rows:
        total_rsvp += 1
        if attendance_rec.status == AttendanceStatus.CheckedIn:
            total_checked_in += 1
        elif attendance_rec.status == AttendanceStatus.NoShow:
            total_no_show += 1

        is_late = False
        if attendance_rec.status == AttendanceStatus.CheckedIn:
            check_in_time = attendance_rec.updated_at.replace(tzinfo=None)
            if window_minutes is not None:
                window_end = start_time + datetime.timedelta(
                    minutes=window_minutes
                )
                if check_in_time > window_end:
                    is_late = True
                    total_late += 1

        attendees.append(
            EventAttendeeDetails(
                attendee_id=user_rec.id,
                username=user_rec.username,
                first_name=user_rec.first_name,
                last_name=user_rec.last_name,
                status=attendance_rec.status,
                rsvp_time=attendance_rec.created_at,
                check_in_time=(
                    attendance_rec.updated_at
                    if attendance_rec.status == AttendanceStatus.CheckedIn
                    else None
                ),
                is_late=is_late,
            )
        )

    return EventAttendanceSummary(
        event_id=event_id,
        total_rsvp=total_rsvp,
        total_checked_in=total_checked_in,
        total_no_show=total_no_show,
        total_late=total_late,
        attendees=attendees,
    )


async def list_events_by_type(
    db: AsyncSession,
    event_type: EventType,
    status: EventStatus | None,
    host_id: int | None,
    limit: int | None,
    offset: int | None,
) -> tuple[list[Event], int]:
    """Retrieve events list by type with dynamic pagination and filter flags."""
    
    stmt = select(Event).filter(Event.event_type == event_type)  # <-- uses param now
    
    if status is not None:
        stmt = stmt.filter(Event.status == status)
    if host_id is not None:
        stmt = stmt.filter(Event.host_id == host_id)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    count_res = await db.execute(count_stmt)
    total = count_res.scalar() or 0

    if offset is not None:
        stmt = stmt.offset(offset)
    if limit is not None:
        stmt = stmt.limit(limit)

    res = await db.execute(stmt)
    events = list(res.scalars().all())
    return events, total

async def event_to_response(
    db: AsyncSession, event: Event, host_name: str
) -> PhysicalEventResponse:
    """Compile event object model and attendance aggregates into PhysicalEventResponse."""
    rsvp_count, checked_in_count = await get_attendance_counts(db, event.id)
    metadata = event.parsed_metadata

    profile_val = metadata.get("attendance_profile", "standard")
    try:
        attendance_profile = AttendanceProfile(profile_val)
    except ValueError:
        attendance_profile = AttendanceProfile.Standard

    return PhysicalEventResponse(
        id=event.id,
        name=event.title,
        description=event.clean_description,
        category=event.category,
        status=event.status,
        visibility=event.visibility,
        host_id=event.host_id,
        host_name=host_name,
        start_time=event.start_time,
        end_time=event.end_time,
        latitude=metadata.get("latitude", 0.0),
        longitude=metadata.get("longitude", 0.0),
        geofence_radius=metadata.get("geofence_radius"),
        attendance_profile=attendance_profile,
        attendance_window_minutes=metadata.get("attendance_window_minutes"),
        rsvp_count=rsvp_count,
        checked_in_count=checked_in_count,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )
