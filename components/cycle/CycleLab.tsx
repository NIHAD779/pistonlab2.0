"use client";

import { useMemo } from "react";
import CycleScene, { CycleClockDriver } from "./CycleScene";
import { cycleClock, useCycle } from "./cycleStore";
import { EngineCanvas, FocusControls, Floor } from "@/components/engine/EngineCanvas";
import {
  COMPRESSION_RATIO,
  SPARK_DEG,
  STROKES,
  STROKE_META,
  exhaustLift,
  intakeLift,
  mod,
  pressureOf,
  sparkOn,
  strokeOf,
  volumeOf,
  type Stroke,
} from "@/lib/engineMath";
import { useTicker } from "@/lib/useTicker";

const HOME: [number, number, number] = [2.2, 2.2, 8.2];
const TARGET: [number, number, number] = [0.25, 1.2, 0];

const STROKE_TEXT: Record<Stroke, { title: string; body: string; valves: string }> = {
  intake: {
    title: "1 · Intake",
    body: "The piston slides down, creating low pressure. The intake valve is open, so a fresh mix of air (blue) and fuel (amber) is sucked into the cylinder.",
    valves: "Intake open · Exhaust closed",
  },
  compression: {
    title: "2 · Compression",
    body: "Both valves close and the piston rises, squeezing the mixture into a tiny space. Compressing it makes it hot and ready to burn much more powerfully.",
    valves: "Both valves closed",
  },
  power: {
    title: "3 · Power (combustion)",
    body: "Just before the top, the spark plug fires. The mixture burns in a flash, pressure jumps to 40+ bar and the hot gas shoves the piston down — this is the only stroke that makes power.",
    valves: "Both valves closed · Spark!",
  },
  exhaust: {
    title: "4 · Exhaust",
    body: "The exhaust valve opens and the rising piston pushes the burnt gases (mostly CO₂, water vapour and nitrogen) out into the exhaust. Then the cycle starts again.",
    valves: "Exhaust open · Intake closed",
  },
};

export default function CycleLab() {
  return (
    <div className="cycle-lab">
      <div className="cycle-canvas">
        <EngineCanvas camera={HOME} fov={36}>
          <CycleClockDriver />
          <CycleScene />
          <Floor y={-0.75} />
          <FocusControls focus={null} resetToken={0} home={HOME} target={TARGET} />
        </EngineCanvas>
        <Gauges />
      </div>
      <aside className="cycle-side">
        <StrokeCards />
        <div className="card glass">
          <div className="card-head">
            <h3>P–V diagram</h3>
            <span className="muted small">pressure vs cylinder volume</span>
          </div>
          <PVDiagram />
          <p className="muted small">
            The area inside the loop is the useful <b>work</b> done by the gas each cycle. A
            higher compression ratio (this one is {COMPRESSION_RATIO.toFixed(1)}:1) makes the loop
            fatter and the engine more efficient.
          </p>
        </div>
        <Controls />
      </aside>
    </div>
  );
}

function StrokeCards() {
  useTicker(15);
  const current = strokeOf(cycleClock.angle);
  return (
    <div className="stroke-cards">
      {STROKES.map((s) => (
        <button
          key={s}
          className={`stroke-card ${s === current ? "active" : ""}`}
          style={{ ["--c" as string]: STROKE_META[s].color }}
          onClick={() => {
            useCycle.getState().set({ playing: false });
            cycleClock.angle = STROKES.indexOf(s) * 180 + (s === "power" ? 20 : 90);
          }}
        >
          <div className="stroke-title">
            <span>{STROKE_TEXT[s].title}</span>
            <span className="stroke-nick">“{STROKE_META[s].short}”</span>
          </div>
          {s === current && (
            <>
              <p>{STROKE_TEXT[s].body}</p>
              <div className="valves-note">{STROKE_TEXT[s].valves}</div>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

function Gauges() {
  useTicker(20);
  const c = cycleClock.angle;
  const P = pressureOf(c);
  const V = volumeOf(c);
  // Ideal-gas estimate relative to the fresh charge at bottom dead centre (300 K).
  const T =
    c < 180
      ? 300
      : c < 540
        ? (300 * (P * V)) / (0.9 * COMPRESSION_RATIO)
        : 1080 - (c - 540) * 1.0;
  const st = strokeOf(c);
  const iv = intakeLift(c) > 0.02;
  const ev = exhaustLift(c) > 0.02;
  const spark = sparkOn(c);
  return (
    <div className="gauges">
      <CrankDial angle={c} />
      <div className="gauge-grid glass">
        <Readout label="Stroke" value={STROKE_META[st].label} color={STROKE_META[st].color} />
        <Readout label="Crank angle" value={`${Math.round(mod(c, 360))}°  (rev ${c < 360 ? 1 : 2}/2)`} />
        <Readout label="Pressure" value={`${P.toFixed(1)} bar`} />
        <Readout label="Gas temp" value={`${Math.round(T - 273)} °C`} />
        <div className="leds">
          <span className={`led-pill ${iv ? "on blue" : ""}`}>Intake valve</span>
          <span className={`led-pill ${ev ? "on grey" : ""}`}>Exhaust valve</span>
          <span className={`led-pill ${spark ? "on spark" : ""}`}>⚡ Spark</span>
        </div>
      </div>
    </div>
  );
}

function Readout({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="readout">
      <span className="muted small">{label}</span>
      <b className="mono" style={color ? { color } : undefined}>
        {value}
      </b>
    </div>
  );
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`;
}

function CrankDial({ angle }: { angle: number }) {
  const a = (angle / 720) * Math.PI * 2;
  return (
    <div className="dial glass">
      <svg viewBox="0 0 120 120" width="120" height="120">
        {STROKES.map((s, i) => (
          <path
            key={s}
            d={arc(60, 60, 48, (i * Math.PI) / 2 + 0.03, ((i + 1) * Math.PI) / 2 - 0.03)}
            stroke={STROKE_META[s].color}
            strokeWidth={10}
            fill="none"
            opacity={strokeOf(angle) === s ? 1 : 0.3}
          />
        ))}
        <circle cx={60} cy={60} r={4} fill="#fff" />
        <line
          x1={60}
          y1={60}
          x2={60 + 40 * Math.sin(a)}
          y2={60 - 40 * Math.cos(a)}
          stroke="#fff"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <text x={60} y={86} textAnchor="middle" className="dial-txt">
          {Math.round(angle)}°
        </text>
        <text x={60} y={96} textAnchor="middle" className="dial-sub">
          of 720°
        </text>
      </svg>
    </div>
  );
}

const PV_W = 340;
const PV_H = 210;
const PAD = { l: 38, r: 10, t: 12, b: 30 };

function PVDiagram() {
  useTicker(30);
  const { segs, pMax, sx, sy } = useMemo(() => {
    const pts: { c: number; v: number; p: number }[] = [];
    for (let c = 0; c <= 720; c += 2) pts.push({ c, v: volumeOf(c), p: pressureOf(c) });
    const pMax = Math.ceil(Math.max(...pts.map((p) => p.p)) / 10) * 10;
    const sx = (v: number) =>
      PAD.l + ((v - 0.8) / (COMPRESSION_RATIO + 0.3 - 0.8)) * (PV_W - PAD.l - PAD.r);
    const sy = (p: number) => PV_H - PAD.b - (p / pMax) * (PV_H - PAD.t - PAD.b);
    const segs = STROKES.map((s, i) => {
      const part = pts.filter((p) => p.c >= i * 180 && p.c <= (i + 1) * 180);
      return {
        s,
        d: part.map((p, k) => `${k ? "L" : "M"}${sx(p.v).toFixed(1)},${sy(p.p).toFixed(1)}`).join(" "),
      };
    });
    return { segs, pMax, sx, sy };
  }, []);
  const c = cycleClock.angle;
  const cur = { x: sx(volumeOf(c)), y: sy(pressureOf(c)) };
  const loop = segs.slice(1, 3).map((s) => s.d).join(" ").replace(/M/g, "L").replace(/^L/, "M") + " Z";
  return (
    <svg viewBox={`0 0 ${PV_W} ${PV_H}`} className="pv">
      <defs>
        <linearGradient id="pvfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8a1f" stopOpacity="0.35" />
          <stop offset="1" stopColor="#b27cff" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={PAD.l} x2={PV_W - PAD.r} y1={sy(f * pMax)} y2={sy(f * pMax)} className="pv-grid" />
          <text x={PAD.l - 6} y={sy(f * pMax) + 3} textAnchor="end" className="pv-tick">
            {Math.round(f * pMax)}
          </text>
        </g>
      ))}
      <text x={PAD.l + 6} y={PAD.t + 4} className="pv-tick">bar</text>
      <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={PV_H - PAD.b} className="pv-axis" />
      <line x1={PAD.l} x2={PV_W - PAD.r} y1={PV_H - PAD.b} y2={PV_H - PAD.b} className="pv-axis" />
      <text x={sx(1)} y={PV_H - 12} textAnchor="middle" className="pv-tick">TDC</text>
      <text x={sx(COMPRESSION_RATIO)} y={PV_H - 12} textAnchor="middle" className="pv-tick">BDC</text>
      <text x={(PV_W + PAD.l) / 2} y={PV_H - 2} textAnchor="middle" className="pv-tick">Volume →</text>
      <path d={loop} fill="url(#pvfill)" />
      {segs.map(({ s, d }) => (
        <path key={s} d={d} stroke={STROKE_META[s].color} strokeWidth={strokeOf(c) === s ? 3 : 1.6} fill="none" opacity={strokeOf(c) === s ? 1 : 0.55} />
      ))}
      <circle cx={cur.x} cy={cur.y} r={9} fill={STROKE_META[strokeOf(c)].color} opacity={0.25} />
      <circle cx={cur.x} cy={cur.y} r={5} fill="#fff" />
      {c > SPARK_DEG - 4 && c < SPARK_DEG + 30 && (
        <text x={cur.x + 10} y={cur.y + 4} className="pv-bang">
          BANG!
        </text>
      )}
    </svg>
  );
}

function Controls() {
  useTicker(20);
  const s = useCycle();
  return (
    <div className="card glass controls">
      <div className="row gap">
        <button className="btn primary" onClick={() => s.set({ playing: !s.playing })}>
          {s.playing ? "❚❚ Pause" : "▶ Play"}
        </button>
        <button className={`chip ${s.labels ? "on" : ""}`} onClick={() => s.set({ labels: !s.labels })}>
          <span className="led" /> Labels
        </button>
      </div>
      <label className="slider-row">
        <span className="muted small">Scrub the cycle</span>
        <input
          type="range"
          min={0}
          max={719}
          step={1}
          value={Math.round(cycleClock.angle)}
          onChange={(e) => {
            s.set({ playing: false });
            cycleClock.angle = parseFloat(e.target.value);
          }}
        />
      </label>
      <label className="slider-row">
        <span className="muted small">Speed</span>
        <input
          type="range"
          min={0.03}
          max={1.5}
          step={0.01}
          value={s.speed}
          onChange={(e) => s.set({ speed: parseFloat(e.target.value), playing: true })}
        />
      </label>
    </div>
  );
}
