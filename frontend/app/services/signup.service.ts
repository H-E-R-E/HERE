import { useMutation } from "@tanstack/react-query"
import { api } from "./api"
import { useSignupStore } from "../../data/signUpStore";



export const useRegister = () => {
    //This picture is just a placeholder till we can actually put in good stuff.
    const AVATAR_URL = "https://images.unsplash.com/photo-1760624876351-1fb12fc9c5c3?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwzNHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=60&w=500"

 return useMutation({
    mutationFn: async() => {
        const { email, password, first_name, last_name, username } = 
        useSignupStore.getState();
        const res = await api.post("/users/signup", {
            avatar_url: AVATAR_URL,
            email,
            first_name,
            last_name,
            password,
            username,
            
        })
        return res.data
    },

    onSuccess: (res) => {
      console.log("Registration successful:", res);
      
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
    },
})
}


