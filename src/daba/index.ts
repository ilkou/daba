import { Client, messageCallbackType, StompConfig } from "@stomp/stompjs";

/*
 * Daba type
 */
type DabaSub = {
  id: string;
  topic: string;
  callback: messageCallbackType;
  isDone: boolean;
  unsubscribe?: Function;
};

/*
 * Daba class
 */
export default class Daba {
  private static instance: Daba;
  private static subs: Array<DabaSub> = [];
  private static withLogs = false;
  private static isConnected = false;
  private static client: Client;

  private constructor() {}

  /*
   * public methods
   */
  public static createInstance(
    brokerURL: string,
    withLogs = false,
    conf?: StompConfig
  ): Daba {
    if (Daba.instance) {
      throw new Error("Daba is already initiated");
    }
    Daba.instance = new Daba();
    if (!brokerURL) {
      throw new Error("Daba: brokerURL is required");
    }
    Daba.withLogs = withLogs;
    Daba.client = new Client({
      brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: Daba.onConnected,
      onDisconnect: Daba.onDisconnected,
      ...(conf || {}),
    });
    Daba.client.activate();
    return Daba.instance;
  }
  public static getInstance() {
    if (!Daba.instance) {
      throw new Error("Daba is not initiated");
    }
    return Daba.instance;
  }

  subscribe = (topic: string, callback: (message: any) => void): string => {
    const id = Math.random().toString(36).substring(7);
    let newSub: DabaSub = { id, topic, callback, isDone: false };

    Daba.log("new sub trial for id {", id, "}");
    newSub = Daba.finishSubWhenConnected(newSub);
    Daba.subs.push(newSub);
    return id;
  };

  unsubscribe = (id: string): string => {
    Daba.subs = Daba.subs.filter((sub: DabaSub) => {
      if (sub.id === id) {
        Daba.log("unsubscribing from id {", sub.id, "}");
        sub.unsubscribe?.();
        return false;
      }
      return true;
    });
    return "";
  };

  /*
   * private methods
   */
  private static onConnected() {
    Daba.isConnected = true;
    Daba.subs = Daba.subs.map(Daba.finishSubWhenConnected);
    Daba.log("connected");
  }
  private static onDisconnected() {
    Daba.isConnected = false;
    Daba.log("disconnected");
  }
  private static finishSubWhenConnected = (sub: DabaSub) => {
    if (Daba.isConnected && !sub.isDone) {
      const { unsubscribe } = Daba.client.subscribe(sub.topic, (message) => {
        Daba.log("message received: ", message);
        sub.callback(message);
      });
      Daba.log("trial succeed for id {", sub.id, "}");
      return { ...sub, unsubscribe, isSubbed: true };
    }
    return sub;
  };
  private static log = (...args: any[]) => {
    if (Daba.withLogs) {
      console.log("Daba:", ...args);
    }
  };
}
