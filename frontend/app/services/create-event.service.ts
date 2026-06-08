import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import { AxiosError } from "axios";
import { AppEvent } from "../../types/EventTypes";

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

export const useCreateEvent = (eventType: string) => {
  return useMutation<EventResponse, AxiosError, AppEvent>({
    mutationFn: async (eventData) => {
      const res = await api.post<EventResponse>(`/api/events/${eventType}`, eventData);
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Event created successfully!", data);
    },
    onError: (err) => {
      console.error("Failed to create event", err.response?.data);
    }
  });
};