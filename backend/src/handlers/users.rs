use crate::core::configs::AppState;
use crate::schemas::user::{SignShow, SignUp};
use crate::services::users::create_user;
use actix_web::{
    Error, Responder, Result, error, get, post,
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
    let user: SignShow = create_user(&data.db, signup_data).await.map_err(|e| {
        error!("Database error during user creation: {}", e);

        // Send a generic, safe error to the client
        error::ErrorInternalServerError("An error occurred while creating the account.")
    })?;
    Ok(Json(user))
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
