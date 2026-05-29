import asyncio
import json
from collections import defaultdict
from typing import Dict, List, Set

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import DatabaseDep
from app.models.chat import ChatMessage
from app.models.user import BaseUser
from app.schemas import SendChatMessageRequest, ChatMessageResponse
from app.utils.auth import CurrentBaseUserDep, decode_jwt

router = APIRouter(prefix="/chat", tags=["Chat"])

# Simple in-memory connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # Maps event_id to a dictionary of user_id to set of WebSockets
        self.active_connections: Dict[int, Dict[int, Set[WebSocket]]] = defaultdict(lambda: defaultdict(set))

    async def connect(self, websocket: WebSocket, event_id: int, user_id: int):
        await websocket.accept()
        self.active_connections[event_id][user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, event_id: int, user_id: int):
        if event_id in self.active_connections and user_id in self.active_connections[event_id]:
            self.active_connections[event_id][user_id].discard(websocket)
            if not self.active_connections[event_id][user_id]:
                del self.active_connections[event_id][user_id]
            if not self.active_connections[event_id]:
                del self.active_connections[event_id]

    async def broadcast(self, event_id: int, message: str):
        if event_id in self.active_connections:
            for user_conns in self.active_connections[event_id].values():
                for connection in user_conns:
                    try:
                        await connection.send_text(message)
                    except Exception:
                        pass

manager = ConnectionManager()


@router.get("/{event_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(
    event_id: int,
    db: DatabaseDep,
    current_user: CurrentBaseUserDep,
):
    """Retrieve chat history for an event (HTTP fallback)."""
    # Fetch messages
    result = await db.execute(
        select(ChatMessage)
        .options(selectinload(ChatMessage.user))
        .filter(ChatMessage.event_id == event_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()
    
    return [
        ChatMessageResponse(
            id=msg.id,
            event_id=msg.event_id,
            user_id=msg.user_id,
            username=msg.user.username if msg.user else "Unknown",
            content=msg.content,
            created_at=msg.created_at,
        )
        for msg in messages
    ]


@router.post("/{event_id}", response_model=ChatMessageResponse)
async def send_chat_message(
    event_id: int,
    payload: SendChatMessageRequest,
    db: DatabaseDep,
    current_user: CurrentBaseUserDep,
):
    """Send a chat message for an event (HTTP fallback)."""
    new_msg = ChatMessage(
        event_id=event_id,
        user_id=current_user.id,
        content=payload.content,
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)
    
    response = ChatMessageResponse(
        id=new_msg.id,
        event_id=new_msg.event_id,
        user_id=new_msg.user_id,
        username=current_user.username,
        content=new_msg.content,
        created_at=new_msg.created_at,
    )
    
    # Broadcast to WebSocket clients
    await manager.broadcast(event_id, response.model_dump_json())
    
    return response


@router.websocket("/ws/{event_id}")
async def chat_ws(websocket: WebSocket, event_id: int, db: DatabaseDep):
    """Real-time chat WebSocket endpoint.
    
    Clients should send their JWT token as the first message to authenticate:
    {"token": "eyJhbGciOi..."}
    """
    user_id = None
    user = None
    
    await websocket.accept()
    
    try:
        # First message must be auth token
        data = await websocket.receive_text()
        try:
            parsed = json.loads(data)
            token = parsed.get("token")
            if token:
                payload = decode_jwt(token)
                user_id_str = payload.get("sub")
                if user_id_str:
                    user_id = int(user_id_str)
                    
                    # Optional: Verify user actually exists
                    result = await db.execute(select(BaseUser).filter(BaseUser.id == user_id))
                    user = result.scalars().first()
                    if not user:
                        await websocket.close(code=1008, reason="User not found")
                        return
                    
                    await manager.connect(websocket, event_id, user_id)
                else:
                    await websocket.close(code=1008, reason="Invalid token")
                    return
            else:
                await websocket.close(code=1008, reason="Authentication required")
                return
        except Exception:
            await websocket.close(code=1008, reason="Invalid authentication format")
            return
            
        # Loop to receive chat messages
        while True:
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                content = parsed.get("content")
                if content and user_id:
                    # Save to DB
                    new_msg = ChatMessage(
                        event_id=event_id,
                        user_id=user_id,
                        content=content,
                    )
                    db.add(new_msg)
                    await db.commit()
                    await db.refresh(new_msg)
                    
                    response = ChatMessageResponse(
                        id=new_msg.id,
                        event_id=new_msg.event_id,
                        user_id=new_msg.user_id,
                        username=user.username if user else "Unknown",
                        content=new_msg.content,
                        created_at=new_msg.created_at,
                    )
                    
                    await manager.broadcast(event_id, response.model_dump_json())
            except Exception:
                # Log invalid messages or just ignore
                pass

    except WebSocketDisconnect:
        if user_id:
            manager.disconnect(websocket, event_id, user_id)
