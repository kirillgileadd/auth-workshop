import { makeAutoObservable, runInAction } from "mobx";

export class BroadcastEvents<M> {
  lastEvent: M | null = null;
  private broadcastChannel: BroadcastChannel;

  constructor(channelName: string) {
    this.broadcastChannel = new BroadcastChannel(channelName);
    makeAutoObservable(this);

    this.broadcastChannel.onmessage = (message: MessageEvent<M>) => {
      runInAction(() => {
        this.lastEvent = message.data;
      });
    };
  }

  emit(event: M) {
    runInAction(() => {
      this.lastEvent = event;
    });
    this.broadcastChannel.postMessage(event);
  }
}
