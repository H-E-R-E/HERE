use actix_web::web;

/// Configure user-related routes.
pub fn init(cfg: &mut web::ServiceConfig) {
    use crate::handlers::auth::get_me;
    use crate::handlers::users::{health_check, signup};

    cfg.service(
        web::scope("/users")
            .service(signup)
            .service(health_check)
            .service(get_me),
    );
}
