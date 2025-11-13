use chrono::Utc;
use sea_orm::*;
use std::error::Error;

use crate::entity::prelude::*;
use crate::entity::{
    attendance, attendee, event, host, user, AttendanceStatus, EventStatus, EventType,
};
use crate::schemas::event::{
    AttendanceProfile, EventAttendeeDetails, EventAttendanceSummary, PhysicalEventResponse,
};

/// Helper to calculate distance between two coordinates using Haversine formula
/// Returns distance in meters
pub fn calculate_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    const EARTH_RADIUS_KM: f64 = 6371.0;

    let lat1_rad = lat1.to_radians();
    let lat2_rad = lat2.to_radians();
    let delta_lat = (lat2 - lat1).to_radians();
    let delta_lon = (lon2 - lon1).to_radians();

    let a = (delta_lat / 2.0).sin().powi(2)
        + lat1_rad.cos() * lat2_rad.cos() * (delta_lon / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());

    EARTH_RADIUS_KM * c * 1000.0 // Convert to meters
}

/// Create a new physical event
pub async fn create_physical_event(
    db: &DatabaseConnection,
    host_id: i32,
    name: String,
    description: Option<String>,
    category: crate::entity::EventCategory,
    visibility: crate::entity::EventVisibility,
    start_time: chrono::DateTime<Utc>,
    end_time: chrono::DateTime<Utc>,
    latitude: f64,
    longitude: f64,
    geofence_radius: Option<f64>,
    attendance_profile: AttendanceProfile,
) -> Result<event::Model, Box<dyn Error>> {
    // Create location string from coordinates
    let location = format!("{},{}", latitude, longitude);

    // Store geofence and attendance settings in description metadata
    // In production, you'd want separate fields in the database
    let metadata = serde_json::json!({
        "latitude": latitude,
        "longitude": longitude,
        "geofence_radius": geofence_radius,
        "attendance_profile": attendance_profile,
        "attendance_window_minutes": attendance_profile.duration_minutes(),
    });

    let description_with_metadata = description
        .map(|d| format!("{}\n__METADATA__:{}", d, metadata.to_string()))
        .unwrap_or_else(|| format!("__METADATA__:{}", metadata.to_string()));

    let new_event = event::ActiveModel {
        title: Set(name),
        description: Set(description_with_metadata),
        location: Set(location),
        event_type: Set(EventType::Physical),
        category: Set(category),
        status: Set(EventStatus::Scheduled),
        visibility: Set(visibility),
        host_id: Set(host_id),
        start_time: Set(start_time),
        end_time: Set(end_time),
        created_at: Set(Utc::now()),
        updated_at: Set(Utc::now()),
        ..Default::default()
    };

    let event = new_event.insert(db).await?;
    Ok(event)
}

/// Get event by ID with host information
pub async fn get_event_by_id(
    db: &DatabaseConnection,
    event_id: i32,
) -> Result<(event::Model, user::Model), Box<dyn Error>> {
    let event = Event::find_by_id(event_id)
        .one(db)
        .await?
        .ok_or("Event not found")?;

    // Get host information
    let host_record = Host::find()
        .filter(host::Column::UserId.eq(event.host_id))
        .one(db)
        .await?
        .ok_or("Host not found")?;

    let host_user = User::find_by_id(host_record.user_id)
        .one(db)
        .await?
        .ok_or("Host user not found")?;

    Ok((event, host_user))
}

/// Update an existing event
pub async fn update_event(
    db: &DatabaseConnection,
    event_id: i32,
    host_id: i32,
    name: Option<String>,
    description: Option<String>,
    category: Option<crate::entity::EventCategory>,
    visibility: Option<crate::entity::EventVisibility>,
    start_time: Option<chrono::DateTime<Utc>>,
    end_time: Option<chrono::DateTime<Utc>>,
    latitude: Option<f64>,
    longitude: Option<f64>,
    geofence_radius: Option<f64>,
    attendance_profile: Option<AttendanceProfile>,
) -> Result<event::Model, Box<dyn Error>> {
    // Verify event exists and belongs to host
    let existing_event = Event::find_by_id(event_id)
        .one(db)
        .await?
        .ok_or("Event not found")?;

    if existing_event.host_id != host_id {
        return Err("Unauthorized: You are not the host of this event".into());
    }

    // Parse existing metadata
    let mut metadata: serde_json::Value = if let Some(meta_str) = existing_event
        .description
        .split("__METADATA__:")
        .nth(1)
    {
        serde_json::from_str(meta_str).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // Update metadata fields
    if let Some(lat) = latitude {
        metadata["latitude"] = serde_json::json!(lat);
    }
    if let Some(lon) = longitude {
        metadata["longitude"] = serde_json::json!(lon);
    }
    if let Some(radius) = geofence_radius {
        metadata["geofence_radius"] = serde_json::json!(radius);
    }
    if let Some(profile) = attendance_profile {
        metadata["attendance_profile"] = serde_json::json!(profile);
        metadata["attendance_window_minutes"] = serde_json::json!(profile.duration_minutes());
    }

    // Update location if coordinates changed
    let new_location = if latitude.is_some() || longitude.is_some() {
        let lat = latitude.unwrap_or(metadata["latitude"].as_f64().unwrap_or(0.0));
        let lon = longitude.unwrap_or(metadata["longitude"].as_f64().unwrap_or(0.0));
        Some(format!("{},{}", lat, lon))
    } else {
        None
    };

    // Update description with metadata
    let new_description = if description.is_some() || latitude.is_some() || longitude.is_some() || geofence_radius.is_some() || attendance_profile.is_some() {
        let desc = description.unwrap_or_else(|| {
            existing_event
                .description
                .split("__METADATA__:")
                .next()
                .unwrap_or("")
                .to_string()
        });
        Some(format!("{}\n__METADATA__:{}", desc, metadata.to_string()))
    } else {
        None
    };

    let mut event: event::ActiveModel = existing_event.into();

    if let Some(n) = name {
        event.title = Set(n);
    }
    if let Some(d) = new_description {
        event.description = Set(d);
    }
    if let Some(c) = category {
        event.category = Set(c);
    }
    if let Some(v) = visibility {
        event.visibility = Set(v);
    }
    if let Some(st) = start_time {
        event.start_time = Set(st);
    }
    if let Some(et) = end_time {
        event.end_time = Set(et);
    }
    if let Some(loc) = new_location {
        event.location = Set(loc);
    }
    event.updated_at = Set(Utc::now());

    let updated_event = event.update(db).await?;
    Ok(updated_event)
}

/// Cancel an event
pub async fn cancel_event(
    db: &DatabaseConnection,
    event_id: i32,
    host_id: i32,
) -> Result<event::Model, Box<dyn Error>> {
    let existing_event = Event::find_by_id(event_id)
        .one(db)
        .await?
        .ok_or("Event not found")?;

    if existing_event.host_id != host_id {
        return Err("Unauthorized: You are not the host of this event".into());
    }

    if existing_event.status == EventStatus::Cancelled {
        return Err("Event is already cancelled".into());
    }

    let mut event: event::ActiveModel = existing_event.into();
    event.status = Set(EventStatus::Cancelled);
    event.updated_at = Set(Utc::now());

    let cancelled_event = event.update(db).await?;
    Ok(cancelled_event)
}

/// RSVP for an event
pub async fn rsvp_event(
    db: &DatabaseConnection,
    event_id: i32,
    attendee_id: i32,
) -> Result<attendance::Model, Box<dyn Error>> {
    // Verify event exists
    let event = Event::find_by_id(event_id)
        .one(db)
        .await?
        .ok_or("Event not found")?;

    if event.status == EventStatus::Cancelled {
        return Err("Cannot RSVP to a cancelled event".into());
    }

    if event.status == EventStatus::Completed {
        return Err("Cannot RSVP to a completed event".into());
    }

    // Check if already registered
    if let Some(_existing) = Attendance::find()
        .filter(attendance::Column::EventId.eq(event_id))
        .filter(attendance::Column::AttendeeId.eq(attendee_id))
        .one(db)
        .await?
    {
        return Err("Already registered for this event".into());
    }

    // Create attendance record with Registered status
    let new_attendance = attendance::ActiveModel {
        event_id: Set(event_id),
        attendee_id: Set(attendee_id),
        status: Set(AttendanceStatus::Registered),
        created_at: Set(Utc::now()),
        updated_at: Set(Utc::now()),
        ..Default::default()
    };

    let attendance_record = new_attendance.insert(db).await?;
    Ok(attendance_record)
}

/// Mark attendance (check-in)
pub async fn mark_attendance(
    db: &DatabaseConnection,
    event_id: i32,
    attendee_id: i32,
    verify_location: bool,
    user_latitude: Option<f64>,
    user_longitude: Option<f64>,
) -> Result<(attendance::Model, bool, bool), Box<dyn Error>> {
    // Get event
    let event = Event::find_by_id(event_id)
        .one(db)
        .await?
        .ok_or("Event not found")?;

    // Parse event metadata
    let metadata: serde_json::Value = if let Some(meta_str) =
        event.description.split("__METADATA__:").nth(1)
    {
        serde_json::from_str(meta_str).unwrap_or(serde_json::json!({}))
    } else {
        return Err("Event metadata not found".into());
    };

    // Get attendance record
    let attendance_record = Attendance::find()
        .filter(attendance::Column::EventId.eq(event_id))
        .filter(attendance::Column::AttendeeId.eq(attendee_id))
        .one(db)
        .await?
        .ok_or("No RSVP found. Please RSVP first.")?;

    if attendance_record.status == AttendanceStatus::CheckedIn {
        return Err("Already checked in for this event".into());
    }

    // Verify timing
    let now = Utc::now();
    if now < event.start_time {
        return Err("Event has not started yet".into());
    }

    // Check attendance window
    let attendance_window_minutes = metadata["attendance_window_minutes"].as_i64();
    let mut is_late = false;

    if let Some(window_minutes) = attendance_window_minutes {
        let window_end = event.start_time + chrono::Duration::minutes(window_minutes);
        if now > window_end {
            if event.status != EventStatus::Completed {
                // After window but event not closed - flag as late
                is_late = true;
            } else {
                return Err("Attendance window has closed".into());
            }
        }
    } else {
        // Unlimited - check if event ended
        if now > event.end_time && event.status == EventStatus::Completed {
            return Err("Event has ended and been closed".into());
        } else if now > event.end_time {
            is_late = true;
        }
    }

    // Verify location if required
    let mut location_verified = false;
    if verify_location {
        let user_lat = user_latitude.ok_or("Latitude required for location verification")?;
        let user_lon = user_longitude.ok_or("Longitude required for location verification")?;

        let event_lat = metadata["latitude"]
            .as_f64()
            .ok_or("Event latitude not found")?;
        let event_lon = metadata["longitude"]
            .as_f64()
            .ok_or("Event longitude not found")?;
        let geofence_radius = metadata["geofence_radius"].as_f64().unwrap_or(100.0);

        let distance = calculate_distance(user_lat, user_lon, event_lat, event_lon);

        if distance > geofence_radius {
            return Err(format!(
                "You are too far from the event location ({:.0}m away, max: {:.0}m)",
                distance, geofence_radius
            )
            .into());
        }

        location_verified = true;
    }

    // Update attendance status
    let mut attendance: attendance::ActiveModel = attendance_record.into();
    attendance.status = Set(AttendanceStatus::CheckedIn);
    attendance.updated_at = Set(now);

    let updated_attendance = attendance.update(db).await?;
    Ok((updated_attendance, location_verified, is_late))
}

/// Get event attendance summary for host
pub async fn get_event_attendance_summary(
    db: &DatabaseConnection,
    event_id: i32,
    host_id: i32,
) -> Result<EventAttendanceSummary, Box<dyn Error>> {
    // Verify event belongs to host
    let event = Event::find_by_id(event_id)
        .one(db)
        .await?
        .ok_or("Event not found")?;

    if event.host_id != host_id {
        return Err("Unauthorized: You are not the host of this event".into());
    }

    // Get metadata for attendance window
    let metadata: serde_json::Value = if let Some(meta_str) =
        event.description.split("__METADATA__:").nth(1)
    {
        serde_json::from_str(meta_str).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    let attendance_window_minutes = metadata["attendance_window_minutes"].as_i64();

    // Get all attendance records with attendee and user info
    let attendance_records = Attendance::find()
        .filter(attendance::Column::EventId.eq(event_id))
        .find_also_related(Attendee)
        .all(db)
        .await?;

    let mut attendees = Vec::new();
    let mut total_rsvp = 0;
    let mut total_checked_in = 0;
    let mut total_no_show = 0;
    let mut total_late = 0;

    for (attendance_rec, attendee_opt) in attendance_records {
        total_rsvp += 1;

        match attendance_rec.status {
            AttendanceStatus::CheckedIn => total_checked_in += 1,
            AttendanceStatus::NoShow => total_no_show += 1,
            _ => {}
        }

        if let Some(attendee_rec) = attendee_opt {
            // Get user info
            let user_info = User::find_by_id(attendee_rec.user_id).one(db).await?;

            if let Some(user) = user_info {
                // Check if late
                let mut is_late = false;
                if attendance_rec.status == AttendanceStatus::CheckedIn {
                    if let Some(window_minutes) = attendance_window_minutes {
                        let window_end =
                            event.start_time + chrono::Duration::minutes(window_minutes);
                        if attendance_rec.updated_at > window_end {
                            is_late = true;
                            total_late += 1;
                        }
                    }
                }

                attendees.push(EventAttendeeDetails {
                    attendee_id: attendee_rec.id,
                    username: user.username,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    status: attendance_rec.status,
                    rsvp_time: attendance_rec.created_at,
                    check_in_time: if attendance_rec.status == AttendanceStatus::CheckedIn {
                        Some(attendance_rec.updated_at)
                    } else {
                        None
                    },
                    is_late,
                });
            }
        }
    }

    Ok(EventAttendanceSummary {
        event_id,
        total_rsvp,
        total_checked_in,
        total_no_show,
        total_late,
        attendees,
    })
}

/// List physical events (with optional filters)
pub async fn list_physical_events(
    db: &DatabaseConnection,
    status: Option<EventStatus>,
    host_id: Option<i32>,
    limit: Option<u64>,
    offset: Option<u64>,
) -> Result<(Vec<event::Model>, u64), Box<dyn Error>> {
    let mut query = Event::find().filter(event::Column::EventType.eq(EventType::Physical));

    if let Some(s) = status {
        query = query.filter(event::Column::Status.eq(s));
    }

    if let Some(h) = host_id {
        query = query.filter(event::Column::HostId.eq(h));
    }

    // Get total count
    let total = query.clone().count(db).await?;

    // Apply pagination
    if let Some(l) = limit {
        query = query.limit(l);
    }
    if let Some(o) = offset {
        query = query.offset(o);
    }

    let events = query.all(db).await?;
    Ok((events, total))
}

/// Convert event model to response with metadata
pub fn event_to_response(
    event: event::Model,
    host_name: String,
    rsvp_count: i32,
    checked_in_count: i32,
) -> Result<PhysicalEventResponse, Box<dyn Error>> {
    // Parse metadata
    let metadata: serde_json::Value = if let Some(meta_str) =
        event.description.split("__METADATA__:").nth(1)
    {
        serde_json::from_str(meta_str).unwrap_or(serde_json::json!({}))
    } else {
        return Err("Event metadata not found".into());
    };

    let description = event
        .description
        .split("__METADATA__:")
        .next()
        .unwrap_or("")
        .to_string();

    let description_cleaned = if description.is_empty() {
        None
    } else {
        Some(description)
    };

    // Extract attendance profile
    let attendance_profile: AttendanceProfile = serde_json::from_value(
        metadata["attendance_profile"].clone(),
    )
    .unwrap_or(AttendanceProfile::Standard);

    Ok(PhysicalEventResponse {
        id: event.id,
        name: event.title,
        description: description_cleaned,
        category: event.category,
        status: event.status,
        visibility: event.visibility,
        host_id: event.host_id,
        host_name,
        start_time: event.start_time,
        end_time: event.end_time,
        latitude: metadata["latitude"].as_f64().unwrap_or(0.0),
        longitude: metadata["longitude"].as_f64().unwrap_or(0.0),
        geofence_radius: metadata["geofence_radius"].as_f64(),
        attendance_profile,
        attendance_window_minutes: metadata["attendance_window_minutes"].as_i64().map(|v| v as i32),
        rsvp_count,
        checked_in_count,
        created_at: event.created_at,
        updated_at: event.updated_at,
    })
}
