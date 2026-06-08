import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance, RawAxiosRequestHeaders } from "axios";
import { emitAuthExpired } from "../../utils/authEvents";

const API_URL = process.env.EXPO_PUBLIC_API_URL

console.log("Base URL is this:", API_URL);

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  } as RawAxiosRequestHeaders,
});


api.interceptors.request.use(async (config) => {
    const isAuthEndpoint = config.url?.includes("auth/");
    const isVerifyAccount = config.url?.includes("auth/verify-account");
    const isLogout = config.url?.includes("auth/logout");
    const isSwitchScope = config.url?.includes("auth/switch-scope");


  try {
    // Log the endpoint being hit
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);




    if (!isAuthEndpoint || isVerifyAccount || isLogout || isSwitchScope) {
      const token = await AsyncStorage.getItem("token");
      console.log(`Token found in storage:`, !!token);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`Authorization header set`);
      } else {
        console.log("No token found");
      }
    } else {
      console.log("Skipping token for auth endpoint");
    }

    const safeHeaders = { ...config.headers };
    if (safeHeaders.Authorization && typeof safeHeaders.Authorization === "string") {
      safeHeaders.Authorization = safeHeaders.Authorization.substring(0, 20) + "...";
    }
    console.log("Request headers:", safeHeaders);

    if (config.data) {
      console.log("Request data:", config.data);
    }
  } catch (e) {
    console.error("Token read error:", e);
  }

if (isAuthEndpoint && !isVerifyAccount && !isLogout && !isSwitchScope && config.headers.Authorization) {
  delete config.headers.Authorization;
}
  return config;
});

// Error interceptor to log failed requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "Unknown";
    const method = error.config?.method?.toUpperCase() || "Unknown";
    const status = error.response?.status || "No Response";
    
    console.error(`API Error: ${method} ${API_URL}${url} - Status: ${status}`);
    console.error(`Error details:`, error.message);
    
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.includes("auth/")) {
      await emitAuthExpired();
    }
    return Promise.reject(error);
  }
);


