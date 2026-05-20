"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CostNode, DrillLevel } from "@/types";
import { CostBar } from "./CostBar";

interface CostBarChartProps {
  nodes: CostNode[];
  level: DrillLevel;
  onSelect: (node: CostNode) => void;
}

export function CostBarChart({ nodes, level, onSelect }: CostBarChartProps) {
  const maxTotal = Math.max(...nodes.map((n) => n.total));
  const isInteractive = level !== "pod";

  return (
    <div
      className="relative rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-card p-6"
      style={{ boxShadow: "var(--shadow-sm)" }}
      role="img"
      aria-label={`Cost comparison chart showing ${nodes.length} ${level}s`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`chart-${level}-${nodes.map((n) => n.id).join(",")}`}
          className="grid items-end gap-4"
          style={{
            gridTemplateColumns: `repeat(${nodes.length}, minmax(60px, 1fr))`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {nodes.map((node, i) => (
            <CostBar
              key={node.id}
              node={node}
              maxTotal={maxTotal}
              index={i}
              onSelect={onSelect}
              isInteractive={isInteractive}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
