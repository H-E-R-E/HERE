import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { AxiosError } from "axios";

export interface AppNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  event_id: number;
}

export interface GetNotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
}


export const useGetNotifications = () => {
  return useQuery<GetNotificationsResponse, AxiosError>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get<GetNotificationsResponse>("/notifications");
      return res.data;
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<AppNotification, AxiosError, number>({
    mutationFn: async (notificationId) => {
      const res = await api.put<AppNotification>(`/notifications/${notificationId}/read`);
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Notification marked as read successfully!", data);
      // Invalidate cache to trigger a re-fetch of the notifications list & unread count
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      console.error("Failed to mark notification as read", err.response?.data);
    },
  });
};


export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();


  return useMutation<Record<string, unknown>, AxiosError, void>({
    mutationFn: async () => {
      const res = await api.put<Record<string, unknown>>("/notifications/read_all");
      return res.data;
    },
    onSuccess: (data) => {
      console.log("All notifications marked as read successfully!", data);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      console.error("Failed to mark all notifications as read", err.response?.data);
    },
  });
};