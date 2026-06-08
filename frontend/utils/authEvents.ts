import { EventEmitter } from "eventemitter3";
import AsyncStorage from "@react-native-async-storage/async-storage";
export const authEvents = new EventEmitter();
export const AUTH_EXPIRED = "auth:expired";

let isHandlingExpiry = false;

export const emitAuthExpired = async () => {
  if (isHandlingExpiry) return;
  isHandlingExpiry = true;
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
  authEvents.emit(AUTH_EXPIRED);
  // reset after a delay so it can fire again on next app session
  setTimeout(() => { isHandlingExpiry = false; }, 3000);
};