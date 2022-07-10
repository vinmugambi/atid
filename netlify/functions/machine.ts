import { Customer, CustomerNumber } from "elarian";
import {
  AnyEventObject,
  assign,
  BaseActionObject,
  createMachine,
  interpret,
  ResolveTypegenMeta,
  ServiceMap,
  State,
  StateMachine,
  TypegenDisabled,
} from "xstate";
import { stateValuesEqual } from "xstate/lib/State";

export type CustomerHistory = {
  visitCount?: number;
  proposing?: [];
  opposing?: [];
  session?: string;
};

export type BetMachineContext = {
  customerNumber: CustomerNumber;
  history: CustomerHistory;
  message: string;
  proposition: object;
};

export type BetMachineState = State<
  BetMachineContext,
  AnyEventObject,
  any,
  { value: any; context: BetMachineContext },
  ResolveTypegenMeta<
    TypegenDisabled,
    AnyEventObject,
    BaseActionObject,
    ServiceMap
  >
>;

export class BetMachine {
  static Create(customer: Customer, history: CustomerHistory = {}) {
    let machine = betMachine;
    let startingState = betMachine.initialState;
    if (history.session) {
      startingState = BetMachine.Restore(history.session);
    } else {
      let context: BetMachineContext = {
        ...customer,
        history,
        message:
          "Welcome! Reply with: \n 1. To create a new proposition \n 2. Accept invitation \n 3. My propositions",
        proposition: {},
      };

      machine = machine.withContext(context);
    }

    return interpret(betMachine)
      .onTransition(function (state) {
        console.log(state.value);
      })
      .start(startingState);
  }

  static Store(state: BetMachineState): CustomerHistory {
    return { ...state.context.history, session: JSON.stringify(state) };
  }

  static Restore(session: string): BetMachineState {
    let lastSession = JSON.parse(session);
    return State.create(lastSession);
  }
}

var betMachine = createMachine({
  id: "main",
  initial: "idle",
  context: {} as BetMachineContext,
  states: {
    idle: {
      on: {
        BEGIN: {
          target: "fanatic",
          // record that the user has used this service before
          actions: assign(function (context: BetMachineContext, event) {
            let newHistory = {
              ...context.history,
              visitCount: context.history.visitCount
                ? context.history.visitCount + 1
                : 1,
            };
            return { ...context, history: newHistory };
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
