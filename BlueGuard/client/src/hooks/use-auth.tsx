import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type AuthUser } from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isAuthenticated: boolean;
  isAuthority: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("blueguard_user");
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("blueguard_user");
      }
    }
  }, []);

  const setUser = (user: AuthUser | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem("blueguard_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("blueguard_user");
    }
  };

  const value: AuthContextType = {
    user,
    setUser,
    isAuthenticated: !!user,
    isAuthority: user?.role === "authority",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
