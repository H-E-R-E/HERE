use actix_web::web;

/// Configure auth-related routes.
pub fn init(cfg: &mut web::ServiceConfig) {
    use crate::handlers::auth::login;

    cfg.service(web::scope("/auth").service(login));
}
