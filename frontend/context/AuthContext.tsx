import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  FC,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfile } from "../app/services/profile.service";
import { useLogout } from "../app/services/logout.service";
import { useRouter } from "expo-router";
import { authEvents, AUTH_EXPIRED } from "../utils/authEvents";
import { router } from "expo-router";

export type User = {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
};

export interface AuthContextType {
  user: User | null;
  userToken: string | null;
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { refetch: refetchProfile } = useProfile();
  const { mutateAsync: logout } = useLogout();

  const router = useRouter();

  useEffect(() => {
  const handleAuthExpired = () => {
    console.log("Auth expired event received, signing out...");
    setUser(null);
    setUserToken(null);

  };

  authEvents.on(AUTH_EXPIRED, handleAuthExpired);
  return () => {
    authEvents.off(AUTH_EXPIRED, handleAuthExpired);
  };
}, []);

  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("token"),
        ]);

        if (storedToken) {
          console.log("AuthProvider: loaded stored token");
          setUserToken(storedToken);

          if (storedUser) {
            const parsed = JSON.parse(storedUser) as User;
            console.log("AuthProvider: loaded stored user:", parsed.username);
            setUser(parsed);
          }
          fetchUserProfile();
        } else {
          console.log("AuthProvider: no stored token found");
        }
      } catch (e) {
        console.error("Error loading auth state:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

const fetchUserProfile = async () => {
  try {
    const result = await refetchProfile();
    if (result.data) {
      setUser(result.data);
      await AsyncStorage.setItem("user", JSON.stringify(result.data));
    }
  } catch (e: any) {
    if (e?.response?.status === 401) {
      console.log("Session expired, signing out...");
      await signOut();
      router.replace("/(auth)/getstarted");
    } else {
      console.error("Error fetching user profile:", e);
    }
  }
};

  const signIn = async (token: string) => {
    try {
    setUserToken(token);
    await Promise.all([
      AsyncStorage.setItem("token", token),
    ]);
    await fetchUserProfile();

      } catch (e) {
        console.error("Error during signIn:", e);
        throw e;
      }
    };
const signOut = async () => {
  try {
    console.log("Signing out...");
    await logout(); // revoke token on server
  } catch (e) {
    console.warn("Logout API call failed, clearing local state anyway:", e);
  } finally {
    setUser(null);
    setUserToken(null);
    await Promise.all([
      AsyncStorage.removeItem("user"),
      AsyncStorage.removeItem("token"),
    ]);
  }
};
  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...userData };
    setUser(updated);
    await AsyncStorage.setItem("user", JSON.stringify(updated));
    console.log("User updated locally:", updated.username);
  };

  useEffect(() => {
    console.log("Auth state changed:", {
      username: user?.username,
      hasToken: !!userToken,
    });
  }, [user, userToken]);

  const value: AuthContextType = {
    user,
    userToken,
    loading,
    signIn,
    signOut,
    fetchUserProfile,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};