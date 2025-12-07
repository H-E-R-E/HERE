import { api } from "./api";
import { useMutation } from "@tanstack/react-query";
import { AppEvent } from "../../types/EventTypes";
import { AxiosError } from "axios";

interface CreateEventResponse {
  attendance_profile: "quick";
  attendance_window_minutes: number;
  category: string;
  checked_in_count: number;
  created_at: string;
  description: string;
  end_time: string;
  geofence_radius: number;
  host_id: number;
  host_name: "string";
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  rsvp_count: number;
  start_time: Date;
  status: string;
  updated_at: string;
  visibility: "Public" | "Private";
}

export const useCreateEvent = (event_type: "physical") => {
    return useMutation<CreateEventResponse, AxiosError, AppEvent>({
        mutationFn: async(eventData: AppEvent) => {
        const res = await api.post(`/events/${event_type}`, eventData);
        return res.data;


        },

        onSuccess: (data) => {
            console.log("Event successfully created,", data)
        },
        onError: (err)  => {
        if (err.response?.status === 401) {
          console.log("No host token");
        } else {
            console.log(err.response);
          console.log("Error", "Something went wrong. Please try again.");
        }
        }
    })
}


