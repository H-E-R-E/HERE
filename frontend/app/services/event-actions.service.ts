import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api"; // Adjust import to your setup
import { AxiosError } from "axios";

export interface RsvpResponse {
  event_id: number;
  attendee_id: number;
  status: string;
  message: string;
}

export const useRsvpEvent = (eventType: string, eventId: string | number) => {
  const queryClient = useQueryClient();

  return useMutation<RsvpResponse, AxiosError>({
    mutationFn: async () => {
      const res = await api.post<RsvpResponse>(`/api/events/${eventType}/${eventId}/rsvp`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventType, String(eventId)] });
    }
  });
};

export interface AttendancePayload {
  verify_location: boolean;
  latitude: number;
  longitude: number;
}

export interface AttendanceResponse {
  id: number;
  event_id: number;
  attendee_id: number;
  status: string;
  checked_in_at: string;
  location_verified: boolean;
  is_late: boolean;
  message: string;
}

export const useCheckInEvent = (eventType: string, eventId: string | number) => {
  const queryClient = useQueryClient();

  return useMutation<AttendanceResponse, AxiosError, AttendancePayload>({
    mutationFn: async (payload) => {
      const res = await api.post<AttendanceResponse>(`/api/events/${eventType}/${eventId}/attendance`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventType, String(eventId)] });
    }
  });
};