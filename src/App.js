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

function QuestionScreen({ currentState, onClickGood, onClickBad, onClose }) {
  return (
    <Screen>
      {currentState.context.dog ? (
        <img src={currentState.context.dog} height={200} alt="dog" />
      ) : null}
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
          {currentState.context.error ? (
            <div style={{ color: "red" }}>{currentState.context.error}</div>
          ) : null}
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
        <div>
          Submitting... <button title="close" type="button" onClick={onClose} />
        </div>
      ) : null}
    </Screen>
  );
}

function ThanksScreen({ currentState, onClose }) {
  const { message } = currentState.context.feedback;
  return (
    <Screen>
      <header>Thanks for your feedback: {message}</header>
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
          target: "loading",
          actions: "updateResponse",
          cond: "formValid"
        }
      }
    },
    loading: {
      invoke: {
        id: "submitForm",
        src: "feedbackService",
        onDone: {
          target: "submitted",
          actions: assign({
            feedback: (_, e) => e.data
          })
        },
        onError: {
          target: "pending",
          actions: assign({
            error: (_, event) => event.data.message
          })
        }
      },
      on: {
        SUCCESS: "submitted",
        FAILURE: "error"
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
      response: "",
      feedback: undefined,
      dog: undefined
    },
    states: {
      question: {
        invoke: {
          src: "dogFetcher",
          onDone: {
            actions: assign({
              dog: (_, e) => e.data.message
            })
          }
        },
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
        on: {
          CLOSE: "closed"
        },
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
    },
    services: {
      dogFetcher: () =>
        fetch("https://dog.ceo/api/breeds/image/random").then(data =>
          data.json()
        ),
      feedbackService: (context, event) =>
        new Promise((resolve, reject) => {
          setTimeout(() => {
            const error = Math.random() < 0.5;
            if (error) {
              reject({
                message: "Something went wrong"
              });
            } else {
              resolve({
                timestamp: Date.now(),
                message: "Feedback: " + context.response
              });
            }
          }, 1500);
        })
    }
  }
);

export function Feedback() {
  const [current, send] = useMachine(feedbackMachine);

  return (
    <>
      {current.matches("question") ? (
        <QuestionScreen
          currentState={current}
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
        <ThanksScreen currentState={current} onClose={() => send("CLOSE")} />
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
