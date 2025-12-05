use actix_web::web;

use crate::handlers::events::{
    cancel_event_handler, create_event, get_attendance_summary, get_event, list_events,
    mark_attendance_handler, rsvp_event_handler, update_event_handler,
};

pub fn events_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .service(create_event)
            .service(get_event)
            .service(update_event_handler)
            .service(cancel_event_handler)
            .service(list_events)
            .service(rsvp_event_handler)
            .service(mark_attendance_handler)
            .service(get_attendance_summary),
    );
}
