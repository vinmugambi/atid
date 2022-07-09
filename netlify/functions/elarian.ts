import {
  Customer,
  Elarian,
  NotificationCallback,
  ReceivedMediaNotification,
} from "elarian";
import { interpret } from "xstate";
import { newMachineInstance } from "./machine";

const client = new Elarian({
  orgId: process.env.elarian_org_key || "el_org_eu_BM7X6M",
  appId: process.env.elarian_app_id || "el_app_Kf5IDU",
  apiKey:
    process.env.elarian_api_key ||
    "el_k_test_05a98e6c3b9d3fec3e76d8a043390088291e80a6e460aa8a4e9d03014ccb24b0",
});

export function start() {
  client
    .on("error", (err) => console.error(err))
    .on("connected", onConnected)
    .on("receivedTelegram", onReceivedTelegram)
    .connect();
}

async function onConnected() {
  console.log("connected");

  const me = new client.Customer({
    number: "+254703784709",
    provider: "cellular",
  });
}

export type AppData = {
  visitCount?: number;
  proposing?: [];
  opposing?: [];
};

function onReceivedTelegram(
  notification: ReceivedMediaNotification,
  customer: Customer,
  appData: AppData | undefined,
  callback: NotificationCallback | undefined
) {
  let betMachine = newMachineInstance(customer, appData);

  let betService = interpret(betMachine)
    .onTransition(function (state) {
      console.log(state.value);
    })
    .start();

  betService.send({ type: "BEGIN" });
  console.log(
    betService.state.context.message,
    JSON.stringify(Object.assign(customer, notification))
  );

  customer.sendMessage(
    { channel: "telegram", number: "peer" },
    { body: { text: betService.state.context.message } }
  );
}

start();

// https://medium.com/geekculture/orchestrating-serverless-from-serverless-bcdb751ddd6c
