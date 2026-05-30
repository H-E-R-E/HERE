import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance, RawAxiosRequestHeaders } from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL

console.log("Base URL is this:", API_URL);

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  } as RawAxiosRequestHeaders,
});


api.interceptors.request.use(async (config) => {
  try {
    // Log the endpoint being hit
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);

    if (!config.url?.includes("auth/") || config.url?.includes("auth/activate-account")) {
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

if (config.url?.includes("auth/") && !config.url?.includes("auth/activate-account") && config.headers.Authorization) {
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


