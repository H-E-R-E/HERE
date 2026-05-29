use actix_web::web;

pub fn init(cfg: &mut web::ServiceConfig) {
    use crate::handlers::chat::*;

    cfg.service(
        web::scope("/chat")
            .service(get_chat_history)
            .service(send_chat_message)
            .service(chat_ws),
    );
}
