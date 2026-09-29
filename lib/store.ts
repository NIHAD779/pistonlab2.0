import { create } from "zustand";
import type { PartId } from "./parts";

export type ViewMode = "cutaway" | "xray" | "solid";

interface ExplorerState {
  selected: PartId | null;
  hovered: PartId | null;
  viewMode: ViewMode;
  exploded: boolean;
  isolate: boolean;
  showGas: boolean;
  playing: boolean;
  speed: number; // crank revolutions per second (animation, not real RPM)
  cameraResetToken: number;
  select: (id: PartId | null) => void;
  hover: (id: PartId | null) => void;
  set: (patch: Partial<ExplorerState>) => void;
  resetCamera: () => void;
}

export const useExplorer = create<ExplorerState>((set) => ({
  selected: null,
  hovered: null,
  viewMode: "cutaway",
  exploded: false,
  isolate: true,
  showGas: true,
  playing: true,
  speed: 0.35,
  cameraResetToken: 0,
  select: (id) => set({ selected: id }),
  hover: (id) => set({ hovered: id }),
  set: (patch) => set(patch),
  resetCamera: () =>
    set((s) => ({ selected: null, cameraResetToken: s.cameraResetToken + 1 })),
}));
