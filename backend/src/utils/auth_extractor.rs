use actix_web::{Error, FromRequest, HttpRequest, dev::Payload, error};
use actix_web_httpauth::extractors::bearer::BearerAuth;
use futures::future::Future;
use std::pin::Pin;
use tracing::error;

use crate::core::configs::AppState;
use crate::entity::user;
use crate::entity::attendee;
use crate::entity::host;
use crate::services::users::{get_user_model_by_id,get_host_with_user,get_attendee_with_user};
use crate::utils::email::is_token_blacklisted;
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
pub struct CurrentUser(
    pub user::Model,
);



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

pub struct CurrentAttendee(
    pub user::Model,
    pub attendee::Model,
);

impl FromRequest for CurrentAttendee{
    type Error= Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self,Self::Error>>>>;

    fn from_request(request:&HttpRequest,payload:&mut Payload)->Self::Future{
        let request = request.clone();
        let mut payload = payload.take();

        //NOTE - Getting user with Attendee relation preloaded
        Box::pin(async move{
            let auth = BearerAuth::from_request(&request,&mut payload).await.map_err(|e|{
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
            let (attendee,user) = get_attendee_with_user(&state.db,user_id).await.map_err(|e|{
                error!("Failed to fetch attendee with user: {}", e);
                error::ErrorUnauthorized("Attendee not found or database error")
            })?;
            Ok(CurrentAttendee(user, attendee))
        })
        
        
    }
}

/// Extractor for verification token with scope validation and blacklist checking
///
/// This extractor validates that:
/// 1. The token is valid and not expired
/// 2. The token has the required "verify_account" scope
/// 3. The token hasn't been blacklisted (used before)
///
/// Returns the user_id from the token
pub struct VerificationToken(pub i32);

impl FromRequest for VerificationToken {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, payload: &mut Payload) -> Self::Future {
        let req = req.clone();
        let mut payload = payload.take();

        Box::pin(async move {
            use crate::utils::email::is_token_blacklisted;

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
            match claims.scope.as_deref() {
                Some("verify_account") => {
                    // Scope is valid
                }
                Some(other) => {
                    error!("Invalid token scope: {}", other);
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

            Ok(VerificationToken(user_id))
        })
    }
}

pub struct CurrentHost(
    pub user::Model,
    pub host::Model,
);

impl FromRequest for CurrentHost{
    type Error= Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self,Self::Error>>>>;

    fn from_request(request:&HttpRequest,payload:&mut Payload)->Self::Future{
        let request = request.clone();
        let mut payload = payload.take();

        Box::pin(async move{
            let auth = BearerAuth::from_request(&request,&mut payload).await.map_err(|e|{
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
            let (host,user) = get_host_with_user(&state.db,user_id).await.map_err(|e|{
                error!("Failed to fetch host with user: {}", e);
                error::ErrorUnauthorized("Host not found or database error")
            })?;
            Ok(CurrentHost(user,host) )
        })
        
        
    }
}