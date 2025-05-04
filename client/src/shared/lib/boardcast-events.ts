import { useEffect } from "react";

export class BroadcastEvents<M> {
  private listeners: Set<(event: M) => void> = new Set();
  private boardcast: BroadcastChannel;

  constructor(channel: string) {
    this.boardcast = new BroadcastChannel(channel);

    this.boardcast.onmessage = (message) => {
      this.listeners.forEach((listener) => listener(message.data));
    };
  }

  listen = (callback: (event: M) => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  emit = (event: M) => {
    this.boardcast.postMessage(event);
    this.listeners.forEach((listener) => listener(event));
  };

  useEvent = (listener: (event: M) => void) => {
    useEffect(() => {
      return this.listen(listener);
    }, []);
  };
}
