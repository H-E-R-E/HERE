use actix_web::{Error, FromRequest, HttpRequest, dev::Payload, error};
use actix_web_httpauth::extractors::bearer::BearerAuth;
use futures::future::Future;
use std::pin::Pin;
use tracing::error;

use crate::core::configs::AppState;
use crate::entity::user;
use crate::services::users::get_user_model_by_id;
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
