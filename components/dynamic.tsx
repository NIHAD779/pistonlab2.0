"use client";

import dynamic from "next/dynamic";

const Loading = ({ label }: { label: string }) => (
  <div className="loading">
    <div className="spinner" />
    <span>{label}</span>
  </div>
);

export const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <Loading label="Starting engine…" />,
});

export const Explorer = dynamic(() => import("./engine/Explorer"), {
  ssr: false,
  loading: () => <Loading label="Assembling engine…" />,
});

export const CycleLab = dynamic(() => import("./cycle/CycleLab"), {
  ssr: false,
  loading: () => <Loading label="Priming the cylinder…" />,
});
