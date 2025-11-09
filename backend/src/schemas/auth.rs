use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;
use crate::entity::{EventType, EventCategory, Motivation, Skill};

#[derive(Debug, Serialize, Validate, Deserialize, ToSchema)]
pub struct LoginRequest {
    #[validate(length(min = 1))]
    pub identifier: String, // Can be username or email
    #[validate(length(min = 8))]
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct LoginResponse {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub access_token: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct AttendeeData {
    pub preferred_event_type: EventType,
    pub preferred_categories: Vec<EventCategory>,
    pub motivations: Vec<Motivation>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UserMeResponse {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub avatar_url: Option<String>,
    pub skills: Vec<Skill>,
    pub attendee: AttendeeData,
}

#[derive(Debug, Serialize, Validate, Deserialize, ToSchema)]
pub struct VerifyOtpRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 6, max = 6))]
    pub otp: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct VerifyOtpResponse {
    pub verification_token: String,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct VerifyAccountResponse {
    pub message: String,
    pub user_id: i32,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct LogoutResponse {
    pub message: String,
}

#[derive(Debug, Serialize, Validate, Deserialize, ToSchema)]
pub struct ResendOtpRequest {
    #[validate(email)]
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ResendOtpResponse {
    pub message: String,
}
