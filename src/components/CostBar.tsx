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

// Two-beat entry: first the bar TRAVELS horizontally from the split
// position to its own column (still at slice height), then it GROWS
// vertically to its full natural height. Keeping the two phases separate
// makes the motion legible — the user sees travel, then growth.
const TRAVEL_DURATION_S = 2.5;
const GROW_DURATION_S = 2.0;
const TRAVEL_EASE = [0.4, 0, 0.2, 1] as [number, number, number, number];
const GROW_EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const ENTER_TRANSITION = {
  x: { duration: TRAVEL_DURATION_S, ease: TRAVEL_EASE },
  y: {
    duration: GROW_DURATION_S,
    delay: TRAVEL_DURATION_S,
    ease: GROW_EASE,
  },
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
                        backgroundColor: [
                          "var(--color-accent-mint-dark)",
                          "var(--color-accent-mint-dark)",
                          "var(--color-accent-mint)",
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
                    ? {
                        duration: TRAVEL_DURATION_S + GROW_DURATION_S,
                        times: [0, TRAVEL_DURATION_S / (TRAVEL_DURATION_S + GROW_DURATION_S), 1],
                        ease: "easeOut",
                      }
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
