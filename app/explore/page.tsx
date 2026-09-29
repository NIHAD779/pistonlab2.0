import type { Metadata } from "next";
import { Explorer } from "@/components/dynamic";

export const metadata: Metadata = { title: "Engine Explorer — PistonLab" };

export default function ExplorePage() {
  return <Explorer />;
}
