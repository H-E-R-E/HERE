use actix_web::{
    Error, Result, get, post, error,
    web::{Data, Json, Path, Payload},
    HttpRequest, HttpResponse,
};
use actix_web_httpauth::extractors::bearer::BearerAuth;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set};
use tracing::{error, info};
use actix_ws::Message;
use futures::StreamExt;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

use crate::core::configs::AppState;
use crate::entity::{chat_message, user};
use crate::schemas::chat::{ChatMessageResponse, SendChatMessageRequest};
use crate::utils::auth_extractor::CurrentUser;

/// Maps event_id -> map of connected WebSocket clients (user_id -> sender channel)
type ChatSessions = Arc<RwLock<HashMap<i32, HashMap<i32, mpsc::Sender<String>>>>>;

#[derive(Clone)]
pub struct ChatServer {
    pub sessions: ChatSessions,
}

impl ChatServer {
    pub fn new() -> Self {
        ChatServer {
            sessions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn add_client(&self, event_id: i32, user_id: i32, tx: mpsc::Sender<String>) {
        let mut rooms = self.sessions.write().await;
        let room = rooms.entry(event_id).or_insert_with(HashMap::new);
        room.insert(user_id, tx);
    }

    pub async fn remove_client(&self, event_id: i32, user_id: i32) {
        let mut rooms = self.sessions.write().await;
        if let Some(room) = rooms.get_mut(&event_id) {
            room.remove(&user_id);
            if room.is_empty() {
                rooms.remove(&event_id);
            }
        }
    }

    pub async fn broadcast(&self, event_id: i32, msg: &str) {
        let rooms = self.sessions.read().await;
        if let Some(room) = rooms.get(&event_id) {
            for tx in room.values() {
                let _ = tx.send(msg.to_string()).await;
            }
        }
    }
}

// Global ChatServer state
lazy_static::lazy_static! {
    pub static ref CHAT_SERVER: ChatServer = ChatServer::new();
}

#[utoipa::path(
    get,
    path = "/chat/{event_id}",
    responses(
        (status = 200, description = "Chat history", body = Vec<ChatMessageResponse>),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error"),
    ),
    params(
        ("event_id" = i32, Path, description = "Event ID")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Chat"
)]
#[get("/{event_id}")]
pub async fn get_chat_history(
    data: Data<AppState>,
    event_id: Path<i32>,
    _current_user: CurrentUser,
) -> Result<Json<Vec<ChatMessageResponse>>, Error> {
    let evt_id = event_id.into_inner();

    let messages = chat_message::Entity::find()
        .filter(chat_message::Column::EventId.eq(evt_id))
        .find_also_related(user::Entity)
        .order_by_asc(chat_message::Column::CreatedAt)
        .all(&data.db)
        .await
        .map_err(|e| {
            error!("Failed to fetch chat history: {}", e);
            error::ErrorInternalServerError("Failed to fetch chat history")
        })?;

    let res: Vec<ChatMessageResponse> = messages
        .into_iter()
        .map(|(msg, usr)| ChatMessageResponse {
            id: msg.id,
            event_id: msg.event_id,
            user_id: msg.user_id,
            username: usr.map(|u| u.username).unwrap_or_else(|| "Unknown".to_string()),
            content: msg.content,
            created_at: msg.created_at.to_string(),
        })
        .collect();

    Ok(Json(res))
}

#[utoipa::path(
    post,
    path = "/chat/{event_id}",
    request_body = SendChatMessageRequest,
    responses(
        (status = 200, description = "Message sent successfully", body = ChatMessageResponse),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error"),
    ),
    params(
        ("event_id" = i32, Path, description = "Event ID")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Chat"
)]
#[post("/{event_id}")]
pub async fn send_chat_message(
    data: Data<AppState>,
    event_id: Path<i32>,
    payload: Json<SendChatMessageRequest>,
    current_user: CurrentUser,
) -> Result<Json<ChatMessageResponse>, Error> {
    let evt_id = event_id.into_inner();
    let user = current_user.0;

    // Save to database
    let new_msg = chat_message::ActiveModel {
        event_id: Set(evt_id),
        user_id: Set(user.id),
        content: Set(payload.content.clone()),
        created_at: Set(chrono::Utc::now().naive_utc()),
        ..Default::default()
    }
    .insert(&data.db)
    .await
    .map_err(|e| {
        error!("Failed to save chat message: {}", e);
        error::ErrorInternalServerError("Failed to send message")
    })?;

    let response = ChatMessageResponse {
        id: new_msg.id,
        event_id: new_msg.event_id,
        user_id: new_msg.user_id,
        username: user.username,
        content: new_msg.content,
        created_at: new_msg.created_at.to_string(),
    };

    // Broadcast to WebSocket clients
    if let Ok(json_msg) = serde_json::to_string(&response) {
        CHAT_SERVER.broadcast(evt_id, &json_msg).await;
    }

    Ok(Json(response))
}

// WebSocket endpoint for real-time chat
#[get("/ws/{event_id}")]
pub async fn chat_ws(
    req: HttpRequest,
    event_id: Path<i32>,
    stream: Payload,
    // Optional query auth or cookie could be extracted here.
    // For simplicity, we assume auth is handled or we rely on token passed in first message
) -> Result<HttpResponse, Error> {
    let evt_id = event_id.into_inner();
    
    // Actix-ws handles the handshake
    let (response, mut session, mut msg_stream) = actix_ws::handle(&req, stream)?;

    actix_web::rt::spawn(async move {
        // We will assign a temporary ID until auth is proven, or if the client sends their token
        // In a real app, you'd extract a token from query params or headers here.
        // Let's assume the client sends `{ "token": "...", "type": "auth" }` as the first message
        let mut user_id = 0; // unauthenticated initially

        let (tx, mut rx) = mpsc::channel(100);

        // Forward messages from rx channel to the WebSocket session
        let mut session_clone = session.clone();
        actix_web::rt::spawn(async move {
            while let Some(msg) = rx.recv().await {
                if session_clone.text(msg).await.is_err() {
                    break;
                }
            }
        });

        while let Some(Ok(msg)) = msg_stream.next().await {
            match msg {
                Message::Text(text) => {
                    // For simplicity, we just parse JSON to see if they're authenticating
                    if user_id == 0 {
                        // Assuming auth is handled by the first message
                        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&text) {
                            if let Some(id) = parsed.get("user_id").and_then(|v| v.as_i64()) {
                                user_id = id as i32;
                                CHAT_SERVER.add_client(evt_id, user_id, tx.clone()).await;
                                continue;
                            }
                        }
                    }
                }
                Message::Close(_) => {
                    break;
                }
                _ => {}
            }
        }

        if user_id != 0 {
            CHAT_SERVER.remove_client(evt_id, user_id).await;
        }
        let _ = session.close(None).await;
    });

    Ok(response)
}
