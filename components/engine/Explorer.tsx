"use client";

import { useEffect, useState } from "react";
import EngineModel, { EngineClockDriver } from "./EngineModel";
import { EngineCanvas, FocusControls, Floor } from "./EngineCanvas";
import { useExplorer, type ViewMode } from "@/lib/store";
import { CATEGORIES, PARTS, PART_BY_ID, type PartId } from "@/lib/parts";
import {
  CYL_X,
  FIRING_ORDER,
  STROKE_META,
  cylinderCycle,
  engineClock,
  mod,
  strokeOf,
} from "@/lib/engineMath";
import { useTicker } from "@/lib/useTicker";

const HOME: [number, number, number] = [6.4, 4.0, 8.4];
const TARGET: [number, number, number] = [0, 0.9, 0];
const HOME_EXPLODED: [number, number, number] = [8.6, 5.6, 11.2];
const TARGET_EXPLODED: [number, number, number] = [0, 1.5, 0];

export default function Explorer() {
  const selected = useExplorer((s) => s.selected);
  const resetToken = useExplorer((s) => s.cameraResetToken);
  const select = useExplorer((s) => s.select);
  const exploded = useExplorer((s) => s.exploded);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => () => void (document.body.style.cursor = ""), []);

  return (
    <div className="explorer">
      <div className="explorer-canvas">
        <EngineCanvas camera={HOME} onPointerMissed={() => select(null)}>
          <EngineClockDriver />
          <EngineModel />
          <Floor />
          <FocusControls
            focus={selected ? `part:${selected}` : null}
            resetToken={resetToken}
            home={exploded ? HOME_EXPLODED : HOME}
            target={exploded ? TARGET_EXPLODED : TARGET}
          />
        </EngineCanvas>
      </div>

      <CylinderStrip />
      <HoverTip />

      <button className="parts-toggle glass" onClick={() => setPanelOpen((o) => !o)}>
        {panelOpen ? "✕ Close" : "☰ Components"}
      </button>
      <PartsList open={panelOpen} onPick={() => setPanelOpen(false)} />
      <InfoPanel />
      <ControlBar />
    </div>
  );
}

/* ---------------------------------------------------------------- */

function PartsList({ open, onPick }: { open: boolean; onPick: () => void }) {
  const selected = useExplorer((s) => s.selected);
  const hovered = useExplorer((s) => s.hovered);
  const select = useExplorer((s) => s.select);
  const hover = useExplorer((s) => s.hover);
  return (
    <aside className={`parts-list glass ${open ? "open" : ""}`}>
      <h3>Components</h3>
      <p className="muted small">Click a part here or on the engine.</p>
      {CATEGORIES.map((cat) => (
        <div key={cat} className="cat">
          <div className="cat-title">{cat}</div>
          {PARTS.filter((p) => p.category === cat).map((p) => (
            <button
              key={p.id}
              className={`part-btn ${selected === p.id ? "active" : ""} ${hovered === p.id ? "hover" : ""}`}
              onMouseEnter={() => hover(p.id)}
              onMouseLeave={() => hover(null)}
              onClick={() => {
                select(selected === p.id ? null : p.id);
                onPick();
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}

function InfoPanel() {
  const selected = useExplorer((s) => s.selected);
  const select = useExplorer((s) => s.select);
  const idx = selected ? PARTS.findIndex((p) => p.id === selected) : -1;
  const go = (d: number) => select(PARTS[mod(idx + d, PARTS.length)].id as PartId);

  if (!selected) {
    return (
      <aside className="info-panel glass overview">
        <div className="eyebrow">Overview</div>
        <h2>Inline-4, four-stroke petrol engine</h2>
        <p>
          This is the most common car engine layout in the world: four cylinders in a row, two
          overhead camshafts and four valves per cylinder.
        </p>
        <p>
          Each cylinder repeats <b>intake → compression → power → exhaust</b> every two turns
          of the crankshaft. The cylinders fire in the order{" "}
          <b>{FIRING_ORDER.join(" – ")}</b>, so there is always one power stroke happening —
          that is what keeps the engine running smoothly.
        </p>
        <h4>Gas colours in the cylinders</h4>
        <ul className="legend">
          {(["intake", "compression", "power", "exhaust"] as const).map((s) => (
            <li key={s}>
              <span className="dot" style={{ background: STROKE_META[s].color }} />
              <b>{STROKE_META[s].label}</b>
              <span className="muted">· {STROKE_META[s].short}</span>
            </li>
          ))}
        </ul>
        <div className="tip">
          <b>Try it:</b> drag to orbit, scroll to zoom, click any part to learn about it. Use
          <b> Exploded</b> to pull the engine apart.
        </div>
        <button className="btn primary full" onClick={() => select(PARTS[0].id)}>
          Start guided tour →
        </button>
      </aside>
    );
  }

  const p = PART_BY_ID[selected];
  return (
    <aside className="info-panel glass" key={p.id}>
      <div className="eyebrow">
        {p.category} · {idx + 1}/{PARTS.length}
      </div>
      <h2>{p.name}</h2>
      <p className="tagline">{p.tagline}</p>
      <p>{p.description}</p>
      <h4>How it works</h4>
      <ul className="bullets">
        {p.howItWorks.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <div className="facts">
        {p.facts.map((f) => (
          <div key={f.label} className="fact">
            <span>{f.label}</span>
            <b>{f.value}</b>
          </div>
        ))}
      </div>
      <div className="dyk">
        <span>💡 Did you know?</span>
        {p.didYouKnow}
      </div>
      <div className="row gap">
        <button className="btn" onClick={() => go(-1)}>
          ← Prev
        </button>
        <button className="btn" onClick={() => select(null)}>
          Overview
        </button>
        <button className="btn primary" onClick={() => go(1)}>
          Next →
        </button>
      </div>
    </aside>
  );
}

function ControlBar() {
  const s = useExplorer();
  const views: { v: ViewMode; label: string }[] = [
    { v: "cutaway", label: "Cutaway" },
    { v: "xray", label: "X-Ray" },
    { v: "solid", label: "Solid" },
  ];
  const step = (d: number) => {
    s.set({ playing: false });
    engineClock.angle = mod(engineClock.angle + d, 720);
  };
  return (
    <div className="control-bar glass">
      <div className="ctrl-group">
        <button className="icon-btn" title="Step back 10°" onClick={() => step(-10)}>
          ⏮
        </button>
        <button className="icon-btn big" title={s.playing ? "Pause" : "Play"} onClick={() => s.set({ playing: !s.playing })}>
          {s.playing ? "❚❚" : "▶"}
        </button>
        <button className="icon-btn" title="Step forward 10°" onClick={() => step(10)}>
          ⏭
        </button>
      </div>
      <label className="ctrl-group speed">
        <span className="muted small speed-label">Speed</span>
        <input
          type="range"
          min={0.05}
          max={3}
          step={0.05}
          value={s.speed}
          onChange={(e) => s.set({ speed: parseFloat(e.target.value), playing: true })}
        />
        <span className="mono small">{Math.round(s.speed * 60)} rpm</span>
      </label>
      <div className="ctrl-group seg">
        {views.map(({ v, label }) => (
          <button key={v} className={s.viewMode === v ? "on" : ""} onClick={() => s.set({ viewMode: v })}>
            {label}
          </button>
        ))}
      </div>
      <div className="ctrl-group toggles">
        <Toggle on={s.exploded} label="Exploded" onClick={() => s.set({ exploded: !s.exploded })} />
        <Toggle on={s.isolate} label="Isolate" onClick={() => s.set({ isolate: !s.isolate })} />
        <Toggle on={s.showGas} label="Gases" onClick={() => s.set({ showGas: !s.showGas })} />
        <button className="chip" onClick={s.resetCamera}>
          ⟲ Reset view
        </button>
      </div>
    </div>
  );
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`chip ${on ? "on" : ""}`} onClick={onClick}>
      <span className="led" /> {label}
    </button>
  );
}

function CylinderStrip() {
  useTicker(24);
  const a = engineClock.angle;
  return (
    <div className="cyl-strip glass">
      <div className="crank-readout">
        <span className="muted small">Crank</span>
        <span className="mono">{Math.round(mod(a, 360)).toString().padStart(3, "0")}°</span>
      </div>
      {CYL_X.map((_, i) => {
        const c = cylinderCycle(a, i);
        const st = strokeOf(c);
        const m = STROKE_META[st];
        return (
          <div key={i} className="cyl" style={{ ["--c" as string]: m.color }}>
            <div className="cyl-num">#{i + 1}</div>
            <div className="cyl-stroke">
              <span className="long">{m.label}</span>
              <span className="short">{m.short}</span>
            </div>
            <div className="cyl-bar">
              <div style={{ width: `${((c % 180) / 180) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HoverTip() {
  const hovered = useExplorer((s) => s.hovered);
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    const f = (e: PointerEvent) => setPos([e.clientX, e.clientY]);
    window.addEventListener("pointermove", f);
    return () => window.removeEventListener("pointermove", f);
  }, []);
  if (!hovered) return null;
  return (
    <div className="hover-tip" style={{ left: pos[0] + 14, top: pos[1] + 14 }}>
      {PART_BY_ID[hovered].name}
    </div>
  );
}
