import { useMutation } from "@tanstack/react-query"
import { api } from "./api"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { AxiosError } from "axios";

export const useLogin = () => {
    interface LoginResponse {
        access_token: string;
        id: string; 
        email: string; 
        username: string
        }


    return useMutation<LoginResponse, AxiosError, { identifier: string; password: string }>({
      mutationFn: async({identifier, password}: {identifier: string, password: string}) => {
        const res = await api.post("/auth/login", {identifier, password});
        AsyncStorage.setItem("token", res.data.access_token);

        return res.data; 
      },
      onSuccess: (data) => {
        console.log("Successfully logged in,", data)
      },
      onError: (err) => {
        if (err.response?.status === 401) {
          console.log("Login failed", "Incorrect username or password.");
        } else {
          console.log("Error", "Something went wrong. Please try again.");
        }
      }
      
    })
}