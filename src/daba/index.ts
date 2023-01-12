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
  private static subs: Array<DabaSub> = [];
  private static withLogs = false;
  private static isConnected = false;
  private static client: Client;

  constructor(brokerURL: string, withLogs = false, conf?: StompConfig) {
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
  }

  /*
   * private methods
   */
  private static onConnected() {
    Daba.isConnected = true;
    conditionalLog(Daba.withLogs, "Daba: connected");
    Daba.subs = Daba.subs.map(Daba.finishSubWhenConnected);
  }
  private static onDisconnected() {
    Daba.isConnected = false;
    conditionalLog(Daba.withLogs, "Daba: disconnected");
  }
  private static finishSubWhenConnected = (sub: DabaSub) => {
    if (Daba.isConnected && !sub.isDone) {
      const { unsubscribe } = Daba.client.subscribe(sub.topic, (message) => {
        conditionalLog(Daba.withLogs, "Daba: message received!");
        sub.callback(message);
      });
      conditionalLog(Daba.withLogs, "Daba: trial succeed for id", sub.id);
      return { ...sub, unsubscribe, isSubbed: true };
    }
    return sub;
  };

  /*
   * public methods
   */
  subscribe = (topic: string, callback: (message: any) => void): string => {
    const id = Math.random().toString(36).substring(7);
    let newSub: DabaSub = { id, topic, callback, isDone: false };

    conditionalLog(Daba.withLogs, "Daba: new sub trial for id: ", id);
    newSub = Daba.finishSubWhenConnected(newSub);
    Daba.subs.push(newSub);
    return id;
  };

  unsubscribe = (id: string): string => {
    Daba.subs = Daba.subs.filter((sub: DabaSub) => {
      if (sub.id === id) {
        conditionalLog(Daba.withLogs, "Daba: unsubscribing from id", sub.id);
        sub.unsubscribe?.();
        return false;
      }
      return true;
    });
    return "";
  };
}

/*
 * utility methods
 */
const conditionalLog = (hasLog: boolean, ...args: any[]) => {
  if (hasLog) {
    console.log(...args);
  }
};
