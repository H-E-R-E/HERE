use crate::handlers::auth::*;
use crate::handlers::users::*;
use crate::schemas::auth::*;
use crate::schemas::user::*;
use utoipa::openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::{Modify, OpenApi};

#[derive(OpenApi)]
#[openapi(
    paths(
        signup,
        login,
        get_me,
        health_check
    ),
    components(
        schemas(SignUp, SignShow, LoginRequest, LoginResponse, UserMeResponse)
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "H.E.R.E Backend Doc", description = "API documentation for H.E.R.E Backend")
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
