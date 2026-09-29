import type { Metadata } from "next";
import Quiz from "@/components/Quiz";

export const metadata: Metadata = { title: "Quiz — PistonLab" };

export default function QuizPage() {
  return (
    <div className="page-narrow">
      <h1 className="page-title">Test your engine knowledge</h1>
      <p className="muted">Ten quick questions on everything you explored.</p>
      <Quiz />
    </div>
  );
}
