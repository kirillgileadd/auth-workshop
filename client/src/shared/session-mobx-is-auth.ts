import { autorun, makeAutoObservable } from "mobx";
import { parseJwt } from "@/shared/lib/jwt.ts";
import { useEffect } from "react";

type Session = {
  userId: number;
  username: string;
};

const TOKEN_KEY = "token";

class SessionStore {
  token: string | null = localStorage.getItem(TOKEN_KEY);

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getSession() {
    return tokenToSession(this.token);
  }

  getSessionToken() {
    return this.token;
  }

  setSessionToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.token = token;
  }

  removeSession() {
    localStorage.removeItem(TOKEN_KEY);
    this.token = null;
  }

  isSessionExpired() {
    const session = this.getSession();
    return !session || Date.now() > session.exp * 1000;
  }

  useToken(callback: (token: string | null) => void) {
    useEffect(() => {
      const dispose = autorun(() => {
        callback(this.token);
      });
      return () => dispose();
    }, []);
  }
}

const tokenToSession = (token: string | null) => {
  if (!token) return null;
  return parseJwt<Session>(token);
};

export const appSessionStore = new SessionStore();
