import { create } from "zustand";

interface CycleState {
  playing: boolean;
  speed: number;
  labels: boolean;
  set: (p: Partial<CycleState>) => void;
}

export const useCycle = create<CycleState>((set) => ({
  playing: true,
  speed: 0.25,
  labels: true,
  set: (p) => set(p),
}));

/** Cycle angle 0–720° of the single demo cylinder. */
export const cycleClock = { angle: 0 };
