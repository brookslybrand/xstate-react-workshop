import React from "react";
import { Feedback } from "./cheat/App";
import { Machine } from "xstate";
import { getSimplePaths } from "@xstate/graph";
import { render, fireEvent } from "@testing-library/react";
import { assert } from "chai";

// testing-library automatically cleans up afterEach: https://testing-library.com/docs/react-testing-library/setup#cleanup
// afterEach(cleanup);

const feedbackMachine = Machine({
  id: "feedback",
  initial: "question",
  states: {
    question: {
      on: {
        CLICK_GOOD: "thanks",
        CLICK_BAD: "form",
        CLOSE: "closed",
        ESC: "closed"
      }
    },
    form: {
      on: {
        SUBMIT: "thanks",
        CLOSE: "closed",
        ESC: "closed"
      }
    },
    thanks: {
      on: {
        CLOSE: "closed",
        ESC: "closed"
      }
    },
    closed: {
      type: "final"
    }
  }
});

const simplePaths = getSimplePaths(feedbackMachine);

describe("feedback app (manual tests)", () => {
  it('should show the thanks screen when "Good" is clicked', () => {
    const { getByText } = render(<Feedback />);

    // The question screen should be visible at first
    assert.ok(getByText("How was your experience?"));

    // Click the "Good" button
    const goodButton = getByText("Good");
    fireEvent.click(goodButton);

    // Now the thanks screen should be visible
    assert.ok(getByText("Thanks for your feedback."));
  });

  it('should show the form screen when "Bad" is clicked', () => {
    const { getByText } = render(<Feedback />);

    // The question screen should be visible at first
    assert.ok(getByText("How was your experience?"));

    // Click the "Bad" button
    const badButton = getByText("Bad");
    fireEvent.click(badButton);

    // Now the form screen should be visible
    assert.ok(getByText("Care to tell us why?"));
  });
});

describe("feedback app", () => {
  Object.keys(simplePaths).forEach(key => {
    const { paths, state: targetState } = simplePaths[key];

    describe(`state: ${key}`, () => {
      paths.forEach(({ segments }) => {
        const eventString = segments.length
          ? "via " + segments.map(step => step.event.type).join(", ")
          : "";

        it(`reaches ${key} ${eventString}`, async () => {
          // Render the feedback app
          const {
            getByText,
            queryByText,
            getByTitle,
            getByPlaceholderText,
            baseElement
          } = render(<Feedback />);

          // Add heuristics for asserting that the state is correct
          async function assertState(state) {
            if (state.matches("question")) {
              assert.ok(getByText("How was your experience?"));
            } else if (state.matches("form")) {
              assert.ok(getByText("Care to tell us why?"));
            } else if (state.matches("thanks")) {
              assert.ok(getByText("Thanks for your feedback."));
            } else if (state.matches("closed")) {
              assert.isNull(queryByText("How was your experience?"));
              assert.isNull(queryByText("Care to tell us why?"));
              assert.isNull(queryByText("Thanks for your feedback."));
            } else {
              throw new Error(`Unknown state: ${JSON.stringify(state.value)}`);
            }
          }

          // Add actions that will be executed (and asserted) to produce the events
          async function executeAction(event) {
            const actions = {
              CLICK_GOOD: () => {
                const goodButton = getByText("Good");
                fireEvent.click(goodButton);
              },
              CLICK_BAD: () => {
                const badButton = getByText("Bad");
                fireEvent.click(badButton);
              },
              CLOSE: () => {
                const closeButton = getByTitle("close");
                fireEvent.click(closeButton);
              },
              ESC: () => {
                fireEvent.keyDown(baseElement, {
                  key: "Escape"
                });
              },
              SUBMIT: () => {
                const textarea = getByPlaceholderText("Complain here");
                fireEvent.change(textarea, {
                  target: { value: event.value }
                });

                const submitButton = getByText("Submit");
                fireEvent.click(submitButton);
              }
            };

            const action = actions[event.type];

            if (!action) {
              throw new Error(`Unknown action: ${event.type}`);
            }

            // Execute the action
            await action();
          }

          // Loop through each of the steps, assert the state, execute the action
          for (let step of segments) {
            await assertState(step.state);
            await executeAction(step.event);
          }

          // Finally, assert that the target state is reached.
          await assertState(targetState);
        });
      });
    });
  });
});
