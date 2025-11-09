import { create } from "zustand"

type SignUpState = {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    password: string;
    avatarUrl?: string;
    setField: (key: string, value: string) => void;
    reset: () => void;
}

export const useSignupStore = 
create<SignUpState>((set) => ({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    avatarUrl: "",
    setField: (key: string, value: string) => set({ [key]: value}),
    reset: () => set({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    avatarUrl: "",
    })}
))