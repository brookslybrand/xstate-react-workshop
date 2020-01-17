import React, { useState } from "react";
import { Machine, assign } from "xstate";
import { useMachine } from "@xstate/react";

function Screen({ children, onSubmit = undefined }) {
  if (onSubmit) {
    return (
      <form onSubmit={onSubmit} className="screen">
        {children}
      </form>
    );
  }

  return <section className="screen">{children}</section>;
}

function QuestionScreen({ onClickGood, onClickBad, onClose }) {
  return (
    <Screen>
      <header>How was your experience?</header>
      <button onClick={onClickGood} data-variant="good">
        Good
      </button>
      <button onClick={onClickBad} data-variant="bad">
        Bad
      </button>
      <button title="close" onClick={onClose} />
    </Screen>
  );
}

function FormScreen({ currentState, onSubmit, onClose }) {
  const [response, setResponse] = useState("");

  return (
    <Screen
      onSubmit={e => {
        e.preventDefault();
        onSubmit(response);
      }}
    >
      {currentState.matches({ form: "pending" }) ? (
        <>
          <header>Care to tell us why?</header>
          <textarea
            name="response"
            placeholder="Complain here"
            onKeyDown={e => {
              if (e.key === "Escape") {
                e.stopPropagation();
              }
            }}
            value={response}
            onChange={e => setResponse(e.target.value)}
          />
          <button>Submit</button>
          <button title="close" type="button" onClick={onClose} />
        </>
      ) : currentState.matches({ form: "loading" }) ? (
        <div>Submitting...</div>
      ) : null}
    </Screen>
  );
}

function ThanksScreen({ response = "", onClose }) {
  return (
    <Screen>
      <header>Thanks for your feedback: {response}</header>
      <button title="close" onClick={onClose} />
    </Screen>
  );
}

const formConfig = {
  initial: "pending",
  states: {
    pending: {
      on: {
        SUBMIT: {
          target: "loading", // add guard
          actions: "updateResponse",
          cond: "formValid"
        }
      }
    },
    loading: {
      on: {
        SUCCESS: "submitted",
        FAILURE: "error"
      },
      after: {
        2000: "submitted"
      }
    }, // handle SUCCESS
    submitted: {
      type: "final"
    },
    error: {}
  }
};

const feedbackMachine = Machine(
  {
    initial: "question",
    context: {
      response: ""
    },
    states: {
      question: {
        activities: "pinging",
        on: {
          GOOD: {
            target: "thanks",
            actions: "logGood"
          },
          BAD: "form",
          CLOSE: "closed"
        },
        onExit: ["logExit"]
      },
      form: {
        ...formConfig,
        onDone: "thanks"
      },
      thanks: {
        onEntry: "logEntered",
        on: {
          CLOSE: "closed"
        }
      },
      closed: {}
    }
  },
  {
    activities: {
      pinging: (ctx, e) => {
        const i = setInterval(() => {
          console.log("ping!" + Date.now());
        }, 1000);

        return () => {
          clearInterval(i);
        };
      }
    },
    actions: {
      logExit: (context, event) => {},
      alertInvalid: () => {
        alert("You did not fill out the form!!");
      },
      updateResponse: assign({
        response: (ctx, e) => e.value
      })
    },
    guards: {
      formValid: (context, event) => {
        return event.value.length > 0;
      }
    }
  }
);

export function Feedback() {
  const [current, send] = useMachine(feedbackMachine);

  return (
    <>
      {current.matches("question") ? (
        <QuestionScreen
          onClickGood={() => send("GOOD")}
          onClickBad={() => send("BAD")}
          onClose={() => send("CLOSE")}
        />
      ) : current.matches("form") ? (
        <FormScreen
          currentState={current}
          onSubmit={value => send({ type: "SUBMIT", value })}
          onClose={() => send("CLOSE")}
        />
      ) : current.matches("thanks") ? (
        <ThanksScreen
          response={current.context.response}
          onClose={() => send("CLOSE")}
        />
      ) : current.matches("closed") ? null : null}
    </>
  );
}

export function App() {
  return (
    <main className="app">
      <Feedback />
    </main>
  );
}

export default App;
