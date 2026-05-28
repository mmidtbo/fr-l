import axios, { type AxiosResponse } from "axios";

export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

const api = axios.create({
  baseURL: import.meta.env.VITE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("interceptors response");
    return response.data;
  },
  (error) => {
    // Handle 401: token invalid/expired
    if (error.response?.status === 401) {
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      // window.location.href = "/login";
    }

    // Extract pesan error
    const message =
      error.response?.data?.message || error.message || "Terjadi kesalahan";
    return Promise.reject(new Error(message));
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
