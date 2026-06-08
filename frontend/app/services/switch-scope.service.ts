import { useMutation } from "@tanstack/react-query";
import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AxiosError } from "axios";

interface SwitchScopeResponse {
  new_access_token: string;
  new_scope: string;
  message: string;
}

export const useSwitchScope = () => {
  return useMutation<SwitchScopeResponse, AxiosError>({
    mutationFn: async () => {
      const res = await api.post<SwitchScopeResponse>("/auth/switch-scope");
      await AsyncStorage.setItem("token", res.data.new_access_token);
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.new_access_token}`;

      return res.data;
    },
    onSuccess: (data) => {
      console.log(`Scope switched to: ${data.new_scope}`);
    },
    onError: (err) => {
      console.error("Failed to switch scope", err);
    }
  });
};