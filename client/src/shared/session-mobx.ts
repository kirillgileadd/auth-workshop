import { makeAutoObservable, reaction } from "mobx";
import { parseJwt } from "@/shared/lib/jwt.ts";
import { BroadcastEvents } from "@/shared/lib/broadcast-enents-mobx.ts";
import { useEffect } from "react";

type Session = {
  userId: number;
  username: string;
};

type SessionEvent =
  | {
      type: "update";
      token: string;
    }
  | { type: "remove" };

const TOKEN_KEY = "token";

class SessionStore {
  updateSessionSteam = new BroadcastEvents<SessionEvent>(TOKEN_KEY);

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getSession() {
    return tokenToSession(this.getSessionToken());
  }

  getSessionToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  setSessionToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.updateSessionSteam.emit({ type: "update", token });
  }

  removeSession() {
    localStorage.removeItem(TOKEN_KEY);
    this.updateSessionSteam.emit({ type: "remove" });
  }

  isSessionExpired() {
    const session = this.getSession();
    return !session || Date.now() > session.exp * 1000;
  }

  useToken(callback: (event: SessionEvent | null) => void) {
    useEffect(() => {
      const dispose = reaction(
        () => appSessionStore.updateSessionSteam.lastEvent,
        (newEvent) => {
          callback(newEvent);
        },
      );
      return () => dispose();
    }, []);
  }
}

const tokenToSession = (token: string | null) => {
  if (!token) return null;
  return parseJwt<Session>(token);
};

export const appSessionStore = new SessionStore();
