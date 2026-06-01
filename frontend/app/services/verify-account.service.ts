import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import { AxiosError } from "axios";

interface VerifyAccountResponse {
  success: boolean;
  message: string;
  token: string;
  token_type: string;
}

export const useVerifyAccount = () => {
  return useMutation<VerifyAccountResponse, AxiosError, void>({
    mutationFn: async () => {
      const res = await api.post("/auth/verify-account");
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Account verified", data.message);
    },
    onError: (err) => {
      console.log("Verification failed", err.response?.status);
    },
  });
};