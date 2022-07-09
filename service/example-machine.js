import { createMachine } from "xstate";
import { assign } from "xstate/lib/actions";

export const regimens = [
  {
    name: "Tabata regimen",
    warmup: 0,
    run: 20,
    rest: 10,
    vo2max: 170,
    cycles: 8,
  },
  {
    name: "Gibala regimen",
    warmup: 180,
    run: 60,
    rest: 75,
    vo2max: 95,
    cycles: 8,
  },
  {
    name: "Zuniga regimen",
    warmup: 0,
    run: 30,
    rest: 30,
    vo2max: 90,
    cycles: 10,
  },
  {
    runTrigger: "ACCELERATE",
    name: "Vollaard regimen",
    warmup: 0,
    run: 20,
    cycles: 2,
    vo2max: 100,
    length: 600,
  },
  {
    name: "Peter Coe Regimen",
    restTrigger: "DISTANCE_200",
    warmup: 0,
    distance: 200,
    rest: 30,
    cycles: 8,
  },
];

function validate(name) {
  return (
    name &&
    regimens.some(function (regimen) {
      return regimen.name.toLowerCase() === name.toLowerCase();
    })
  );
}

function getRegimen(name) {
  let found = regimens.find(
    (regimen) => regimen.name.toLowerCase() === name.toLowerCase()
  );
  return name && found;
}

export const hiitTimerMachine = createMachine(
  {
    id: "HIIT-timer",
    initial: "selecting",
    context: {
      regimen: null,
      errorMessage: null,
      completedCycles: 0,
    },
    states: {
      selecting: {
        initial: "idle",
        states: {
          idle: {
            on: {
              SELECT_REGIMEN: {
                target: "validating",
              },
            },
          },
          validating: {
            invoke: {
              id: "validate",
              src: async function (_, event) {
                return validateRegimen(event.name);
              },
              onDone: { target: "selected" },
              onError: "invalid",
            },
          },
          invalid: {
            entry: assign({
              errorMessage: function (_, event) {
                return event.data.message;
              },
            }),
            on: { SELECT_REGIMEN: "validating" },
          },
          selected: {
            entry: assign({
              regimen: function (_, event) {
                return event.data;
              },
            }),
            initial: "waiting",
            states: {
              waiting: {
                on: { START_SESSION: "warmingup" },
              },
              warmingup: {
                after: { WARMING_UP_TIME: "steady" },
              },
              steady: {
                always: [
                  {
                    cond: (context) => !context.regimen.runTrigger,
                    target: "running",
                  },
                ],
                on: {
                  ACCELERATE: {
                    target: "running",
                    cond: (context) =>
                      context.regimen.runTrigger === "ACCELERATE",
                  },
                },
              },
              running: {
                after: [
                  {
                    delay: "RUNNING_TIME",
                    target: "resting",
                    cond: (context) =>
                      !context.regimen.restTrigger && context.regimen.rest,
                  },
                  {
                    delay: "RUNNING_TIME",
                    target: "steady",
                    cond: (context) => !context.regimen.rest,
                  },
                ],
                on: {
                  DISTANCE_200: {
                    target: "resting",
                    cond: (context) =>
                      context.regimen?.restTrigger === "DISTANCE_200",
                  },
                },
                exit: assign({
                  completedCycles: function (context) {
                    return context.completedCycles + 1;
                  },
                }),
              },
              resting: {
                after: [
                  {
                    delay: "RESTING_TIME",
                    target: "complete",
                    cond: function (context) {
                      return context.completedCycles >= context.regimen.cycles;
                    },
                  },
                  {
                    delay: "RESTING_TIME",
                    target: "running",
                    cond: function (context) {
                      return context.completedCycles < context.regimen.cycles;
                    },
                  },
                ],
                on: {
                  ACCELERATE: {
                    cond: (context) =>
                      context.regimen.runTrigger === "ACCELERATE",
                    target: "running",
                  },
                },
              },
              complete: {
                type: "final",
              },
            },
          },
        },
      },
    },
  },
  {
    delays: {
      WARMING_UP_TIME: function (context) {
        return toMilliseconds(context.regimen.warmup) || 0;
      },
      RUNNING_TIME: function (context) {
        return toMilliseconds(context.regimen.run) || 0;
      },
      RESTING_TIME: function (context) {
        return toMilliseconds(context.regimen.rest) || 0;
      },
    },
  }
);

function toMilliseconds(timeInSeconds) {
  return timeInSeconds * 1000;
}

function compare(str1, str2) {
  return str1.toUpperCase() === str2.toUpperCase();
}

function findRegimenByName(name) {
  return regimens.find((regimen) => compare(regimen.name, name));
}

async function validateRegimen(name) {
  try {
    if (!name) throw new UnknownRegimenError();
    let result = findRegimenByName(name);
    if (!result) throw new UnknownRegimenError();
  } catch (e) {
    return Promise.reject(e.message);
  }

  function UnknownRegimenError() {
    this.name = "UnknownRegimen";
    this.message = "Select one among the listed regimens";
  }
  UnknownRegimenError.prototype = new Error();
}
