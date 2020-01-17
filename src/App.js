import React, { useState } from "react";
import { useMachine } from "@xstate/react";
import { feedbackMachine } from "./feedbackMachine";

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
