import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AppEvent } from "../../types/EventTypes";
import { api } from "./api";


interface SwitchScopeResponse {
  "message": "string",
  "new_access_token": "string",
  "new_scope": "string"
}



export const useSwitchScope = () => {
    return useMutation<SwitchScopeResponse, AxiosError, AppEvent>({
        mutationFn: async() => {
        const res = await api.post("/auth/switch_scope");
        return res.data;
        },

        onSuccess: (data) => {
            console.log("Event successfully created,", data)
        },
        onError: (err)  => {
        if (err.response?.status === 401) {
          console.log("Invalid auth token");
        } else {
            console.log(err.response);
          console.log("Error", "Something went wrong. Please try again.");
        }
        }
    })
}