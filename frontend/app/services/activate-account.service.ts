import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import { AxiosError } from "axios";

interface ActivateAccountResponse {
  success: boolean;
  message: string;
}

export const useActivateAccount = () => {
  return useMutation<ActivateAccountResponse, AxiosError, void>({
    mutationFn: async () => {
      const res = await api.post("/auth/activate-account");
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Account activated", data.message);
    },
    onError: (err) => {
      console.log("Activation failed", err.response?.status);
    },
  });
};