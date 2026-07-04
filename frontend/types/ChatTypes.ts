export interface ChatMessageResponse {
  id: number;
  event_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}