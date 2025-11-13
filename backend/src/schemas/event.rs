use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

use crate::entity::{AttendanceStatus, EventCategory, EventStatus, EventType, EventVisibility};

/// Attendance profile presets for event check-in windows
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
pub enum AttendanceProfile {
    /// 15 minutes after event start
    #[serde(rename = "quick")]
    Quick,
    /// 30 minutes after event start
    #[serde(rename = "standard")]
    Standard,
    /// 1 hour after event start
    #[serde(rename = "extended")]
    Extended,
    /// Unlimited (throughout event duration)
    #[serde(rename = "unlimited")]
    Unlimited,
}

impl AttendanceProfile {
    /// Get the duration in minutes for this profile
    pub fn duration_minutes(&self) -> Option<i32> {
        match self {
            AttendanceProfile::Quick => Some(15),
            AttendanceProfile::Standard => Some(30),
            AttendanceProfile::Extended => Some(60),
            AttendanceProfile::Unlimited => None,
        }
    }
}

/// Request to create a physical event
#[derive(Debug, Serialize, Deserialize, Validate, ToSchema)]
pub struct CreatePhysicalEventRequest {
    #[validate(length(min = 3, max = 200))]
    pub name: String,
    
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    
    pub category: EventCategory,
    
    pub visibility: EventVisibility,
    
    /// Event start date and time
    pub start_time: DateTime<Utc>,
    
    /// Event end date and time
    pub end_time: DateTime<Utc>,
    
    /// Latitude coordinate
    #[validate(range(min = -90.0, max = 90.0))]
    pub latitude: f64,
    
    /// Longitude coordinate
    #[validate(range(min = -180.0, max = 180.0))]
    pub longitude: f64,
    
    /// Geofence radius in meters for attendance verification
    #[validate(range(min = 10.0, max = 10000.0))]
    pub geofence_radius: Option<f64>,
    
    /// Attendance check-in window profile
    pub attendance_profile: AttendanceProfile,
}

/// Request to update an existing physical event
#[derive(Debug, Serialize, Deserialize, Validate, ToSchema)]
pub struct UpdatePhysicalEventRequest {
    #[validate(length(min = 3, max = 200))]
    pub name: Option<String>,
    
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    
    pub category: Option<EventCategory>,
    
    pub visibility: Option<EventVisibility>,
    
    pub start_time: Option<DateTime<Utc>>,
    
    pub end_time: Option<DateTime<Utc>>,
    
    #[validate(range(min = -90.0, max = 90.0))]
    pub latitude: Option<f64>,
    
    #[validate(range(min = -180.0, max = 180.0))]
    pub longitude: Option<f64>,
    
    #[validate(range(min = 10.0, max = 10000.0))]
    pub geofence_radius: Option<f64>,
    
    pub attendance_profile: Option<AttendanceProfile>,
}

/// Request to RSVP for an event
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct RsvpEventRequest {
    /// Optional note for the host
    pub note: Option<String>,
}

/// Request to mark attendance
#[derive(Debug, Serialize, Deserialize, Validate, ToSchema)]
pub struct MarkAttendanceRequest {
    /// Whether to verify location against geofence
    pub verify_location: bool,
    
    /// Current latitude (required if verify_location is true)
    #[validate(range(min = -90.0, max = 90.0))]
    pub latitude: Option<f64>,
    
    /// Current longitude (required if verify_location is true)
    #[validate(range(min = -180.0, max = 180.0))]
    pub longitude: Option<f64>,
}

/// Physical event response with full details
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct PhysicalEventResponse {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub category: EventCategory,
    pub status: EventStatus,
    pub visibility: EventVisibility,
    pub host_id: i32,
    pub host_name: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub latitude: f64,
    pub longitude: f64,
    pub geofence_radius: Option<f64>,
    pub attendance_profile: AttendanceProfile,
    pub attendance_window_minutes: Option<i32>,
    pub rsvp_count: i32,
    pub checked_in_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// List of physical events
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct PhysicalEventsListResponse {
    pub events: Vec<PhysicalEventResponse>,
    pub total: i64,
}

/// RSVP response
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct RsvpResponse {
    pub event_id: i32,
    pub attendee_id: i32,
    pub status: AttendanceStatus,
    pub message: String,
}

/// Attendance response
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct AttendanceResponse {
    pub id: i32,
    pub event_id: i32,
    pub attendee_id: i32,
    pub status: AttendanceStatus,
    pub checked_in_at: Option<DateTime<Utc>>,
    pub location_verified: bool,
    pub is_late: bool,
    pub message: String,
}

/// Event attendee details
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct EventAttendeeDetails {
    pub attendee_id: i32,
    pub username: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub status: AttendanceStatus,
    pub rsvp_time: DateTime<Utc>,
    pub check_in_time: Option<DateTime<Utc>>,
    pub is_late: bool,
}

/// Event attendance summary for hosts
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct EventAttendanceSummary {
    pub event_id: i32,
    pub total_rsvp: i32,
    pub total_checked_in: i32,
    pub total_no_show: i32,
    pub total_late: i32,
    pub attendees: Vec<EventAttendeeDetails>,
}

/// Switch user scope request
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct SwitchUserScopeRequest {
    /// Optional: specify target scope. If not provided, will switch to opposite
    pub target_scope: Option<String>,
}

/// Switch user scope response
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct SwitchUserScopeResponse {
    pub new_access_token: String,
    pub new_scope: String,
    pub message: String,
}

/// Cancel event request
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CancelEventRequest {
    pub reason: Option<String>,
}

/// Cancel event response
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CancelEventResponse {
    pub event_id: i32,
    pub status: EventStatus,
    pub message: String,
}
