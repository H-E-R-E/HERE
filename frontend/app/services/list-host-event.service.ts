import { api } from "./api";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export type EventCategory = "Conference" | string;
export type EventStatus = "Scheduled" | string;
export type EventVisibility = "Public" | string;
export type AttendanceProfile = "quick" | string;

export interface HostEvent {
  id: number;
  name: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  visibility: EventVisibility;
  host_id: number;
  host_name: string;
  start_time: string;
  end_time: string;
  latitude: number;
  longitude: number;
  geofence_radius: number;
  attendance_profile: AttendanceProfile;
  attendance_window_minutes: number;
  rsvp_count: number;
  checked_in_count: number;
  created_at: string;
  updated_at: string;
}

export interface GetMyEventsResponse {
  events: HostEvent[];
  total: number;
}

export interface GetMyEventsParams {
  limit?: number | null;
  offset?: number | null;
  enabled?: boolean;
}

export const useGetMyEvents = (params: GetMyEventsParams = {}) => {
  const { limit, offset, enabled = true } = params;

  return useQuery<GetMyEventsResponse, AxiosError>({
    queryKey: ["my-events", limit ?? null, offset ?? null],
    queryFn: async () => {
      const res = await api.get<GetMyEventsResponse>("/api/hosts/events", {
        params: {
          ...(limit !== undefined && limit !== null ? { limit } : {}),
          ...(offset !== undefined && offset !== null ? { offset } : {}),
        },
      });
      return res.data;
    },
    enabled,
  });
};