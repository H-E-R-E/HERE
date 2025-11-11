use actix_web::web;

/// Configure user-related routes.
pub fn init(cfg: &mut web::ServiceConfig) {
    use crate::handlers::users::*;

    cfg.service(
        web::scope("/users")
            .service(signup)
            .service(health_check)
            .service(get_me)
            .service(update_profile)
            .service(delete_account),
    );
}
