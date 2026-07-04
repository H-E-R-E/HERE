import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "./api";
import { ChatMessageResponse } from "../../types/ChatTypes";

export const fetchChatHistory = async (
  eventId: string | number,
  afterId?: number
): Promise<ChatMessageResponse[]> => {
  const res = await api.get<ChatMessageResponse[]>(`/chat/${eventId}`, {
    params: afterId ? { after_id: afterId } : undefined,
  });
  return res.data;
};
 
export const useChatHistory = (eventId: string | number) => {
  return useQuery<ChatMessageResponse[], AxiosError>({
    queryKey: ["chat-history", String(eventId)],
    queryFn: () => fetchChatHistory(eventId),
    enabled: !!eventId,
  });
};

export const sendChatMessageHttp = async (
  eventId: string | number,
  content: string
): Promise<ChatMessageResponse> => {
  const res = await api.post<ChatMessageResponse>(`/chat/${eventId}`, { content });
  return res.data;
};





