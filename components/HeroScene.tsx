"use client";

import { useEffect } from "react";
import EngineModel, { EngineClockDriver } from "./engine/EngineModel";
import { EngineCanvas, FocusControls, Floor } from "./engine/EngineCanvas";
import { useExplorer } from "@/lib/store";

const HOME: [number, number, number] = [6.2, 3.4, 6.6];
const TARGET: [number, number, number] = [0, 0.8, 0];

export default function HeroScene() {
  useEffect(() => {
    useExplorer.setState({ selected: null, hovered: null, exploded: false, viewMode: "cutaway", playing: true, showGas: true });
  }, []);
  return (
    <EngineCanvas camera={HOME}>
      <EngineClockDriver />
      <EngineModel interactive={false} />
      <Floor />
      <FocusControls focus={null} resetToken={0} home={HOME} target={TARGET} autoRotate />
    </EngineCanvas>
  );
}
