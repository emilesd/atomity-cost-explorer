"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useClusterData } from "@/hooks/useClusterData";
import type { CostNode, DrillLevel } from "@/types";
import { CostBarChart, type DrillSource } from "./CostBarChart";
import { MetricsTable } from "./MetricsTable";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

const LEVELS: DrillLevel[] = ["cluster", "namespace", "pod"];

// Drill-down phase timings (ms) — tuned so the user feels every beat:
// pulse → split-with-gaps HOLD → diagonal travel → grow with landing-burst.
// Travel is slow enough to read each bar's path; the growth-with-effect
// at the end gives a satisfying "snap into place" moment.
const PULSE_MS = 340; // zoom-in feedback after click
const SPLIT_MS = 600; // fade out + segments appear + HOLD with gaps
const TRAVEL_MS = 3400; // diagonal travel (1.8s) + grow with burst (1.6s)

export type DrillPhase = "idle" | "pulse" | "split" | "travel";

export function CostExplorer() {
  const { data, isLoading, error, refetch } = useClusterData();
  const [path, setPath] = useState<CostNode[]>([]);
  const [phase, setPhase] = useState<DrillPhase>("idle");
  const [drillSource, setDrillSource] = useState<DrillSource | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const chartAnchorRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const currentLevel: DrillLevel = LEVELS[Math.min(path.length, 2)] ?? "pod";

  const currentNodes = useMemo(() => {
    if (!data) return [];
    if (path.length === 0) return data;
    const parent = path[path.length - 1];
    return parent.children ?? [];
  }, [data, path]);

  // Label for the back chip — name of the level one step up from current.
  const backLabel = useMemo(() => {
    if (path.length === 0) return null;
    if (path.length === 1) return "All Clusters";
    return path[path.length - 2].name;
  }, [path]);

  // Keep the chart in view after a drill — important on small screens
  // where the action otherwise scrolls offscreen. Skip on first render
  // (path === []) and respect reduced-motion preference.
  const prevPathDepth = useRef(path.length);
  useEffect(() => {
    const changed = prevPathDepth.current !== path.length;
    prevPathDepth.current = path.length;
    if (!changed || path.length === 0) return;
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    chartAnchorRef.current?.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
  }, [path.length]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);

  // Ref-based guard prevents double-fires from rapid clicks — setState
  // batching means phase might still read "idle" when a second click
  // arrives in the same microtask.
  const drillLock = useRef(false);

  const handleDrillDown = useCallback(
    (node: CostNode, rect: DOMRect, index: number, trackHeightPx: number) => {
      if (!node.children?.length) return;
      if (drillLock.current) return;
      drillLock.current = true;
      clearTimers();

      // Phase 1 — Pulse: bar zooms in briefly (click feedback)
      setDrillSource({ parent: node, rect, index, trackHeightPx });
      setPhase("pulse");

      // Phase 2 — Split: bar fades while segments appear with gaps, then HOLD
      timers.current.push(
        setTimeout(() => setPhase("split"), PULSE_MS)
      );

      // Phase 3 — Travel: path updates, namespace bars fly from split positions
      timers.current.push(
        setTimeout(() => {
          setPhase("travel");
          setPath((prev) => [...prev, node]);
        }, PULSE_MS + SPLIT_MS)
      );

      // Phase 4 — Idle: release the drill lock so clicks work again
      timers.current.push(
        setTimeout(() => {
          setPhase("idle");
          setDrillSource(null);
          drillLock.current = false;
        }, PULSE_MS + SPLIT_MS + TRAVEL_MS)
      );
    },
    [clearTimers]
  );

  const handleNavigate = useCallback(
    (index: number) => {
      clearTimers();
      drillLock.current = false;
      setDrillSource(null);
      setPhase("travel");
      timers.current.push(
        setTimeout(() => {
          setPhase("idle");
          drillLock.current = false;
        }, TRAVEL_MS)
      );
      if (index === 0) {
        setPath([]);
      } else {
        setPath((prev) => prev.slice(0, index));
      }
    },
    [clearTimers]
  );

  const headingText =
    path.length === 0
      ? "Cloud Cost Overview"
      : `${path[path.length - 1].name} — ${currentLevel === "namespace" ? "Namespaces" : "Pods"}`;

  const levelKey = `level-${path.map((n) => n.id).join("/")}`;
  const isTransitioning = phase !== "idle";

  return (
    <section
      ref={sectionRef}
      aria-labelledby="cost-explorer-heading"
      className="mx-auto w-full px-4 py-16 sm:px-6 lg:px-8"
      style={{ maxInlineSize: "1200px" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="flex flex-col gap-8"
      >
        {/* anchor used by scrollIntoView after drill-down — sits a few
            pixels above the header so the back chip stays visible too */}
        <div
          ref={chartAnchorRef}
          aria-hidden="true"
          style={{ scrollMarginBlockStart: "1.5rem" }}
        />
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <AnimatePresence initial={false} mode="popLayout">
              {backLabel && (
                <motion.button
                  key={`back-${path.length}`}
                  type="button"
                  onClick={() => handleNavigate(path.length - 1)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-card px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground hover:border-[var(--color-accent-mint-dark)] transition-colors focus-visible:outline-2 focus-visible:outline-mint-dark focus-visible:outline-offset-2"
                  initial={{ opacity: 0, x: -8, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -8, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  aria-label={`Back to ${backLabel}`}
                >
                  <svg
                    className="inline-size-3.5 block-size-3.5 transition-transform group-hover:-translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  {backLabel}
                </motion.button>
              )}
            </AnimatePresence>
            <span className="rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm font-medium text-muted">
              Last 30 Days
            </span>
            <motion.span
              key={`badge-${currentLevel}-${path[path.length - 1]?.id ?? "root"}`}
              className="rounded-full bg-mint px-4 py-1.5 text-sm font-semibold text-[#065f46]"
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              {currentLevel === "cluster"
                ? "All Clusters"
                : currentLevel === "namespace"
                  ? path[path.length - 1]?.name
                  : `${path[path.length - 2]?.name} › ${path[path.length - 1]?.name}`}
            </motion.span>
          </div>

          <h2
            id="cost-explorer-heading"
            className="font-semibold text-foreground"
            style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}
          >
            {headingText}
          </h2>
        </header>

        {isLoading && <LoadingState />}

        {error && (
          <ErrorState error={error as Error} onRetry={() => refetch()} />
        )}

        {data && currentNodes.length > 0 && (
          <div className="flex flex-col gap-6">
            <CostBarChart
              nodes={currentNodes}
              level={currentLevel}
              onSelect={handleDrillDown}
              isTransitioning={isTransitioning}
              phase={phase}
              drillSource={drillSource}
            />
            <MetricsTable
              nodes={currentNodes}
              level={currentLevel}
              levelKey={levelKey}
            />
          </div>
        )}
      </motion.div>
    </section>
  );
}
