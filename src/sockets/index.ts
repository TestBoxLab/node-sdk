import { ITestBoxTrialRequest } from "../payloads";
import TestBoxTrialRequest from "../trialRequest";
import { WebSocket } from "ws";
import { getConfigItem } from "../config";

const REQUEST_TRIAL = "request-trial";

interface TestBoxSocketWrapper<T> {
  event: string;
  data: T;
}

interface SocketTrialRequest
  extends TestBoxSocketWrapper<ITestBoxTrialRequest> {
  event: typeof REQUEST_TRIAL;
}

function isSocketTrialRequest(x: any): x is SocketTrialRequest {
  return (
    typeof x === "object" &&
    "event" in x &&
    typeof x.event === "string" &&
    typeof x.data === "object"
  );
}

export type TestBoxMessages = {
  [REQUEST_TRIAL]: SocketTrialRequest;
};

export type TestBoxHandlers = {
  [REQUEST_TRIAL]: (data: TestBoxTrialRequest) => Promise<void>;
};

let webSocket: WebSocket | undefined;
let eventHandlers: { [K in keyof TestBoxHandlers]?: TestBoxHandlers[K][] } = {};

function connect() {
  if (!webSocket || webSocket.readyState !== WebSocket.CLOSED) {
    return;
  }

  webSocket = new WebSocket(
    getConfigItem("webSocketUrl", "wss://partner-socket.testbox.com/")
  );

  webSocket.on("message", async function (data) {
    const rawMessage = JSON.parse(data.toString("utf-8"));

    if (!isSocketTrialRequest(rawMessage)) {
      console.error("Received an invalid message from TestBox");
      return;
    }

    const handlers = eventHandlers[rawMessage.event];
    if (!handlers) {
      console.warn("No handler defined for event: ", rawMessage.event);
      return;
    }

    if (rawMessage.event === "request-trial") {
      await Promise.allSettled(
        handlers.map((handler) =>
          handler(new TestBoxTrialRequest(rawMessage.data))
        )
      );
    }
  });

  webSocket.on("error", function () {});

  webSocket.on("close", function () {
    setTimeout(connect, getConfigItem("websocketReconnectInterval", 10) * 1000);
  });
}

export function on<K extends keyof TestBoxHandlers>(
  event: keyof TestBoxHandlers,
  handler: TestBoxHandlers[K]
) {
  if (event in eventHandlers) {
    eventHandlers[event].push(handler);
  } else {
    eventHandlers[event] = [handler];
  }
  connect();
}
