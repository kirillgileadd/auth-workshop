import { useSyncExternalStore } from "react";
import { parseJwt } from "./lib/jwt";
import { BroadcastEvents } from "./lib/boardcast-events";

type Session = {
  userId: number;
  username: string;
};

const TOKEN_KEY = "token";

class SessionStore {
  public updateSessionSteam = new BroadcastEvents<
    | {
        type: "update";
        token: string;
      }
    | { type: "remove" }
  >(TOKEN_KEY);

  getSessionToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  setSessionToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.updateSessionSteam.emit({ type: "update", token });
  }

  removeSession() {
    console.log("rm session");
    localStorage.removeItem(TOKEN_KEY);
    this.updateSessionSteam.emit({ type: "remove" });
  }

  getSession() {
    return tokenToSession(this.getSessionToken());
  }

  isSessionExpired() {
    const session = this.getSession();
    return !session || Date.now() > session.exp * 1000;
  }

  useSession = () => {
    const token = useSyncExternalStore(
      this.updateSessionSteam.listen,
      this.getSessionToken,
      () => null,
    );

    return tokenToSession(token);
  };
}

const tokenToSession = (token: string | null) => {
  if (!token) return null;
  return parseJwt<Session>(token);
};

export const appSessionStore = new SessionStore();
