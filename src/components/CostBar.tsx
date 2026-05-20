"use client";

import { motion, type TargetAndTransition } from "framer-motion";
import { useRef } from "react";
import type { CostNode } from "@/types";

interface CostBarProps {
  node: CostNode;
  maxTotal: number;
  index: number;
  onSelect: (node: CostNode, rect: DOMRect, index: number) => void;
  isInteractive: boolean;
  isTransitioning: boolean;
  /** If set, this bar is entering as a child of a drill-down source.
   *  It will animate from the source position to its natural position. */
  enterFrom?: {
    sourceIndex: number;
    sourceTotal: number;
    sourceHeightPx: number;
    siblingOffsetPx: number;
    columnWidthPx: number;
    sharePercent: number;
  };
}

const ENTER_SPRING = {
  type: "spring" as const,
  stiffness: 200,
  damping: 24,
};

export function CostBar({
  node,
  maxTotal,
  index,
  onSelect,
  isInteractive,
  isTransitioning,
  enterFrom,
}: CostBarProps) {
  const heightPercent = Math.max(20, (node.total / maxTotal) * 100);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (!isInteractive) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) onSelect(node, rect, index);
  };

  // Compute starting transform when this bar is entering from a drill-down source.
  // x: horizontal distance from source column to this column
  // scaleY: the source piece was smaller (just a slice of parent) — start small, then grow
  let initial: TargetAndTransition = { opacity: 0, y: 20 };
  let animate: TargetAndTransition = { opacity: 1, y: 0, x: 0, scaleY: 1 };

  if (enterFrom) {
    const xOffset =
      (enterFrom.sourceIndex - index) * enterFrom.columnWidthPx;
    initial = {
      opacity: 1,
      x: xOffset,
      y: enterFrom.siblingOffsetPx,
      scaleY: enterFrom.sharePercent / 100,
      scaleX: 1,
    };
    animate = { opacity: 1, x: 0, y: 0, scaleY: 1, scaleX: 1 };
  }

  return (
    <motion.div
      className="cost-bar-container relative flex flex-col items-center gap-2 sm:gap-3"
      initial={enterFrom ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 22,
        delay: enterFrom ? 0 : index * 0.06,
      }}
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
          initial={initial}
          animate={animate}
          transition={ENTER_SPRING}
          whileHover={
            isInteractive && !isTransitioning
              ? { scale: 1.04 }
              : undefined
          }
          whileTap={isInteractive ? { scale: 0.97 } : undefined}
          aria-label={`${node.name}: $${node.total.toLocaleString()}. ${
            isInteractive ? "Click to drill down." : ""
          }`}
        >
          <motion.div
            className="absolute inset-0 rounded-[var(--radius-lg)] shadow-[0_2px_10px_color-mix(in_srgb,var(--color-accent-mint-dark)_24%,transparent)]"
            style={{ backgroundColor: "var(--color-accent-mint)" }}
            animate={{
              backgroundColor: isTransitioning
                ? [
                    "var(--color-accent-mint)",
                    "var(--color-accent-mint-dark)",
                    "var(--color-accent-mint)",
                  ]
                : "var(--color-accent-mint)",
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
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
