use actix_web::{
    delete, get, post, put,
    web::{Data, Json, Path, Query},
    Error, HttpResponse, Result,
};
use actix_web::error::{ErrorBadRequest, ErrorInternalServerError, ErrorNotFound, ErrorUnauthorized};
use serde::Deserialize;
use tracing::{error, info};
use validator::Validate;

use crate::core::configs::AppState;
use crate::entity::{AttendanceStatus, EventStatus};
use crate::schemas::event::*;
use crate::services::events::*;
use crate::utils::auth_extractor::{CurrentAttendee, CurrentHost};

#[derive(Debug, Deserialize)]
pub struct EventPathParams {
    pub event_type: String,
    pub event_id: i32,
}

#[derive(Debug, Deserialize)]
pub struct ListEventsQuery {
    pub status: Option<String>,
    pub limit: Option<u64>,
    pub offset: Option<u64>,
}

/// Create a physical event (HOST only)
#[utoipa::path(
    post,
    path = "/events/{event_type}",
    request_body = CreatePhysicalEventRequest,
    params(
        ("event_type" = String, Path, description = "Type of event (physical)")
    ),
    responses(
        (status = 201, description = "Event created successfully", body = PhysicalEventResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized - Host token required"),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Events",
    security(("bearer_auth" = []))
)]
#[post("/events/{event_type}")]
pub async fn create_event(
    data: Data<AppState>,
    path: Path<String>,
    payload: Json<CreatePhysicalEventRequest>,
    current_host: CurrentHost,
) -> Result<Json<PhysicalEventResponse>, Error> {
    let event_type = path.into_inner();

    if event_type != "physical" {
        return Err(ErrorBadRequest("Only 'physical' event type is supported"));
    }

    // Validate request
    payload.validate().map_err(|e| {
        error!("Validation error: {}", e);
        ErrorBadRequest(format!("Validation error: {}", e))
    })?;

    let req = payload.into_inner();
    let host = current_host.1;

    // Create event
    let event = create_physical_event(
        &data.db,
        host.user_id,
        req.name,
        req.description,
        req.category,
        req.visibility,
        req.start_time,
        req.end_time,
        req.latitude,
        req.longitude,
        req.geofence_radius,
        req.attendance_profile,
    )
    .await
    .map_err(|e| {
        error!("Failed to create event: {}", e);
        ErrorInternalServerError("Failed to create event")
    })?;

    info!("Host {} created event {}", host.user_id, event.id);

    // Build response
    let response = event_to_response(event, current_host.0.username, 0, 0).map_err(|e| {
        error!("Failed to build response: {}", e);
        ErrorInternalServerError("Failed to build response")
    })?;

    Ok(Json(response))
}

/// Get event by ID
#[utoipa::path(
    get,
    path = "/events/{event_type}/{event_id}",
    params(
        ("event_type" = String, Path, description = "Type of event (physical)"),
        ("event_id" = i32, Path, description = "Event ID")
    ),
    responses(
        (status = 200, description = "Event details retrieved", body = PhysicalEventResponse),
        (status = 404, description = "Event not found"),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Events"
)]
#[get("/events/{event_type}/{event_id}")]
pub async fn get_event(
    data: Data<AppState>,
    path: Path<EventPathParams>,
) -> Result<Json<PhysicalEventResponse>, Error> {
    let params = path.into_inner();

    if params.event_type != "physical" {
        return Err(ErrorBadRequest("Only 'physical' event type is supported"));
    }

    // Get event with host info
    let (event, host_user) = get_event_by_id(&data.db, params.event_id)
        .await
        .map_err(|e| {
            error!("Failed to get event: {}", e);
            ErrorNotFound("Event not found")
        })?;

    // Get RSVP and check-in counts
    use crate::entity::prelude::*;
    use crate::entity::attendance;
    use sea_orm::*;

    let rsvp_count = Attendance::find()
        .filter(attendance::Column::EventId.eq(params.event_id))
        .count(&data.db)
        .await
        .unwrap_or(0) as i32;

    let checked_in_count = Attendance::find()
        .filter(attendance::Column::EventId.eq(params.event_id))
        .filter(attendance::Column::Status.eq(AttendanceStatus::CheckedIn))
        .count(&data.db)
        .await
        .unwrap_or(0) as i32;

    let response = event_to_response(event, host_user.username, rsvp_count, checked_in_count)
        .map_err(|e| {
            error!("Failed to build response: {}", e);
            ErrorInternalServerError("Failed to build response")
        })?;

    Ok(Json(response))
}

/// Update event (HOST only)
#[utoipa::path(
    put,
    path = "/events/{event_type}/{event_id}",
    request_body = UpdatePhysicalEventRequest,
    params(
        ("event_type" = String, Path, description = "Type of event (physical)"),
        ("event_id" = i32, Path, description = "Event ID")
    ),
    responses(
        (status = 200, description = "Event updated successfully", body = PhysicalEventResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized - Host token required"),
        (status = 404, description = "Event not found"),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Events",
    security(("bearer_auth" = []))
)]
#[put("/events/{event_type}/{event_id}")]
pub async fn update_event(
    data: Data<AppState>,
    path: Path<EventPathParams>,
    payload: Json<UpdatePhysicalEventRequest>,
    current_host: CurrentHost,
) -> Result<Json<PhysicalEventResponse>, Error> {
    let params = path.into_inner();

    if params.event_type != "physical" {
        return Err(ErrorBadRequest("Only 'physical' event type is supported"));
    }

    // Validate request
    payload.validate().map_err(|e| {
        error!("Validation error: {}", e);
        ErrorBadRequest(format!("Validation error: {}", e))
    })?;

    let req = payload.into_inner();
    let host = current_host.1;

    // Update event
    let event = update_event(
        &data.db,
        params.event_id,
        host.user_id,
        req.name,
        req.description,
        req.category,
        req.visibility,
        req.start_time,
        req.end_time,
        req.latitude,
        req.longitude,
        req.geofence_radius,
        req.attendance_profile,
    )
    .await
    .map_err(|e| {
        error!("Failed to update event: {}", e);
        if e.to_string().contains("Unauthorized") {
            ErrorUnauthorized(e.to_string())
        } else {
            ErrorInternalServerError("Failed to update event")
        }
    })?;

    info!("Host {} updated event {}", host.user_id, event.id);

    // Get counts for response
    use crate::entity::prelude::*;
    use crate::entity::attendance;
    use sea_orm::*;

    let rsvp_count = Attendance::find()
        .filter(attendance::Column::EventId.eq(params.event_id))
        .count(&data.db)
        .await
        .unwrap_or(0) as i32;

    let checked_in_count = Attendance::find()
        .filter(attendance::Column::EventId.eq(params.event_id))
        .filter(attendance::Column::Status.eq(AttendanceStatus::CheckedIn))
        .count(&data.db)
        .await
        .unwrap_or(0) as i32;

    let response = event_to_response(event, current_host.0.username, rsvp_count, checked_in_count)
        .map_err(|e| {
            error!("Failed to build response: {}", e);
            ErrorInternalServerError("Failed to build response")
        })?;

    Ok(Json(response))
}

/// Cancel event (HOST only)
#[utoipa::path(
    delete,
    path = "/events/{event_type}/{event_id}",
    request_body = CancelEventRequest,
    params(
        ("event_type" = String, Path, description = "Type of event (physical)"),
        ("event_id" = i32, Path, description = "Event ID")
    ),
    responses(
        (status = 200, description = "Event cancelled successfully", body = CancelEventResponse),
        (status = 401, description = "Unauthorized - Host token required"),
        (status = 404, description = "Event not found"),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Events",
    security(("bearer_auth" = []))
)]
#[delete("/events/{event_type}/{event_id}")]
pub async fn cancel_event_handler(
    data: Data<AppState>,
    path: Path<EventPathParams>,
    _payload: Json<CancelEventRequest>,
    current_host: CurrentHost,
) -> Result<Json<CancelEventResponse>, Error> {
    let params = path.into_inner();

    if params.event_type != "physical" {
        return Err(ErrorBadRequest("Only 'physical' event type is supported"));
    }

    let host = current_host.1;

    // Cancel event
    let event = cancel_event(&data.db, params.event_id, host.user_id)
        .await
        .map_err(|e| {
            error!("Failed to cancel event: {}", e);
            if e.to_string().contains("Unauthorized") {
                ErrorUnauthorized(e.to_string())
            } else {
                ErrorInternalServerError("Failed to cancel event")
            }
        })?;

    info!("Host {} cancelled event {}", host.user_id, event.id);

    Ok(Json(CancelEventResponse {
        event_id: event.id,
        status: event.status,
        message: "Event cancelled successfully".to_string(),
    }))
}

/// List physical events
#[utoipa::path(
    get,
    path = "/events/{event_type}",
    params(
        ("event_type" = String, Path, description = "Type of event (physical)"),
        ("status" = Option<String>, Query, description = "Filter by status (scheduled, ongoing, completed, cancelled)"),
        ("limit" = Option<u64>, Query, description = "Number of events to return"),
        ("offset" = Option<u64>, Query, description = "Number of events to skip"),
    ),
    responses(
        (status = 200, description = "List of events", body = PhysicalEventsListResponse),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Events"
)]
#[get("/events/{event_type}")]
pub async fn list_events(
    data: Data<AppState>,
    path: Path<String>,
    query: Query<ListEventsQuery>,
) -> Result<Json<PhysicalEventsListResponse>, Error> {
    let event_type = path.into_inner();

    if event_type != "physical" {
        return Err(ErrorBadRequest("Only 'physical' event type is supported"));
    }

    // Parse status filter
    let status = query.status.as_ref().and_then(|s| match s.as_str() {
        "scheduled" => Some(EventStatus::Scheduled),
        "ongoing" => Some(EventStatus::Ongoing),
        "completed" => Some(EventStatus::Completed),
        "cancelled" => Some(EventStatus::Cancelled),
        _ => None,
    });

    let (events, total) = list_physical_events(
        &data.db,
        status,
        None,
        query.limit,
        query.offset,
    )
    .await
    .map_err(|e| {
        error!("Failed to list events: {}", e);
        ErrorInternalServerError("Failed to list events")
    })?;

    // Build responses
    use crate::entity::prelude::*;
    use crate::entity::attendance;
    use sea_orm::*;

    let mut event_responses = Vec::new();
    for event in events {
        // Get host info
        let (_, host_user) = get_event_by_id(&data.db, event.id)
            .await
            .map_err(|e| {
                error!("Failed to get host info: {}", e);
                ErrorInternalServerError("Failed to get host info")
            })?;

        // Get counts
        let rsvp_count = Attendance::find()
            .filter(attendance::Column::EventId.eq(event.id))
            .count(&data.db)
            .await
            .unwrap_or(0) as i32;

        let checked_in_count = Attendance::find()
            .filter(attendance::Column::EventId.eq(event.id))
            .filter(attendance::Column::Status.eq(AttendanceStatus::CheckedIn))
            .count(&data.db)
            .await
            .unwrap_or(0) as i32;

        let response = event_to_response(event, host_user.username, rsvp_count, checked_in_count)
            .map_err(|e| {
                error!("Failed to build response: {}", e);
                ErrorInternalServerError("Failed to build response")
            })?;

        event_responses.push(response);
    }

    Ok(Json(PhysicalEventsListResponse {
        events: event_responses,
        total: total as i64,
    }))
}

/// RSVP for an event (ATTENDEE only)
#[utoipa::path(
    post,
    path = "/events/{event_type}/{event_id}/rsvp",
    request_body = RsvpEventRequest,
    params(
        ("event_type" = String, Path, description = "Type of event (physical)"),
        ("event_id" = i32, Path, description = "Event ID")
    ),
    responses(
        (status = 200, description = "RSVP successful", body = RsvpResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized - Attendee token required"),
        (status = 404, description = "Event not found"),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Events",
    security(("bearer_auth" = []))
)]
#[post("/events/{event_type}/{event_id}/rsvp")]
pub async fn rsvp_event_handler(
    data: Data<AppState>,
    path: Path<EventPathParams>,
    _payload: Json<RsvpEventRequest>,
    current_attendee: CurrentAttendee,
) -> Result<Json<RsvpResponse>, Error> {
    let params = path.into_inner();

    if params.event_type != "physical" {
        return Err(ErrorBadRequest("Only 'physical' event type is supported"));
    }

    let attendee = current_attendee.1;

    // RSVP for event
    let attendance = rsvp_event(&data.db, params.event_id, attendee.user_id)
        .await
        .map_err(|e| {
            error!("Failed to RSVP: {}", e);
            if e.to_string().contains("not found") {
                ErrorNotFound(e.to_string())
            } else if e.to_string().contains("Already registered") {
                ErrorBadRequest(e.to_string())
            } else {
                ErrorInternalServerError("Failed to RSVP")
            }
        })?;

    info!("Attendee {} RSVPed for event {}", attendee.user_id, params.event_id);

    Ok(Json(RsvpResponse {
        event_id: attendance.event_id,
        attendee_id: attendance.attendee_id,
        status: attendance.status,
        message: "RSVP successful".to_string(),
    }))
}

/// Mark attendance/check-in for an event (ATTENDEE only)
#[utoipa::path(
    post,
    path = "/events/{event_type}/{event_id}/attendance",
    request_body = MarkAttendanceRequest,
    params(
        ("event_type" = String, Path, description = "Type of event (physical)"),
        ("event_id" = i32, Path, description = "Event ID")
    ),
    responses(
        (status = 200, description = "Attendance marked successfully", body = AttendanceResponse),
        (status = 400, description = "Bad request or outside attendance window"),
        (status = 401, description = "Unauthorized - Attendee token required"),
        (status = 404, description = "Event not found or no RSVP"),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Events",
    security(("bearer_auth" = []))
)]
#[post("/events/{event_type}/{event_id}/attendance")]
pub async fn mark_attendance_handler(
    data: Data<AppState>,
    path: Path<EventPathParams>,
    payload: Json<MarkAttendanceRequest>,
    current_attendee: CurrentAttendee,
) -> Result<Json<AttendanceResponse>, Error> {
    let params = path.into_inner();

    if params.event_type != "physical" {
        return Err(ErrorBadRequest("Only 'physical' event type is supported"));
    }

    // Validate request
    payload.validate().map_err(|e| {
        error!("Validation error: {}", e);
        ErrorBadRequest(format!("Validation error: {}", e))
    })?;

    let req = payload.into_inner();
    let attendee = current_attendee.1;

    // Validate location data if verification requested
    if req.verify_location && (req.latitude.is_none() || req.longitude.is_none()) {
        return Err(ErrorBadRequest(
            "Latitude and longitude required when verify_location is true",
        ));
    }

    // Mark attendance
    let (attendance, location_verified, is_late) = mark_attendance(
        &data.db,
        params.event_id,
        attendee.user_id,
        req.verify_location,
        req.latitude,
        req.longitude,
    )
    .await
    .map_err(|e| {
        error!("Failed to mark attendance: {}", e);
        let err_msg = e.to_string();
        if err_msg.contains("not found") || err_msg.contains("No RSVP") {
            ErrorNotFound(err_msg)
        } else if err_msg.contains("Already checked in")
            || err_msg.contains("has not started")
            || err_msg.contains("window has closed")
            || err_msg.contains("too far")
        {
            ErrorBadRequest(err_msg)
        } else {
            ErrorInternalServerError("Failed to mark attendance")
        }
    })?;

    info!(
        "Attendee {} checked in for event {} (late: {}, location_verified: {})",
        attendee.user_id, params.event_id, is_late, location_verified
    );

    let message = if is_late {
        "Checked in successfully (late)"
    } else {
        "Checked in successfully"
    };

    Ok(Json(AttendanceResponse {
        id: attendance.id,
        event_id: attendance.event_id,
        attendee_id: attendance.attendee_id,
        status: attendance.status,
        checked_in_at: Some(attendance.updated_at),
        location_verified,
        is_late,
        message: message.to_string(),
    }))
}

/// Get event attendance summary (HOST only)
#[utoipa::path(
    get,
    path = "/events/{event_type}/{event_id}/attendance",
    params(
        ("event_type" = String, Path, description = "Type of event (physical)"),
        ("event_id" = i32, Path, description = "Event ID")
    ),
    responses(
        (status = 200, description = "Attendance summary retrieved", body = EventAttendanceSummary),
        (status = 401, description = "Unauthorized - Host token required"),
        (status = 404, description = "Event not found"),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Events",
    security(("bearer_auth" = []))
)]
#[get("/events/{event_type}/{event_id}/attendance")]
pub async fn get_attendance_summary(
    data: Data<AppState>,
    path: Path<EventPathParams>,
    current_host: CurrentHost,
) -> Result<Json<EventAttendanceSummary>, Error> {
    let params = path.into_inner();

    if params.event_type != "physical" {
        return Err(ErrorBadRequest("Only 'physical' event type is supported"));
    }

    let host = current_host.1;

    let summary = get_event_attendance_summary(&data.db, params.event_id, host.user_id)
        .await
        .map_err(|e| {
            error!("Failed to get attendance summary: {}", e);
            if e.to_string().contains("Unauthorized") {
                ErrorUnauthorized(e.to_string())
            } else if e.to_string().contains("not found") {
                ErrorNotFound(e.to_string())
            } else {
                ErrorInternalServerError("Failed to get attendance summary")
            }
        })?;

    Ok(Json(summary))
}
