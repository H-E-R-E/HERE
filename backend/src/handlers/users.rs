use crate::core::configs::AppState;
use crate::schemas::auth::UserMeResponse;
use crate::schemas::user::{SignShow, SignUp, UpdateProfileRequest, UpdateProfileResponse};
use crate::services::users::{create_user, update_user_profile};
use crate::utils::auth_extractor::CurrentUser;
use actix_web::{
    Error, Responder, Result, error, get, post, put,
    web::{Data, Json},
};
use tracing::error;
use validator::Validate;

#[utoipa::path(
    post,
    path = "/users/signup",
    request_body = SignUp,
    responses(
        (status = 200, description = "User signed up successfully", body = SignShow),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error"),
    )
)]
#[post("/signup")]
pub async fn signup(data: Data<AppState>, payload: Json<SignUp>) -> Result<Json<SignShow>, Error> {
    // 1. Handle Validation Error (Client Error)
    payload.validate().map_err(|e| {
        error!("Validation error: {}", e);
        // This is okay, but a structured JSON error is even better.
        // We'll keep it for simplicity.
        error::ErrorUnprocessableEntity(format!("Validation error: {}", e))
    })?;

    let signup_data: SignUp = payload.into_inner();

    // 2. Handle Service/Database Error (Server Error)
    let user: SignShow = create_user(&data.db, &data.redis_pool, &data.config, signup_data).await.map_err(|e| {
        error!("Database error during user creation: {}", e);

        // Send a generic, safe error to the client
        error::ErrorInternalServerError("An error occurred while creating the account.")
    })?;
    Ok(Json(user))
}


#[utoipa::path(
    get,
    path = "/users/me",
    responses(
        (status = 200, description = "User information retrieved", body = UserMeResponse),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error"),
    ),
    security(
        ("bearer_auth" = [])
    )
)]
#[get("/me")]
pub async fn get_me(current_user: CurrentUser) -> Result<Json<UserMeResponse>, Error> {
    let user = current_user.0;

    Ok(Json(UserMeResponse {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
    }))
}

#[utoipa::path(
    put,
    path = "/users/profile",
    request_body = UpdateProfileRequest,
    responses(
        (status = 200, description = "Profile updated successfully", body = UpdateProfileResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error"),
    ),
    security(
        ("bearer_auth" = [])
    )
)]
#[put("/profile")]
pub async fn update_profile(
    data: Data<AppState>,
    current_user: CurrentUser,
    payload: Json<UpdateProfileRequest>,
) -> Result<Json<UpdateProfileResponse>, Error> {
    // Validate request
    payload.validate().map_err(|e| {
        error!("Validation error: {}", e);
        error::ErrorUnprocessableEntity(format!("Validation error: {}", e))
    })?;

    let user_id = current_user.0.id;
    let update_data = payload.into_inner();

    // Update profile
    update_user_profile(&data.db, user_id, update_data)
        .await
        .map_err(|e| {
            error!("Error updating profile for user {}: {}", user_id, e);
            error::ErrorInternalServerError("Failed to update profile")
        })?;

    Ok(Json(UpdateProfileResponse {
        message: "Profile updated successfully".to_string(),
    }))
}


#[utoipa::path(
    get,
    path = "/users/health",
    responses(
        (status = 200, description = "Health check OK"),
    )
)]
#[get("/health")]
pub async fn health_check() -> impl Responder {
    "OK"
}
