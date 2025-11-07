use actix_web::{
    Error, Result, error, get, post,
    web::{Data, Json},
};
use tracing::error;
use validator::Validate;

use crate::core::configs::AppState;
use crate::schemas::auth::{LoginRequest, LoginResponse, UserMeResponse};
use crate::services::users::authenticate_user;
use crate::utils::auth_extractor::CurrentUser;
use crate::utils::utils::generate_jwt;

#[utoipa::path(
    post,
    path = "/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = LoginResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error"),
    )
)]
#[post("/login")]
pub async fn login(
    data: Data<AppState>,
    payload: Json<LoginRequest>,
) -> Result<Json<LoginResponse>, Error> {
    // Validate request
    payload.validate().map_err(|e| {
        error!("Validation error: {}", e);
        error::ErrorBadRequest(format!("Validation error: {}", e))
    })?;

    let login_data = payload.into_inner();

    // Authenticate user
    let user = authenticate_user(&data.db, &login_data.identifier, &login_data.password)
        .await
        .map_err(|e| {
            error!("Authentication error: {}", e);
            error::ErrorUnauthorized("Invalid credentials")
        })?;

    // Generate JWT token
    let token = generate_jwt(user.id, &data.config.secret_key).map_err(|e| {
        error!("JWT generation error: {}", e);
        error::ErrorInternalServerError("Failed to generate token")
    })?;

    Ok(Json(LoginResponse {
        id: user.id,
        username: user.username,
        email: user.email,
        access_token: token,
    }))
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
