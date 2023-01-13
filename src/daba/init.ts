import Daba from "./index";

const SOCKET_URL = "ws://localhost:8080/ws-daba";

Daba.createInstance(SOCKET_URL, true);

export const getDabaInstance = Daba.getInstance;
