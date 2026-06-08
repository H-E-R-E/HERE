import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import { AxiosError } from "axios";

interface EventResponse {
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
  geofence_radius: number | null;
  attendance_profile: string;
  attendance_window_minutes: number;
  rsvp_count: number;
  checked_in_count: number;
  created_at: string;
  updated_at: string;
}

interface UpdateEventPayload {
  name?: string;
  description?: string;
  category?: string;
  visibility?: string;
  start_time?: string;
  end_time?: string;
  latitude?: number;
  longitude?: number;
  geofence_radius?: number | null;
  attendance_profile?: string;
  recurrence?: {
    frequency?: string;
    interval?: number;
    days_of_week?: string[];
    end_date?: string;
    count?: number;
  } | null;
}

interface UpdateEventVariables {
  eventId: number;
  eventData: UpdateEventPayload;
}

export const useUpdateEvent = (eventType: string) => {
  return useMutation<EventResponse, AxiosError, UpdateEventVariables>({
    mutationFn: async ({ eventId, eventData }) => {
      const res = await api.put<EventResponse>(
        `/api/events/${eventType}/${eventId}`,
        eventData
      );
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Event updated successfully!", data);
    },
    onError: (err) => {
      console.error("Failed to update event", err.response?.data);
    },
  });
};