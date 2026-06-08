import AsyncStorage from '@react-native-async-storage/async-storage';
import * as jwtDecode from 'jwt-decode';

type TokenScope = 'access' | 'host';

export async function ensureScope(requiredScope: TokenScope, switchScope: () => Promise<any>) {
  try {
    console.log(`[ensureScope] Checking token scope requirement: ${requiredScope}`);
    
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      console.warn("[ensureScope] No token found in AsyncStorage");
      return;
    }
    
    const payload = jwtDecode.jwtDecode<{ scope: string }>(token);
    console.log(`[ensureScope] Current token scope: ${payload.scope}`);
    
    if (payload.scope !== requiredScope) {
      console.log(`[ensureScope] Scope mismatch (${payload.scope} != ${requiredScope}). Initiating scope switch...`);
      await switchScope();
      console.log("[ensureScope] Scope switch completed successfully");
    } else {
      console.log(`[ensureScope] Scope already correct: ${requiredScope}`);
    }
  } catch (error) {
    console.error("[ensureScope] Error during scope check:", error);
    throw error;
  }
}