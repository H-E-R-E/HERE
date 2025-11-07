
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  FC,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface User {
  id: string;
  name: string;
  email: string;
  pin: string | null
}

export interface AuthContextType {
  user: User | null;
  userToken: string | null;
  loading: boolean;
  signIn: (user: User, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Use undefined instead of null so we can throw a helpful error via a hook
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Convenience hook to avoid null checks everywhere
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

  useEffect(() => {
    // Load auth state on app start
    (async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("userToken"),
        ]);
        if (storedUser) setUser(JSON.parse(storedUser) as User);
        if (storedToken) setUserToken(storedToken);
      } catch (e) {
        console.error("Error loading auth state:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (userData: User, token: string) => {
    try {
      setUser(userData);
      setUserToken(token);
      await Promise.all([
        AsyncStorage.setItem("user", JSON.stringify(userData)),
        AsyncStorage.setItem("userToken", token),
      ]);
    } catch (e) {
      console.error("Error during signIn:", e);
      throw e;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setUserToken(null);
      await Promise.all([
        AsyncStorage.removeItem("user"),
        AsyncStorage.removeItem("userToken"),
      ]);
    } catch (e) {
      console.error("Error during signOut:", e);
      throw e;
    }
  };

  const value: AuthContextType = {
    user,
    userToken,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
