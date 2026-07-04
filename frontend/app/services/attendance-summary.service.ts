import { api } from "./api";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export interface AttendeeSummary {
  attendee_id: number;
  username: string;
  first_name: string;
  last_name: string;
  status: string;
  rsvp_time: string | null;
  check_in_time: string | null;
  is_late: boolean;
}

export interface AttendanceSummaryResponse {
  event_id: number;
  total_rsvp: number;
  total_checked_in: number;
  total_no_show: number;
  total_late: number;
  attendees: AttendeeSummary[];
}

export const useGetAttendanceSummary = (eventType: string, eventId: string | number) => {
  return useQuery<AttendanceSummaryResponse, AxiosError>({
    queryKey: ["attendance-summary", eventType, String(eventId)],
    queryFn: async () => {
      const res = await api.get<AttendanceSummaryResponse>(`/api/events/${eventType}/${eventId}/attendance`);
      return res.data;
    },
    enabled: !!eventType && !!eventId,
  });
};