use actix_web::{Error, FromRequest, HttpRequest, dev::Payload, error};
use actix_web_httpauth::extractors::bearer::BearerAuth;
use futures::future::Future;
use std::pin::Pin;
use tracing::{error, info};

use crate::core::configs::AppState;
use crate::entity::{attendee, host, user, TokenScope};
use crate::services::users::{get_attendee_with_user, get_host_with_user, get_user_model_by_id};
use crate::utils::email::{is_token_blacklisted, blacklist_token};
use crate::utils::utils::decode_jwt;

/// Extractor for the currently authenticated user
///
/// This can be used as a handler parameter to automatically validate JWT
/// and fetch the user from the database.
///
/// # Example
/// ```
/// #[get("/protected")]
/// async fn protected_route(current_user: CurrentUser) -> impl Responder {
///     HttpResponse::Ok().json(json!({
///         "user_id": current_user.0.id,
///         "username": current_user.0.username
///     }))
/// }
/// ```
pub struct CurrentUser(pub user::Model);

impl FromRequest for CurrentUser {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let req = req.clone();
        let mut payload = payload.take();

        Box::pin(async move {
            // Extract Bearer token
            let auth = BearerAuth::from_request(&req, &mut payload)
                .await
                .map_err(|e| {
                    error!("Failed to extract bearer token: {}", e);
                    error::ErrorUnauthorized("Missing or invalid authorization header")
                })?;

            // Get app state
            let state = req
                .app_data::<actix_web::web::Data<AppState>>()
                .ok_or_else(|| {
                    error!("Failed to get app state");
                    error::ErrorInternalServerError("Server configuration error")
                })?;

            // Check if token is blacklisted
            let is_blacklisted = is_token_blacklisted(
                &state.redis_pool,
                &state.config.blacklist_token_prefix,
                auth.token(),
            )
            .await
            .map_err(|e| {
                error!("Failed to check token blacklist: {}", e);
                error::ErrorInternalServerError("Authentication check failed")
            })?;

            if is_blacklisted {
                error!("Attempted use of blacklisted token");
                return Err(error::ErrorUnauthorized("Token has been revoked"));
            }

            // Decode JWT
            let claims = decode_jwt(auth.token(), &state.config.secret_key).map_err(|e| {
                error!("JWT decode error: {}", e);
                error::ErrorUnauthorized("Invalid or expired token")
            })?;

            // Parse user ID
            let user_id: i32 = claims.sub.parse().map_err(|e| {
                error!("Failed to parse user ID from token: {}", e);
                error::ErrorUnauthorized("Invalid token format")
            })?;

            // Fetch user from database
            let user = get_user_model_by_id(&state.db, user_id)
                .await
                .map_err(|e| {
                    error!("Failed to fetch user: {}", e);
                    error::ErrorUnauthorized("User not found or database error")
                })?;

            if !user.is_active {
                error!("Disabled user attempted to access protected resources: {}", user_id);
                return Err(error::ErrorUnauthorized("User account is disabled"));
            }

            Ok(CurrentUser(user))
        })
    }
}

/// Extractor that returns Option<CurrentUser> for routes that are optionally authenticated
pub struct MaybeCurrentUser(pub Option<user::Model>);

impl FromRequest for MaybeCurrentUser {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let req = req.clone();
        let mut payload = payload.take();

        Box::pin(async move {
            match CurrentUser::from_request(&req, &mut payload).await {
                Ok(CurrentUser(user)) => Ok(MaybeCurrentUser(Some(user))),
                Err(_) => Ok(MaybeCurrentUser(None)),
            }
        })
    }
}

pub struct CurrentAttendee(pub user::Model, pub attendee::Model);

impl FromRequest for CurrentAttendee {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(request: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let request = request.clone();
        let mut payload = payload.take();

        //NOTE - Getting user with Attendee relation preloaded
        Box::pin(async move {
            let auth = BearerAuth::from_request(&request, &mut payload)
                .await
                .map_err(|e| {
                    error!("Failed to extract bearer token: {}", e);
                    error::ErrorUnauthorized("Missing or invalid authorization header")
                })?;
            let state = request
                .app_data::<actix_web::web::Data<AppState>>()
                .ok_or_else(|| {
                    error!("Failed to get app state");
                    error::ErrorInternalServerError("Server configuration error")
                })?;

            // Check if token is blacklisted
            let is_blacklisted = is_token_blacklisted(
                &state.redis_pool,
                &state.config.blacklist_token_prefix,
                auth.token(),
            )
            .await
            .map_err(|e| {
                error!("Failed to check token blacklist: {}", e);
                error::ErrorInternalServerError("Authentication check failed")
            })?;

            if is_blacklisted {
                error!("Attempted use of blacklisted token");
                return Err(error::ErrorUnauthorized("Token has been revoked"));
            }

            let claims = decode_jwt(auth.token(), &state.config.secret_key).map_err(|e| {
                error!("JWT decode error: {}", e);
                error::ErrorUnauthorized("Invalid or expired token")
            })?;
            let user_id: i32 = claims.sub.parse().map_err(|e| {
                error!("Failed to parse user ID from token: {}", e);
                error::ErrorUnauthorized("Invalid token format")
            })?;
            let (attendee, user) =
                get_attendee_with_user(&state.db, user_id)
                    .await
                    .map_err(|e| {
                        error!("Failed to fetch attendee with user: {}", e);
                        error::ErrorUnauthorized("Attendee not found or database error")
                    })?;
            
            if !user.is_active {
                error!("Inactive user attempted to access attendee resources: {}", user_id);
                return Err(error::ErrorUnauthorized("User account is disabled"));
            }
            Ok(CurrentAttendee(user, attendee))
        })
    }
}


pub fn should_blacklist(scope: &TokenScope) -> bool {
    matches!(scope, TokenScope::Otp)
}

/// Generic extractor for scoped tokens with automatic blacklisting
///
/// This extractor:
/// 1. Validates the token is valid and not expired
/// 2. Validates the token has the required scope
/// 3. Checks if token is blacklisted
/// 4. Fetches the user from database
/// 5. Automatically blacklists the token after successful validation
///
/// Returns the full user model from the database
struct ScopedToken;

impl ScopedToken {
    /// Extract and validate a scoped token
    async fn extract_from_request(
        req: &HttpRequest,
        payload: &mut Payload,
        expected_scope: TokenScope,
    ) -> Result<user::Model, Error> {
        use crate::utils::email::is_token_blacklisted;

        // Extract Bearer token
        let auth = BearerAuth::from_request(req, payload)
            .await
            .map_err(|e| {
                error!("Failed to extract bearer token: {}", e);
                error::ErrorUnauthorized("Missing or invalid authorization header")
            })?;

        // Get app state
        let state = req
            .app_data::<actix_web::web::Data<AppState>>()
            .ok_or_else(|| {
                error!("Failed to get app state");
                error::ErrorInternalServerError("Server configuration error")
            })?;

        let token = auth.token();

        // Check if token is blacklisted
        let is_blacklisted = is_token_blacklisted(
            &state.redis_pool,
            &state.config.blacklist_token_prefix,
            token,
        )
        .await
        .map_err(|e| {
            error!("Redis error checking token blacklist: {}", e);
            error::ErrorInternalServerError("Failed to verify token status")
        })?;

        if is_blacklisted {
            error!("Attempted to use blacklisted token");
            return Err(error::ErrorUnauthorized("Token has already been used"));
        }

        // Decode JWT
        let claims = decode_jwt(token, &state.config.secret_key).map_err(|e| {
            error!("JWT decode error: {}", e);
            error::ErrorUnauthorized("Invalid or expired token")
        })?;

        // Validate scope
        let expected_scope_str = expected_scope.as_str();
        match claims.scope.as_deref() {
            Some(scope) if scope == expected_scope_str => {
                // Scope is valid
            }
            Some(other) => {
                error!("Invalid token scope: {} (expected: {})", other, expected_scope_str);
                return Err(error::ErrorUnauthorized("Invalid token scope"));
            }
            None => {
                error!("Token missing scope");
                return Err(error::ErrorUnauthorized("Token missing required scope"));
            }
        }

        // Parse user ID
        let user_id: i32 = claims.sub.parse().map_err(|e| {
            error!("Failed to parse user ID from token: {}", e);
            error::ErrorUnauthorized("Invalid token format")
        })?;

        // Fetch user from database
        let user = get_user_model_by_id(&state.db, user_id)
            .await
            .map_err(|e| {
                error!("Failed to fetch user: {}", e);
                error::ErrorUnauthorized("User not found or database error")
            })?;

        // Blacklist the token now that we've successfully validated and retrieved the user
        if should_blacklist(&expected_scope) {
            blacklist_token(
                &state.redis_pool,
                &state.config.blacklist_token_prefix,
                token,
                state.config.verification_token_expiry_seconds,
            )
            .await
            .map_err(|e| {
                error!("Failed to blacklist token: {}", e);
                error::ErrorInternalServerError("Failed to complete token validation")
            })?;

            info!("Token with scope '{}' validated and blacklisted for user {}", expected_scope_str, user_id);
        }

        Ok(user)
    }
}

/// Extractor for OTP-validated tokens
/// Use this after a user has verified their OTP to perform sensitive actions
pub struct OtpToken(pub user::Model);

impl FromRequest for OtpToken {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let req = req.clone();
        let mut payload = payload.take();

        Box::pin(async move {
            let user = ScopedToken::extract_from_request(&req, &mut payload, TokenScope::Otp).await?;
            Ok(OtpToken(user))
        })
    }
}

pub struct CurrentHost(pub user::Model, pub host::Model);

impl FromRequest for CurrentHost {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(request: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let request = request.clone();
        let mut payload = payload.take();

        Box::pin(async move {
            let auth = BearerAuth::from_request(&request, &mut payload)
                .await
                .map_err(|e| {
                    error!("Failed to extract bearer token: {}", e);
                    error::ErrorUnauthorized("Missing or invalid authorization header")
                })?;
            let state = request
                .app_data::<actix_web::web::Data<AppState>>()
                .ok_or_else(|| {
                    error!("Failed to get app state");
                    error::ErrorInternalServerError("Server configuration error")
                })?;

            // Check if token is blacklisted
            let is_blacklisted = is_token_blacklisted(
                &state.redis_pool,
                &state.config.blacklist_token_prefix,
                auth.token(),
            )
            .await
            .map_err(|e| {
                error!("Failed to check token blacklist: {}", e);
                error::ErrorInternalServerError("Authentication check failed")
            })?;

            if is_blacklisted {
                error!("Attempted use of blacklisted token");
                return Err(error::ErrorUnauthorized("Token has been revoked"));
            }

            let claims = decode_jwt(auth.token(), &state.config.secret_key).map_err(|e| {
                error!("JWT decode error: {}", e);
                error::ErrorUnauthorized("Invalid or expired token")
            })?;
            let user_id: i32 = claims.sub.parse().map_err(|e| {
                error!("Failed to parse user ID from token: {}", e);
                error::ErrorUnauthorized("Invalid token format")
            })?;
            let (host, user) = get_host_with_user(&state.db, user_id).await.map_err(|e| {
                error!("Failed to fetch host with user: {}", e);
                error::ErrorUnauthorized("Host not found or database error")
            })?;

            if !user.is_active {
                error!("Inactive user attempted to access host resources: {}", user_id);
                return Err(error::ErrorUnauthorized("User account is disabled"));
            }
            Ok(CurrentHost(user, host))
        })
    }
}

pub struct VerifiedUser(pub user::Model);

impl FromRequest for VerifiedUser {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let req = req.clone();
        let mut payload = payload.take();

        Box::pin(async move {
            let user = ScopedToken::extract_from_request(&req, &mut payload, TokenScope::Access).await?;
            if !user.verified {
                error!("Disabled user attempted to access protected resources: {}", user.id);
                return Err(error::ErrorUnauthorized("User account is disabled"));
            }
            Ok(VerifiedUser(user))
        })
    }
}

pub struct VerifiedAttendee(pub user::Model, pub attendee::Model);

impl FromRequest for VerifiedAttendee{
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(request: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let request = request.clone();
        let mut payload = payload.take();

        Box::pin(async move {
            let data = CurrentAttendee::from_request(&request, &mut payload).await?;
            if !data.0.verified {
                error!("Disabled user attempted to access protected resources: {}", data.0.id);
                return Err(error::ErrorUnauthorized("User account is disabled"));
            }
            Ok(VerifiedAttendee(data.0, data.1))
        })
    }

}

pub struct VerifiedHost(pub user::Model, pub host::Model);

impl FromRequest for VerifiedHost {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(request: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let request = request.clone();
        let mut payload = payload.take();

        Box::pin(async move {
            let data = CurrentHost::from_request(&request, &mut payload).await?;
            if !data.0.verified {
                error!("Disabled user attempted to access protected resources: {}", data.0.id);
                return Err(error::ErrorUnauthorized("User account is disabled"));
            }
            Ok(VerifiedHost(data.0, data.1))
        })
    }
}

