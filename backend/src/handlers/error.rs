use actix_web::{HttpResponse, Result};

/// Custom 404 page with navigation options
pub async fn custom_404() -> Result<HttpResponse> {
    let html = include_str!("../templates/error.html");

    Ok(HttpResponse::NotFound()
        .content_type("text/html; charset=utf-8")
        .body(html))
}
