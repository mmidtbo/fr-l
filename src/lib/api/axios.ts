import axios, { type AxiosResponse } from "axios";
import { REFRESH } from "../types";
import { toast } from "sonner";
import { queryClient } from "../queryClient";

export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

const api = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const refreshApi = axios.create({
  timeout: 10000,
  withCredentials: true,
});

// login gagal, cek sesi awal, dan refresh.
function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes("/auth/login") || url.includes("/token/refresh");
}

function extractErrorMessage(error: any): string {
  const data = error.response?.data;
  if (data?.errors) {
    return Array.isArray(data.errors)
      ? data.errors
          .map((e: { message?: string }) => e?.message)
          .filter(Boolean)
          .join(", ") || "Terjadi kesalahan"
      : String(data.errors);
  }
  return error.message || "Terjadi kesalahan";
}

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401: token invalid/expired
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        await refreshApi.get(REFRESH);
        return api(originalRequest);
      } catch {
        queryClient.setQueryData(["auth_user"], null);
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
        return Promise.reject(new Error("Unauthorized"));
      }
    }

    return Promise.reject(new Error(extractErrorMessage(error)));
  },
);

export async function safeRequest<T>(
  request: Promise<T>,
): Promise<ApiResult<T>> {
  try {
    const data = await request;
    return {
      data,
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || "Unknown error",
    };
  }
}

export const apiSafe = {
  get: <T>(url: string) => safeRequest<T>(api.get(url)),
  post: <T>(url: string, data: any) => safeRequest<T>(api.post(url, data)),
  put: <T>(url: string, data: any) => safeRequest<T>(api.put(url, data)),
  delete: <T>(url: string) => safeRequest<T>(api.delete(url)),
};

export default api;
