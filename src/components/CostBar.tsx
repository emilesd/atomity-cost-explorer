"use client";

import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion";
import { useRef } from "react";
import type { CostNode } from "@/types";
import type { DrillPhase } from "./CostExplorer";
import { SEGMENT_GAP_PX } from "./CostBarChart";

interface CostBarProps {
  node: CostNode;
  maxTotal: number;
  index: number;
  onSelect: (
    node: CostNode,
    rect: DOMRect,
    index: number,
    trackHeightPx: number
  ) => void;
  isInteractive: boolean;
  isTransitioning: boolean;
  phase: DrillPhase;
  isClickSource: boolean;
  enterFrom?: {
    sourceIndex: number;
    siblingOffsetPx: number;
    columnWidthPx: number;
    scaleY: number;
  };
}

// Two-beat entry: first the bar TRAVELS diagonally (x + y simultaneously)
// from the split position down to its column's baseline (still at slice
// height), then it GROWS vertically to its full natural height.
//
// Diagonal motion reads more naturally than the previous "horizontal then
// drop" — the bars look like they're settling onto a table from the
// stack, rather than gliding sideways in mid-air.
const TRAVEL_DURATION_S = 1.8;
const GROW_DURATION_S = 1.6;
const TRAVEL_EASE = [0.32, 0.72, 0, 1] as [number, number, number, number];
const GROW_EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const ENTER_TRANSITION = {
  // x + y share the travel phase → diagonal slide into column + baseline.
  x: { duration: TRAVEL_DURATION_S, ease: TRAVEL_EASE },
  y: { duration: TRAVEL_DURATION_S, ease: TRAVEL_EASE },
  // scaleY waits, then grows the bar up from baseline to full height.
  scaleY: {
    duration: GROW_DURATION_S,
    delay: TRAVEL_DURATION_S,
    ease: GROW_EASE,
  },
  opacity: { duration: 0.2 },
};

// Container-only transition (for the bar's outer wrapper). Mirrors the
// total entry duration so the label settles into place at the same moment
// the bar finishes growing.
const ENTER_WRAPPER_TRANSITION = {
  duration: TRAVEL_DURATION_S + GROW_DURATION_S,
  ease: TRAVEL_EASE,
};

export function CostBar({
  node,
  maxTotal,
  index,
  onSelect,
  isInteractive,
  isTransitioning,
  phase,
  isClickSource,
  enterFrom,
}: CostBarProps) {
  const heightPercent = Math.max(20, (node.total / maxTotal) * 100);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (!isInteractive) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    // The bar's parent <div> is the fixed-height track (clamp(140px,22vw,220px)).
    // We pass it up so the chart can compute child bar heights exactly,
    // making the split→travel handoff pixel-perfect.
    const trackHeightPx =
      buttonRef.current?.parentElement?.getBoundingClientRect().height ?? 0;
    if (rect) onSelect(node, rect, index, trackHeightPx);
  };

  // Drill-down entry transform: place the new bar visually at the parent's
  // column, stacked at the corresponding split-segment position, then
  // animate to its natural grid position.
  let buttonInitial: TargetAndTransition | false = false;
  let buttonAnimate: TargetAndTransition = { opacity: 1, x: 0, y: 0, scaleY: 1 };

  if (enterFrom) {
    const xOffset = (enterFrom.sourceIndex - index) * enterFrom.columnWidthPx;
    buttonInitial = {
      opacity: 1,
      x: xOffset,
      y: enterFrom.siblingOffsetPx,
      scaleY: enterFrom.scaleY,
    };
    buttonAnimate = { opacity: 1, x: 0, y: 0, scaleY: 1 };
  } else if (!isClickSource) {
    buttonInitial = false;
  }

  // Show segment-split rendering on the clicked bar during pulse and split phases
  const showSplitSegments =
    isClickSource && (phase === "pulse" || phase === "split");
  const childTotal = node.children?.reduce((s, c) => s + c.total, 0) ?? 0;

  return (
    <motion.div
      className="cost-bar-container relative flex flex-col items-center gap-2 sm:gap-3"
      initial={enterFrom ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        enterFrom
          ? ENTER_WRAPPER_TRANSITION
          : {
              type: "spring",
              stiffness: 260,
              damping: 22,
              delay: index * 0.06,
            }
      }
    >
      <div
        className="relative flex w-full items-end"
        style={{ height: "clamp(140px, 22vw, 220px)" }}
      >
        {/* Landing burst — fires when a travelling bar arrives at its
            column baseline (= start of grow phase). Rendered OUTSIDE
            the bar button so it is not warped by the bar's scaleY
            growth animation. Two layered effects:
              1. Halo: radial mint glow expanding outward and fading
              2. Splash: thin baseline streak scaling horizontally
            Together they read as "thud + flash" — the bar has landed. */}
        {enterFrom && phase === "travel" && (
          <>
            <motion.div
              key="landing-halo"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
              style={{
                height: "min(60%, 8rem)",
                background:
                  "radial-gradient(ellipse at center bottom, var(--color-accent-mint-dark) 0%, transparent 65%)",
                transformOrigin: "center bottom",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0, 0.55, 0],
                scale: [0.8, 1.25, 1.5],
              }}
              transition={{
                duration: 0.7,
                delay: TRAVEL_DURATION_S,
                times: [0, 0.3, 1],
                ease: "easeOut",
              }}
            />
            <motion.div
              key="landing-splash"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1.5 rounded-full"
              style={{
                backgroundColor: "var(--color-accent-mint-dark)",
                filter: "blur(2px)",
                transformOrigin: "center",
              }}
              initial={{ opacity: 0, scaleX: 0.9 }}
              animate={{
                opacity: [0, 0.95, 0],
                scaleX: [0.9, 1.6, 2.1],
              }}
              transition={{
                duration: 0.55,
                delay: TRAVEL_DURATION_S,
                times: [0, 0.25, 1],
                ease: "easeOut",
              }}
            />
          </>
        )}
        <motion.button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          disabled={!isInteractive}
          className="relative w-full focus-visible:outline-2 focus-visible:outline-mint-dark focus-visible:outline-offset-2 disabled:cursor-default rounded-[var(--radius-lg)]"
          style={{
            height: `${heightPercent}%`,
            minHeight: "32px",
            transformOrigin: "bottom",
          }}
          initial={buttonInitial}
          animate={buttonAnimate}
          transition={ENTER_TRANSITION}
          whileHover={isInteractive ? { scale: 1.04 } : undefined}
          whileTap={isInteractive ? { scale: 0.97 } : undefined}
          aria-label={`${node.name}: $${node.total.toLocaleString()}. ${
            isInteractive ? "Click to drill down." : ""
          }`}
        >
          {/* Solid bar — visible at idle. During pulse: zooms in then back.
              During split: fades out as segments take over. During grow
              phase: a brief brightness bump so the user feels the growth. */}
          <motion.div
            className="absolute inset-0 rounded-[var(--radius-lg)] shadow-[0_2px_10px_color-mix(in_srgb,var(--color-accent-mint-dark)_24%,transparent)]"
            style={{
              backgroundColor: "var(--color-accent-mint)",
              transformOrigin: "center",
            }}
            animate={
              isClickSource && phase === "pulse"
                ? {
                    scale: [1, 1.08, 1.04],
                    backgroundColor: "var(--color-accent-mint-dark)",
                    opacity: 1,
                  }
                : isClickSource && phase === "split"
                  ? { scale: 1, opacity: 0 }
                  : enterFrom && phase === "travel"
                    ? {
                        scale: 1,
                        opacity: 1,
                        // Travel = dark mint. Land moment = bright flash.
                        // Grow = sustained mid mint. Settle = base mint.
                        backgroundColor: [
                          "var(--color-accent-mint-dark)", // travelling
                          "var(--color-accent-mint-dark)", // still travelling
                          "#bbf7d0",                        // burst at landing
                          "var(--color-accent-mint)",      // settled
                        ],
                        filter: [
                          "drop-shadow(0 0 0 transparent)",
                          "drop-shadow(0 0 0 transparent)",
                          "drop-shadow(0 0 18px var(--color-accent-mint-dark))",
                          "drop-shadow(0 0 0 transparent)",
                        ],
                      }
                    : { scale: 1, opacity: 1, backgroundColor: "var(--color-accent-mint)" }
            }
            transition={
              isClickSource && phase === "pulse"
                ? { duration: 0.34, ease: "easeOut" }
                : isClickSource && phase === "split"
                  ? { duration: 0.28, ease: "easeOut" }
                  : enterFrom && phase === "travel"
                    ? (() => {
                        const total = TRAVEL_DURATION_S + GROW_DURATION_S;
                        const landAt = TRAVEL_DURATION_S / total;
                        // Spend a brief slice (5% of total) at the bright
                        // burst color, then fade back over the rest of grow.
                        const burstWidth = 0.05;
                        return {
                          duration: total,
                          times: [0, landAt, landAt + burstWidth, 1],
                          ease: "easeOut",
                        };
                      })()
                    : { duration: 0.45 }
            }
          />

          {/* Split segments — stacked with gaps. Appear during pulse,
              fully visible and held during split phase. */}
          <AnimatePresence>
            {showSplitSegments && node.children && childTotal > 0 && (
              <motion.div
                key="segments"
                className="pointer-events-none absolute inset-0 flex flex-col-reverse"
                style={{ gap: `${SEGMENT_GAP_PX}px` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
                transition={{ duration: 0.22 }}
              >
                {node.children.map((child, segIdx) => {
                  const sharePercent = (child.total / childTotal) * 100;
                  return (
                    <motion.div
                      key={child.id}
                      className="rounded-[var(--radius-lg)] shadow-[0_2px_8px_color-mix(in_srgb,var(--color-accent-mint-dark)_30%,transparent)]"
                      style={{
                        height: `${sharePercent}%`,
                        backgroundColor: "var(--color-accent-mint-dark)",
                      }}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: segIdx * 0.06,
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="text-center">
        <p className="cost-bar-label font-semibold text-foreground">
          {node.name}
        </p>
        <p className="cost-bar-value font-mono text-muted">
          ${node.total.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}
