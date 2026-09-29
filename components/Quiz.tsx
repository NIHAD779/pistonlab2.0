"use client";

import { useState } from "react";
import Link from "next/link";

const QUESTIONS = [
  {
    q: "What is the correct order of the four strokes?",
    options: [
      "Intake → Power → Compression → Exhaust",
      "Intake → Compression → Power → Exhaust",
      "Compression → Intake → Exhaust → Power",
      "Power → Intake → Compression → Exhaust",
    ],
    a: 1,
    why: "Suck, squeeze, bang, blow: intake, compression, power, exhaust.",
  },
  {
    q: "How many times does the crankshaft turn for one complete four-stroke cycle?",
    options: ["Once", "Twice", "Four times", "Half a turn"],
    a: 1,
    why: "Each stroke is half a turn (180°), so four strokes take 720° — two full revolutions.",
  },
  {
    q: "Which stroke actually produces power?",
    options: ["Intake", "Compression", "Power", "Exhaust"],
    a: 2,
    why: "Only the power stroke pushes on the piston. The other three are paid for by the flywheel and the other cylinders.",
  },
  {
    q: "What does the camshaft control?",
    options: ["The spark timing", "The opening and closing of the valves", "The fuel pressure", "The oil flow"],
    a: 1,
    why: "Cam lobes push the valves open at just the right time, and springs close them.",
  },
  {
    q: "At what speed does the camshaft turn compared to the crankshaft?",
    options: ["The same speed", "Twice as fast", "Half as fast", "Four times as fast"],
    a: 2,
    why: "Each valve opens once per cycle (two crank revolutions), so the cam turns at half crank speed.",
  },
  {
    q: "Which part turns the piston's up-and-down motion into rotation?",
    options: ["Flywheel", "Crankshaft (via the connecting rod)", "Timing belt", "Camshaft"],
    a: 1,
    why: "The connecting rod links the piston to an offset crank pin, turning the crankshaft like pedals on a bike.",
  },
  {
    q: "During the compression stroke, the valves are…",
    options: ["Both open", "Intake open, exhaust closed", "Both closed", "Exhaust open, intake closed"],
    a: 2,
    why: "Both valves must seal so the mixture can be squeezed.",
  },
  {
    q: "What is the firing order of the inline-4 in the Explorer?",
    options: ["1-2-3-4", "1-3-4-2", "1-4-2-3", "4-3-2-1"],
    a: 1,
    why: "1-3-4-2 is the classic inline-4 firing order — it spreads power pulses evenly along the crank.",
  },
  {
    q: "Why does the spark plug fire slightly BEFORE the piston reaches the top?",
    options: [
      "To save fuel",
      "Because the flame takes time to spread through the mixture",
      "To cool the cylinder",
      "To open the exhaust valve",
    ],
    a: 1,
    why: "Burning takes a few milliseconds, so ignition is advanced to get peak pressure just after TDC.",
  },
  {
    q: "What is the job of the flywheel?",
    options: [
      "Pump oil around the engine",
      "Store rotational energy and smooth out power pulses",
      "Drive the camshafts",
      "Cool the exhaust",
    ],
    a: 1,
    why: "Its heavy inertia carries the crank through the non-power strokes.",
  },
];

export default function Quiz() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= QUESTIONS.length;

  if (done) {
    const pct = Math.round((score / QUESTIONS.length) * 100);
    return (
      <div className="quiz glass">
        <div className="eyebrow">Result</div>
        <h2>
          {score} / {QUESTIONS.length} correct
        </h2>
        <div className="score-bar">
          <div style={{ width: `${pct}%` }} />
        </div>
        <p>
          {pct === 100
            ? "Flawless! You're ready to rebuild an engine. 🏁"
            : pct >= 70
              ? "Great work — you clearly know your way around an engine."
              : "Good start! Revisit the Explorer and Cycle Lab, then try again."}
        </p>
        <div className="row gap">
          <button
            className="btn primary"
            onClick={() => {
              setI(0);
              setScore(0);
              setPick(null);
            }}
          >
            Try again
          </button>
          <Link className="btn" href="/cycle">
            Cycle Lab
          </Link>
          <Link className="btn" href="/explore">
            Engine Explorer
          </Link>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[i];
  return (
    <div className="quiz glass">
      <div className="eyebrow">
        Question {i + 1} of {QUESTIONS.length} · Score {score}
      </div>
      <div className="score-bar">
        <div style={{ width: `${(i / QUESTIONS.length) * 100}%` }} />
      </div>
      <h2>{q.q}</h2>
      <div className="options">
        {q.options.map((o, k) => {
          const state =
            pick === null ? "" : k === q.a ? "correct" : k === pick ? "wrong" : "dim";
          return (
            <button
              key={o}
              className={`option ${state}`}
              disabled={pick !== null}
              onClick={() => {
                setPick(k);
                if (k === q.a) setScore((s) => s + 1);
              }}
            >
              <span className="opt-letter">{String.fromCharCode(65 + k)}</span>
              {o}
            </button>
          );
        })}
      </div>
      {pick !== null && (
        <div className={`why ${pick === q.a ? "ok" : "bad"}`}>
          <b>{pick === q.a ? "Correct!" : "Not quite."}</b> {q.why}
        </div>
      )}
      <div className="row end">
        <button
          className="btn primary"
          disabled={pick === null}
          onClick={() => {
            setI(i + 1);
            setPick(null);
          }}
        >
          {i === QUESTIONS.length - 1 ? "See result" : "Next question →"}
        </button>
      </div>
    </div>
  );
}
