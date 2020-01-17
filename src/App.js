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

function FormScreen({ onSubmit, onClose }) {
  const [response, setResponse] = useState("");

  return (
    <Screen
      onSubmit={e => {
        e.preventDefault();
        onSubmit(response);
      }}
    >
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
    </Screen>
  );
}

function ThanksScreen({ onClose }) {
  return (
    <Screen>
      <header>Thanks for your feedback.</header>
      <button title="close" onClick={onClose} />
    </Screen>
  );
}

const feedbackMachine = Machine(
  {
    id: "feedbackMachine",
    initial: "question",
    context: {
      response: ""
    },
    states: {
      question: {
        on: {
          GOOD: "thanks",
          BAD: "form",
          CLOSE: "closed"
        },
        onExit: ["logExit"]
      },
      form: {
        on: {
          SUBMIT: {
            target: "thanks",
            actions: assign({
              response: (context, event) => event.value
            })
          },
          CLOSE: "closed"
        }
      },
      thanks: {
        on: {
          CLOSE: "closed"
        }
      },
      closed: {
        type: "final"
      }
    }
  },
  {
    actions: {
      logExit: (context, event) => {
        console.log("exited", event);
      }
    }
  }
);

export function Feedback() {
  const [current, send] = useMachine(feedbackMachine);

  console.log(current.context);

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
          onSubmit={value => send({ type: "SUBMIT", value })}
          onClose={() => send("CLOSE")}
        />
      ) : current.matches("thanks") ? (
        <ThanksScreen onClose={() => send("CLOSE")} />
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
