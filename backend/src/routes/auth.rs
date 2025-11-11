use actix_web::web;

/// Configure auth-related routes.
pub fn init(cfg: &mut web::ServiceConfig) {
    use crate::handlers::auth::*;

    cfg.service(
        web::scope("/auth")
            .service(login)
            .service(logout)
            .service(verify_otp)
            .service(resend_otp)
            .service(verify_account)
            .service(activate_account_handler),
    );
}
