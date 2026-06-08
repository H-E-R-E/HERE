import { useQuery } from "@tanstack/react-query";
import { api } from "./api"; // Adjust import based on your setup
import { AxiosError } from "axios";
import { EventResponse } from "./list-events.service"; 

export const useGetEvent = (eventType: string | undefined, eventId: number | string | undefined) => {
  return useQuery<EventResponse, AxiosError>({
    queryKey: ["event", eventType, eventId],
    queryFn: async () => {
      const res = await api.get<EventResponse>(`/api/events/${eventType}/${eventId}`);
      return res.data;
    },

    enabled: !!eventType && !!eventId,
  });
};