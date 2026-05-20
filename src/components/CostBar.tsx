"use client";

import { motion } from "framer-motion";
import type { CostNode } from "@/types";

interface CostBarProps {
  node: CostNode;
  maxTotal: number;
  index: number;
  onSelect: (node: CostNode) => void;
  isInteractive: boolean;
}

export function CostBar({
  node,
  maxTotal,
  index,
  onSelect,
  isInteractive,
}: CostBarProps) {
  const heightPercent = Math.max(20, (node.total / maxTotal) * 100);

  return (
    <motion.div
      className="cost-bar-container flex flex-col items-center gap-2 sm:gap-3"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 10 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 22,
        delay: index * 0.08,
      }}
      layout
    >
      <div
        className="relative flex w-full items-end"
        style={{ height: "clamp(120px, 20vw, 200px)" }}
      >
        <motion.button
          onClick={() => isInteractive && onSelect(node)}
          disabled={!isInteractive}
          className="cost-card group relative w-full rounded-[var(--radius-lg)] bg-mint transition-all focus-visible:outline-2 focus-visible:outline-mint-dark focus-visible:outline-offset-2 disabled:cursor-default"
          style={{
            height: `${heightPercent}%`,
            minHeight: "32px",
            transformOrigin: "bottom",
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: index * 0.08 + 0.15,
          }}
          whileHover={
            isInteractive
              ? { scale: 1.03, boxShadow: "var(--shadow-md)" }
              : undefined
          }
          whileTap={isInteractive ? { scale: 0.98 } : undefined}
          aria-label={`${node.name}: $${node.total.toLocaleString()} total cost. ${isInteractive ? "Click to drill down." : ""}`}
        >
          <span className="sr-only">
            ${node.total.toLocaleString()} total
          </span>
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
