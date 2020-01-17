import React from "react";
import { Machine } from "xstate";
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
  return (
    <Screen
      onSubmit={e => {
        e.preventDefault();
        const { response } = e.target.elements;

        onSubmit({
          value: response
        });
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

const feedbackMachine = Machine({
  id: "feedbackMachine",
  initial: "question",
  on: {
    CLOSE: "closed"
  },
  states: {
    question: {
      on: {
        GOOD: "thanks",
        BAD: "form",
        CLOSE: "closed"
      }
    },
    form: {
      on: {
        SUBMIT: "thanks",
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
});

export function Feedback() {
  const [current, send] = useMachine(feedbackMachine);

  return (
    <>
      {current.value === "question" ? (
        <QuestionScreen
          onClickGood={() => send({ type: "GOOD" })}
          onClickBad={() => send({ type: "BAD" })}
          onClose={() => send({ type: "CLOSE" })}
        />
      ) : current.value === "form" ? (
        <FormScreen
          onSubmit={value => {
            send({ type: "SUBMIT" });
          }}
          onClose={() => send({ type: "CLOSE" })}
        />
      ) : current.value === "thanks" ? (
        <ThanksScreen onClose={() => send({ type: "CLOSE" })} />
      ) : current.value === "closed" ? null : null}
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
