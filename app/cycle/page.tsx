import type { Metadata } from "next";
import { CycleLab } from "@/components/dynamic";

export const metadata: Metadata = { title: "4-Stroke Lab — PistonLab" };

export default function CyclePage() {
  return <CycleLab />;
}
