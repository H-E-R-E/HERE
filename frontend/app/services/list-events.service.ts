import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { AxiosError } from "axios";

export interface EventResponse {
  id: number;
  name: string;
  description: string;
  category: string;
  status: string;
  visibility: string;
  host_id: number;
  host_name: string;
  start_time: string;
  end_time: string;
  latitude: number;
  longitude: number;
  geofence_radius: number;
  attendance_profile: string;
  attendance_window_minutes: number;
  rsvp_count: number;
  checked_in_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedEventsResponse {
  events: EventResponse[];
  total: number;
}

export interface ListEventsParams {
  status?: "Scheduled" | "Ongoing" | "Completed" | "Cancelled" | null;
  limit?: number | null;
  offset?: number | null;
}

export const useListEvents = (eventType: string, params?: ListEventsParams) => {
  return useQuery<PaginatedEventsResponse, AxiosError>({
    queryKey: ["events", eventType, params],
    queryFn: async () => {
      const res = await api.get<PaginatedEventsResponse>(`/api/events/${eventType}`, {
        params: params,
      });
      return res.data;
    },
    enabled: !!eventType,
  });
};