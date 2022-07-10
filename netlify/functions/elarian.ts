import {
  Customer,
  Elarian,
  NotificationCallback,
  ReceivedMediaNotification,
} from "elarian";
import { BetMachine, CustomerHistory } from "./machine";

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
}

function onReceivedTelegram(
  _notification: ReceivedMediaNotification,
  customer: Customer,
  appData: CustomerHistory | undefined,
  callback: NotificationCallback | undefined
) {
  let betService = BetMachine.Create(customer, appData);
  betService.send({ type: "BEGIN" });

  // customer.sendMessage(
  //   { channel: "telegram", number: "peer" },
  //   { body:  }
  // );

  if (callback) {
    let newAppData = BetMachine.Store(betService.state);
    callback({ text: betService.state.context.message }, newAppData);
  }
}

function BettingBot(channel: string) {
  function askNextQuestion() {}
  function startSession() {}

  return {
    startSession,
    askNextQuestion,
  };
}

start();
