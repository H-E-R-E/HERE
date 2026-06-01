import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import { AxiosError } from "axios";

interface VerifyOtpResponse {
  token: string;
  token_type: string;
  message: string;
}

interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export const useVerifyOtp = () => {
  return useMutation<VerifyOtpResponse, AxiosError, VerifyOtpPayload>({
    mutationFn: async ({ email, otp }: VerifyOtpPayload) => {
      const res = await api.post("/auth/verify-otp", { email, otp });
      return res.data;
    },
    onSuccess: (data) => {
      console.log("OTP verified successfully", data);
    },
    onError: (err) => {
      if (err.response?.status === 422) {
        console.log("Verification failed", "Invalid or expired OTP.");
      } else {
        console.log("Error", "Something went wrong. Please try again.");
      }
    },
  });
};


interface ResendOtpResponse {
  success: boolean;
  message: string;
}

interface ResendOtpPayload {
  email: string;
}

export const useResendOtp = () => {
  return useMutation<ResendOtpResponse, AxiosError, ResendOtpPayload>({
    mutationFn: async ({ email }: ResendOtpPayload) => {
      const res = await api.post("/auth/resend-otp", { email });
      return res.data;
    },
    onSuccess: (data) => {
      console.log("OTP resent successfully", data.message);
    },
    onError: (err) => {
      if (err.response?.status === 422) {
        console.log("Resend failed", "Invalid email address.");
      } else {
        console.log("Error", "Something went wrong. Please try again.");
      }
    },
  });
};