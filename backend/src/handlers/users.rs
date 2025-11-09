use crate::core::configs::AppState;
use crate::schemas::auth::{UserMeResponse, AttendeeData};
use crate::schemas::user::{SignShow, SignUp, UpdateProfileRequest, UpdateProfileResponse};
use crate::services::users::{create_user, update_user_profile};
use crate::utils::auth_extractor::{CurrentUser, CurrentAttendee};
use crate::entity::{event_categories, motivation, skills};
use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, ModelTrait};
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
    ),
    tag = "Users"
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
    ),
    tag = "Users"
)]
#[get("/me")]
pub async fn get_me(
    current_attendee: CurrentAttendee,
    data: Data<AppState>,
) -> Result<Json<UserMeResponse>, Error> {
    let user = current_attendee.0;
    let attendee = current_attendee.1;
    let db = &data.db;

    // Fetch preferred event categories using the relation
    let preferred_categories = attendee
        .find_related(event_categories::Entity)
        .all(db)
        .await
        .map_err(|e| {
            error!("Failed to fetch preferred categories: {}", e);
            error::ErrorInternalServerError("Failed to fetch preferred categories")
        })?
        .into_iter()
        .map(|cat| cat.name)
        .collect();

    // Fetch motivations using the relation
    let motivations = attendee
        .find_related(motivation::Entity)
        .all(db)
        .await
        .map_err(|e| {
            error!("Failed to fetch motivations: {}", e);
            error::ErrorInternalServerError("Failed to fetch motivations")
        })?
        .into_iter()
        .map(|mot| mot.motivation)
        .collect();

    // Fetch user skills
    let user_skills = skills::Entity::find()
        .filter(skills::Column::UserId.eq(user.id))
        .all(db)
        .await
        .map_err(|e| {
            error!("Failed to fetch skills: {}", e);
            error::ErrorInternalServerError("Failed to fetch skills")
        })?
        .into_iter()
        .map(|skill| skill.name)
        .collect();

    Ok(Json(UserMeResponse {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        skills: user_skills,
        attendee: AttendeeData {
            preferred_event_type: attendee.preferred_event_type,
            preferred_categories,
            motivations,
        },
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
    ),
    tag = "Users"
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
