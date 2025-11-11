use crate::entity::{EventType, SignupType};
use serde::{self, Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

#[derive(Debug, Serialize, Validate, Deserialize, ToSchema)]
pub struct SignUp {
    pub username: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    #[validate(email)]
    pub email: String,
    #[validate(url)]
    pub avatar_url: Option<String>,
    //implement custom validator to hash password here
    #[validate(length(min = 8))]
    pub password: String,
    #[serde(default)]
    pub signup_type: SignupType,
}

#[derive(Debug, Serialize, Validate, Deserialize, ToSchema)]
pub struct SignShow {
    pub id: i32,
    pub username: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    #[validate(email)]
    pub email: String,
    #[validate(url)]
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize, Validate, Deserialize, ToSchema)]
pub struct UpdateProfileRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    #[validate(url)]
    pub avatar_url: Option<String>,
    pub preferred_event_type: Option<EventType>,
    pub organization_name: Option<String>,
    #[validate(url)]
    pub organization_website: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UpdateProfileResponse {
    pub message: String,
}
