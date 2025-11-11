use actix_web::{
    Error, Result, error, post,
    web::{Data, Json},
};
use actix_web_httpauth::extractors::bearer::BearerAuth;
use tracing::{error, info};
use validator::Validate;

use crate::core::configs::AppState;
use crate::schemas::auth::{
    ActivateAccountResponse, LoginRequest, LoginResponse, LogoutResponse,
    ResendOtpRequest, ResendOtpResponse, VerifyAccountResponse, VerifyOtpRequest,
    VerifyOtpResponse,
};
use crate::services::users::get_user_by_email;
use crate::services::users::{authenticate_user, activate_account};
use crate::entity::TokenScope;
use crate::utils::auth_extractor::{CurrentUser, OtpToken};
use crate::utils::email::{
    blacklist_token, generate_otp, send_otp_email, store_otp_in_redis, verify_otp_from_redis,
};
use crate::utils::utils::{generate_jwt, generate_scoped_jwt};

#[utoipa::path(
    post,
    path = "/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = LoginResponse),
        (status = 400, description = "Bad request"),
        (status = 401, description = "Unauthorized - Invalid credentials or account disabled"),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Authentication"
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
    post,
    path = "/auth/verify-otp",
    request_body = VerifyOtpRequest,
    responses(
        (status = 200, description = "OTP verified successfully", body = VerifyOtpResponse),
        (status = 400, description = "Bad request or invalid OTP"),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Authentication"
)]
#[post("/verify-otp")]
pub async fn verify_otp(
    data: Data<AppState>,
    payload: Json<VerifyOtpRequest>,
) -> Result<Json<VerifyOtpResponse>, Error> {
    // Validate request
    payload.validate().map_err(|e| {
        error!("Validation error: {}", e);
        error::ErrorBadRequest(format!("Validation error: {}", e))
    })?;

    let verify_data = payload.into_inner();

    // Verify OTP from Redis
    let is_valid = verify_otp_from_redis(
        &data.redis_pool,
        &data.config.otp_prefix,
        &verify_data.email,
        &verify_data.otp,
    )
    .await
    .map_err(|e| {
        error!("Redis error during OTP verification: {}", e);
        error::ErrorInternalServerError("Failed to verify OTP")
    })?;

    if !is_valid {
        error!("Invalid or expired OTP for email: {}", verify_data.email);
        return Err(error::ErrorBadRequest("Invalid or expired OTP"));
    }

    info!("OTP verified successfully for email: {}", verify_data.email);

    // Get user by email to generate token with their ID
    let user = get_user_by_email(&data.db, &verify_data.email)
        .await
        .map_err(|e| {
            error!("User lookup error: {}", e);
            error::ErrorInternalServerError("Failed to retrieve user information")
        })?;

    // Generate a scoped OTP token with limited lifespan (10 minutes)
    let otp_token = generate_scoped_jwt(
        user.id,
        &data.config.secret_key,
        TokenScope::Otp.as_str(),
        data.config.verification_token_expiry_seconds,
    )
    .map_err(|e| {
        error!("JWT generation error: {}", e);
        error::ErrorInternalServerError("Failed to generate OTP token")
    })?;

    Ok(Json(VerifyOtpResponse {
        verification_token: otp_token,
        message: "OTP verified successfully. Use this token to verify your account or activate it."
            .to_string(),
    }))
}

#[utoipa::path(
    post,
    path = "/auth/verify-account",
    responses(
        (status = 200, description = "Account verified successfully", body = VerifyAccountResponse),
        (status = 401, description = "Unauthorized - Invalid or used token"),
        (status = 500, description = "Internal server error"),
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Authentication"
)]
#[post("/verify-account")]
pub async fn verify_account(
    _data: Data<AppState>,
    otp_token: OtpToken,
) -> Result<Json<VerifyAccountResponse>, Error> {
    let user = otp_token.0;
    let user_id = user.id;

    info!("Account verified for user_id: {} (token auto-blacklisted)", user_id);

    // Here you would typically:
    // 1. Update user's verified status in database
    // 2. Send a confirmation email
    // 3. Log the verification event
    // For now, we'll just return success

    Ok(Json(VerifyAccountResponse {
        message: "Account verified successfully".to_string(),
        user_id,
    }))
}

#[utoipa::path(
    post,
    path = "/auth/logout",
    responses(
        (status = 200, description = "Logged out successfully", body = LogoutResponse),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error"),
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Authentication"
)]
#[post("/logout")]
pub async fn logout(
    data: Data<AppState>,
    _current_user: CurrentUser,
    auth: BearerAuth,
) -> Result<Json<LogoutResponse>, Error> {
    let token = auth.token();

    info!("User logging out");

    // Blacklist the token with 24-hour expiry (matching standard JWT expiry)
    blacklist_token(
        &data.redis_pool,
        &data.config.blacklist_token_prefix,
        token,
        86400, // 24 hours in seconds
    )
    .await
    .map_err(|e| {
        error!("Failed to blacklist token during logout: {}", e);
        error::ErrorInternalServerError("Failed to complete logout")
    })?;

    info!("User logged out successfully");

    Ok(Json(LogoutResponse {
        message: "Logged out successfully".to_string(),
    }))
}

#[utoipa::path(
    post,
    path = "/auth/resend-otp",
    request_body = ResendOtpRequest,
    responses(
        (status = 200, description = "OTP resent successfully", body = ResendOtpResponse),
        (status = 400, description = "Bad request"),
        (status = 404, description = "User not found"),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Authentication"
)]
#[post("/resend-otp")]
pub async fn resend_otp(
    data: Data<AppState>,
    payload: Json<ResendOtpRequest>,
) -> Result<Json<ResendOtpResponse>, Error> {
    // Validate request
    payload.validate().map_err(|e| {
        error!("Validation error: {}", e);
        error::ErrorBadRequest(format!("Validation error: {}", e))
    })?;

    let request_data = payload.into_inner();

    // Check if user exists
    let _user = get_user_by_email(&data.db, &request_data.email)
        .await
        .map_err(|e| {
            error!("User lookup error for {}: {}", request_data.email, e);
            error::ErrorNotFound("User not found with this email")
        })?;

    info!("Resending OTP to user: {}", request_data.email);

    // Generate new OTP
    let otp = generate_otp();

    // Store OTP in Redis
    store_otp_in_redis(
        &data.redis_pool,
        &data.config.otp_prefix,
        &request_data.email,
        &otp,
        data.config.otp_expiry_seconds,
    )
    .await
    .map_err(|e| {
        error!("Failed to store OTP in Redis: {}", e);
        error::ErrorInternalServerError("Failed to generate OTP")
    })?;

    // Send OTP email
    send_otp_email(&data.config, &request_data.email, &otp)
        .await
        .map_err(|e| {
            error!("Failed to send OTP email: {}", e);
            error::ErrorInternalServerError("Failed to send OTP email")
        })?;

    info!("OTP resent successfully to {}", request_data.email);

    Ok(Json(ResendOtpResponse {
        message: "OTP sent successfully. Please check your email.".to_string(),
    }))
}

#[utoipa::path(
    post,
    path = "/auth/activate-account",
    responses(
        (status = 200, description = "Account activated successfully", body = ActivateAccountResponse),
        (status = 401, description = "Unauthorized - Invalid or used token"),
        (status = 500, description = "Internal server error"),
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Authentication"
)]
#[post("/activate-account")]
pub async fn activate_account_handler(
    data: Data<AppState>,
    otp_token: OtpToken,
) -> Result<Json<ActivateAccountResponse>, Error> {
    let user = otp_token.0;
    let user_id = user.id;
    let email = user.email.clone();

    info!("Activating account for user_id: {} (token auto-blacklisted)", user_id);

    // Activate the account
    activate_account(&data.db, &email)
        .await
        .map_err(|e| {
            error!("Failed to activate account for {}: {}", email, e);
            error::ErrorInternalServerError("Failed to activate account")
        })?;

    info!("Account activated for user_id: {}", user_id);

    Ok(Json(ActivateAccountResponse {
        message: "Account activated successfully. You can now log in.".to_string(),
    }))
}
