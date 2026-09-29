"use client";

import { useEffect, useState } from "react";

/** Re-renders the calling component at roughly `fps` frames per second. */
export function useTicker(fps = 20) {
  const [, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const step = (t: number) => {
      if (t - last > 1000 / fps) {
        last = t;
        setN((n) => (n + 1) % 1_000_000);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fps]);
}
