use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

#[derive(Debug, Serialize, Validate, Deserialize, ToSchema)]
pub struct SendChatMessageRequest {
    #[validate(length(min = 1))]
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ChatMessageResponse {
    pub id: i32,
    pub event_id: i32,
    pub user_id: i32,
    pub username: String, // from user table
    pub content: String,
    pub created_at: String, // ISO formatted string
}
