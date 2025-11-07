use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

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
pub struct UserMeResponse {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub avatar_url: Option<String>,
}
