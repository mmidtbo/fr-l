import { apiSafe } from "@/lib/api/axios";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: "owner" | "karyawan",
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
}

export const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading: loading } = useQuery({
    queryKey: ["auth_user"],
    queryFn: async () => {
      const response = await apiSafe.get<UserResponse>(AUTH_ME);
      if (response.data) {
        return {
          id: response.data.data.id,
          email: response.data.data.email,
          role: response.data.data.role,
          first_name: response.data.data.first_name ?? null,
          last_name: response.data.data.last_name ?? null,
        } as User;
      }
      return null;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const signIn = React.useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null }> => {
      const response = await apiSafe.post<UserResponse>(LOGIN, {
        email,
        password,
      });
      if (response.error) {
        return {
          error: response.error.includes("401")
            ? "Email atau password salah. Silakan coba lagi."
            : response.error,
        };
      }
      if (!response.data) {
        return { error: "No data received from server" };
      }
      const userData: User = {
        id: response.data.data.id,
        email: response.data.data.email,
        role: response.data.data.role,
        first_name: response.data.data.first_name ?? null,
        last_name: response.data.data.last_name ?? null,
      };
      queryClient.setQueryData(["auth_user"], userData);
      return { error: null };
    },
    [queryClient],
  );

  const signUp = React.useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      role: "owner" | "karyawan",
    ): Promise<{ error: string | null }> => {
      const response = await apiSafe.post<UserResponse>(REGISTER, {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
      });

      if (response.error) {
        return {
          error: response.error.includes("already")
            ? "Email sudah terdaftar."
            : response.error,
        };
      }
      return { error: null };
    },
    [],
  );

  const signOut = React.useCallback(async (): Promise<{
    error: string | null;
  }> => {
    const response = await apiSafe.delete<SignOutResponse>(LOGOUT);

    if (response.error) {
      return { error: response.error };
    }

    if (!response.data?.data) {
      return { error: "Logout gagal" };
    }

    queryClient.setQueryData(["auth_user"], null);
    // Hapus seluruh cache query agar data user sebelumnya (orders,
    // customers, reports, dll.) tidak bocor ke user berikutnya.
    queryClient.clear();
    return { error: null };
  }, [queryClient]);

  const value = React.useMemo(
    () => ({ user: user ?? null, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
