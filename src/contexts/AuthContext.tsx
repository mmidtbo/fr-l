import api, { apiSafe } from "@/lib/api/axios";
import {
  AUTH_ME,
  LOGIN,
  LOGOUT,
  REGISTER,
  type SignOutResponse,
  type User,
  type UserResponse,
} from "@/lib/types";
import * as React from "react";
import { toast } from "sonner";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<string | { error: null | string }>;
  signUp: (
    email: string,
    password: string,
    role: "owner" | "karyawan",
  ) => Promise<string | { error: string | null }>;
  signOut: () => Promise<string | { error: null | string }>;
}

export const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const init = async () => {
      const response = await apiSafe.get<UserResponse>(AUTH_ME);

      if (response.data) {
        const desc = {
          id: response.data?.data.id,
          email: response.data?.data.email,
          role: response.data?.data.role,
        };
        setUser(desc);
      }
      setLoading(false);
    };
    init();
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<string | { error: null | string }> => {
    const response = await apiSafe.post<UserResponse>(LOGIN, {
      email,
      password,
    });
    if (response.error) {
      toast(
        response.error.includes("401")
          ? "Email atau password salah. Silakan coba lagi."
          : response.error,
      );
      return response.error;
    }
    if (!response.data) {
      toast("No data received from server");
      return { error: "No data received from server" };
    }
    const desc = {
      id: response.data?.data.id,
      email: response.data?.data.email,
      role: response.data?.data.role,
    };
    setUser(desc);
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    role: "owner" | "karyawan",
  ): Promise<string | { error: null | string }> => {
    const response = await apiSafe.post<UserResponse>(REGISTER, {
      email,
      password,
      role,
    });

    if (response.error) {
      toast(response.error);
      return response.error;
    }
    return { error: null };
  };

  const signOut = async (): Promise<string | { error: null | string }> => {
    const response: SignOutResponse = await api.delete(LOGOUT);

    if (!response.message) {
      toast("Unauthorized");
      return response.message;
    }

    setUser(null);
    return { error: null };
  };

  const value = React.useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
