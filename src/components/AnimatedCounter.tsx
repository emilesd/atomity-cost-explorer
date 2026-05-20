"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  prefix = "$",
  duration = 1.2,
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!isInView) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplayed(value);
      fromRef.current = value;
      return;
    }

    const controls = animate(fromRef.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplayed(Math.round(v)),
      onComplete: () => {
        fromRef.current = value;
      },
    });

    return () => {
      controls.stop();
      fromRef.current = value;
    };
  }, [value, isInView, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayed.toLocaleString()}
    </span>
  );
}
