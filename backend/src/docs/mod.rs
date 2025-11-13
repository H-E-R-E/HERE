use crate::entity::{AttendanceStatus, EventCategory, EventStatus, EventType, EventVisibility, Motivation, SignupType, Skill};
use crate::handlers::auth::*;
use crate::handlers::events::*;
use crate::handlers::users::*;
use crate::schemas::auth::*;
use crate::schemas::event::*;
use crate::schemas::user::*;
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
        activate_account_handler,
        switch_user_scope,
        // Event routes
        create_event,
        get_event,
        update_event,
        cancel_event_handler,
        list_events,
        rsvp_event_handler,
        mark_attendance_handler,
        get_attendance_summary,
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
            ActivateAccountResponse,
            DeleteAccountResponse,
            // Event schemas
            CreatePhysicalEventRequest,
            UpdatePhysicalEventRequest,
            RsvpEventRequest,
            MarkAttendanceRequest,
            PhysicalEventResponse,
            PhysicalEventsListResponse,
            RsvpResponse,
            AttendanceResponse,
            EventAttendeeDetails,
            EventAttendanceSummary,
            SwitchUserScopeRequest,
            SwitchUserScopeResponse,
            CancelEventRequest,
            CancelEventResponse,
            AttendanceProfile,
            // Entity enums
            SignupType,
            EventType,
            EventCategory,
            EventStatus,
            EventVisibility,
            AttendanceStatus,
            Motivation,
            Skill,
        )
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "H.E.R.E Backend API", description = "Complete API documentation for H.E.R.E event platform"),
        (name = "Users", description = "User registration and profile management"),
        (name = "Authentication", description = "Login, logout, email verification, and scope switching"),
        (name = "Events", description = "Physical event creation, management, RSVP, and attendance tracking"),
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
