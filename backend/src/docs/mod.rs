use crate::handlers::auth::*;
use crate::handlers::users::*;
use crate::schemas::auth::*;
use crate::schemas::user::*;
use crate::entity::{SignupType, EventType, EventCategory, Motivation, Skill};
use utoipa::openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::{Modify, OpenApi};

#[derive(OpenApi)]
#[openapi(
    paths(
        // User routes
        signup,
        get_me,
        update_profile,
        health_check,
        // Auth routes
        login,
        verify_otp,
        verify_account,
        logout,
        resend_otp,
    ),
    components(
        schemas(
            // User schemas
            SignUp, 
            SignShow, 
            UpdateProfileRequest,
            UpdateProfileResponse,
            // Auth schemas
            LoginRequest, 
            LoginResponse, 
            UserMeResponse,
            AttendeeData,
            VerifyOtpRequest,
            VerifyOtpResponse,
            VerifyAccountResponse,
            LogoutResponse,
            ResendOtpRequest,
            ResendOtpResponse,
            // Entity enums
            SignupType,
            EventType,
            EventCategory,
            Motivation,
            Skill,
        )
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "H.E.R.E Backend API", description = "Complete API documentation for H.E.R.E event platform"),
        (name = "Users", description = "User registration and profile management"),
        (name = "Authentication", description = "Login, logout, and email verification and other auth related actions"),
    )
)]
pub struct ApiDoc;

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer_auth",
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .build(),
                ),
            )
        }
    }
}
