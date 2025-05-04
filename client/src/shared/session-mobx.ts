import { makeAutoObservable } from "mobx";
import { parseJwt } from "@/shared/lib/jwt.ts";
import { BroadcastEvents } from "@/shared/lib/boardcast-events.ts";

type Session = {
  userId: number;
  username: string;
};

const TOKEN_KEY = "token";

class SessionStore {
  token: string | null = localStorage.getItem(TOKEN_KEY);
  updateSessionSteam = new BroadcastEvents<
    | {
        type: "update";
        token: string;
      }
    | { type: "remove" }
  >(TOKEN_KEY);

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
    this.updateSessionSteam.emit({ type: "update", token });
  }

  removeSession() {
    localStorage.removeItem(TOKEN_KEY);
    this.token = null;
    this.updateSessionSteam.emit({ type: "remove" });
  }

  isSessionExpired() {
    const session = this.getSession();
    return !session || Date.now() > session.exp * 1000;
  }
}
const tokenToSession = (token: string | null) => {
  if (!token) return null;
  return parseJwt<Session>(token);
};

export const appSessionStore = new SessionStore();
