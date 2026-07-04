import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatMessageResponse } from "../../types/ChatTypes";
import { fetchChatHistory } from "../services/chat.service";
import { sendChatMessageHttp } from "../services/chat.service";


export type ChatSocketStatus = "idle" | "connecting" | "authenticating" | "open" | "closed" | "error";

const getWsUrl = (eventId: string | number) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "";
  const wsBase = apiUrl.replace(/^http/, "ws");
  return `${wsBase}/chat/ws/${eventId}`;
};


interface UseChatSocketOptions {
  eventId: string | number;
  enabled?: boolean; 
}

export const useChatSocket = ({ eventId, enabled = true }: UseChatSocketOptions) => {
  const [status, setStatus] = useState<ChatSocketStatus>("idle");
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnect = useRef(true);
  const isFirstConnect = useRef(true);
  const queryClient = useQueryClient();
  const lastMessageId = useRef<number | undefined>(undefined);
 
  const appendMessages = useCallback(
    (incoming: ChatMessageResponse[]) => {
      if (incoming.length === 0) return;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const deduped = incoming.filter((m) => !existingIds.has(m.id));
        if (deduped.length === 0) return prev;
        const merged = [...prev, ...deduped].sort((a, b) => b.id - a.id);

        lastMessageId.current = merged[0].id; 
        
        return merged;
      });
      queryClient.setQueryData<ChatMessageResponse[]>(
        ["chat-history", String(eventId)],
        (old) => {
          if (!old) return incoming;
          const existingIds = new Set(old.map((m) => m.id));
          const deduped = incoming.filter((m) => !existingIds.has(m.id));
          return [...old, ...deduped];
        }
      );
    },
    [eventId, queryClient]
  );
 
  const connect = useCallback(async () => {
    if (!eventId) return;
 
    setStatus("connecting");
 
    try {
      const gapFill = isFirstConnect.current
        ? await fetchChatHistory(eventId)
        : await fetchChatHistory(eventId, lastMessageId.current);
      appendMessages(gapFill);
      isFirstConnect.current = false;
    } catch (e) {
      console.error("Chat: failed to fetch history on connect", e);
    }
 
    const ws = new WebSocket(getWsUrl(eventId));
    wsRef.current = ws;
 
    ws.onopen = async () => {
      setStatus("authenticating");
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("Chat WS: no token found, closing");
        ws.close();
        setStatus("error");
        return;
      }
      ws.send(JSON.stringify({ token }));
      setStatus("open");
      reconnectAttempt.current = 0;
    };
 
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.error) {
          console.log("Chat WS: server reported an error:", parsed.error);
          return;
        }
        appendMessages([parsed as ChatMessageResponse]);
      } catch (e) {
        console.error("Chat WS: failed to parse incoming message", e);
      }
    };
 
    ws.onerror = (e) => {
      console.error("Chat WS error:", e);
      setStatus("error");
    };
 
    ws.onclose = (e) => {
      console.log("Chat WS closed:", e.code, e.reason);
      setStatus("closed");
      wsRef.current = null;
 
      if (shouldReconnect.current && enabled) {
        const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 30000);
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };
  }, [eventId, enabled, appendMessages]);
 
  useEffect(() => {
    if (!enabled || !eventId) return;
 
    shouldReconnect.current = true;
    isFirstConnect.current = true;
    lastMessageId.current = undefined;
    setMessages([]);
    connect();
 
    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, eventId, connect]);
 
    const sendMessage = useCallback(async (content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
      return true;
    }
    
    console.log("Chat WS: not open, falling back to HTTP");
    try {
      const fallbackMsg = await sendChatMessageHttp(eventId, content);
      appendMessages([fallbackMsg]); 
      return true;
    } catch (error) {
      console.error("Chat WS: HTTP Fallback failed", error);
      return false
    }
  }, [eventId, appendMessages]);
 
  return { status, messages, sendMessage };
};
