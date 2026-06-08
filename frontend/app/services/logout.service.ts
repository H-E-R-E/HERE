import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import { AxiosError } from "axios";

interface LogoutResponse {
  success: boolean;
  message: string;
}

export const useLogout = () => {
  return useMutation<LogoutResponse, AxiosError>({
    mutationFn: async () => {
      const res = await api.post("/auth/logout");
      return res.data;
    },
  });
};