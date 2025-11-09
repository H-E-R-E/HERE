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
  signIn: (user: User, token: string) => Promise<void>;
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

  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("userToken"),
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
      console.log("Fetching user profile...");
      const result = await refetchProfile();
      if (result.data) {
        console.log("Profile fetched successfully:", result.data.username);
        setUser((prev) => {
          const merged = { ...prev, ...result.data };
          AsyncStorage.setItem("user", JSON.stringify(merged));
          return merged as User;
        });
      } else {
        console.warn("No profile data returned from server");
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
    }
  };

  const signIn = async (userData: User, token: string) => {
    try {
      console.log("AuthProvider.signIn:", userData.username);
      
      // Set partial user data from login
      setUser(userData);
      setUserToken(token);

      await Promise.all([
        AsyncStorage.setItem("user", JSON.stringify(userData)),
        AsyncStorage.setItem("userToken", token),
      ]);

      // Fetch complete profile in background (non-blocking)
      fetchUserProfile();
    } catch (e) {
      console.error("Error during signIn:", e);
      throw e;
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out...");
      setUser(null);
      setUserToken(null);
      await Promise.all([
        AsyncStorage.removeItem("user"),
        AsyncStorage.removeItem("userToken"),
      ]);
    } catch (e) {
      console.error("Error during signOut:", e);
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