import { publicApiClient } from "./client-axios.ts";
import { appSessionStore } from "@/shared/session-mobx.ts";
// import { appSessionStore } from "@/shared/session-mobx-is-auth.ts";

export interface User {
  username: string;
  token: string;
}

export const register = async (username: string, password: string) => {
  const response = await publicApiClient.post<{ token: string }>("/register", {
    username,
    password,
  });

  if (response.data.token) {
    appSessionStore.setSessionToken(response.data.token);
  }

  return response;
};

export const login = async (username: string, password: string) => {
  const response = await publicApiClient.post<{ token: string }>("/login", {
    username,
    password,
  });

  if (response.data.token) {
    appSessionStore.setSessionToken(response.data.token);
  }

  return response;
};

export const logout = async () => {
  const response = await publicApiClient.post<{ token: string }>("/logout");
  appSessionStore.removeSession();

  return response;
};
