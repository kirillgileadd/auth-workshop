import axios from "axios";
import { appSessionStore } from "@/shared/session.ts";

let refreshPromise: Promise<string | null> | null = null;

const getRefreshToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const result = await publicApiClient.post<{ token: string }>(
          "/refresh",
        );
        appSessionStore.setSessionToken(result.data.token);
        return result.data.token;
      } catch (error) {
        appSessionStore.removeSession();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

export const publicApiClient = axios.create({
  baseURL: "/api",
});

export const authorizedApiClient = axios.create({
  baseURL: "/api",
});

authorizedApiClient.interceptors.request.use(async (config) => {
  let token = appSessionStore.getSessionToken();

  if (!token || appSessionStore.isSessionExpired()) {
    token = await getRefreshToken();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

authorizedApiClient.interceptors.response.use(
  (config) => config,
  async (error) => {
    const request = error.config;
    if (error.response.status === 401) {
      const token = appSessionStore.getSessionToken();

      if (token) {
        const newToken = await getRefreshToken();
        if (newToken) {
          return authorizedApiClient.request(request);
        }
      }
      appSessionStore.removeSession();
    }
    throw new Error();
  },
);
