import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { User } from "../../types/UserTypes";

const fetchProfile = async (): Promise<User> => {
  const response = await api.get("/users/me");
  return response.data;
};

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
  });
};