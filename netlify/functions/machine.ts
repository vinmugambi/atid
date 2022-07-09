import { Customer } from "elarian";
import { AnyStateMachine, assign, createMachine } from "xstate";
import { AppData } from "./elarian";

export function newMachineInstance(
  customer: Customer,
  appData: AppData = {}
): AnyStateMachine {
  return createMachine({
    id: "main",
    initial: "idle",
    context: {
      message:
        "Welcome! Reply with: \n 1. To create a new proposition \n 2. Accept invitation \n 3. My propositions",
      proposition: {},
      appData,
    },
    states: {
      idle: {
        on: {
          BEGIN: {
            target: "fanatic",
            actions: assign({
              appData: (context, event) => {
                context.appData = {
                  ...context.appData,
                  visitCount: context.appData?.visitCount + 1 || 1,
                };
              },
            }),
          },
        },
      },
      fanatic: {
        initial: "selecting",
        states: {
          // validate
          selecting: {
            on: {
              PROPOSE: { target: "proposing" },
              ACCEPT_INVITATION: { target: "accepting" },
              LIST: { target: "listing" },
            },
          },
          proposing: {
            initial: "proposition",
            states: {
              proposition: {
                on: { PROPOSITION: "settlementDate" },
              },
              settlementDate: { on: { SETTLEMENT_DATE: "stake" } },
              stake: { on: { STAKE: "committing" } },
              committing: { on: { COMMITTED: "created" } },
              created: { type: "final" },
            },
          },
          accepting: {
            initial: "proposition",
            states: {
              proposition: { on: { PROPOSITION: "confirming" } },
              confirming: { on: { CONFIRMATION: "committing" } },
              committing: { on: { COMMITTED: "accepted" } },
              accepted: { type: "final" },
            },
          },
          listing: {
            initial: "showing",
            states: {
              showing: { on: { CLAIM: "claiming", CONCEDE: "conceding" } },
              claiming: { on: { CONFIRM: "status" } },
              conceding: { on: { CONFIRM: "status" } },
              disputing: { on: { DISPUTING: "status" } },
              status: { type: "final" },
            },
          },
        },
      },
    },
  });
}

function compare(str1: String, str2: String): boolean {
  return str1.toUpperCase() === str2.toUpperCase();
}
