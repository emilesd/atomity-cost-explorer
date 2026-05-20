"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CostNode, DrillLevel } from "@/types";
import { COST_CATEGORIES, COST_LABELS } from "@/types";
import { AnimatedCounter } from "./AnimatedCounter";

interface MetricsTableProps {
  nodes: CostNode[];
  level: DrillLevel;
  levelKey: string;
}

function EfficiencyBadge({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `color-mix(in srgb, var(--color-accent-success) ${value}%, var(--color-accent-error))`,
        color: "#fff",
      }}
    >
      {value}%
    </span>
  );
}

const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 280,
      damping: 26,
      delay: 0.1 + i * 0.07,
    },
  }),
  exit: { opacity: 0, x: 16, transition: { duration: 0.15 } },
};

export function MetricsTable({ nodes, level, levelKey }: MetricsTableProps) {
  return (
    <div
      className="overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-card"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <table className="w-full border-collapse text-start">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted" />
            {COST_CATEGORIES.map((cat) => (
              <th
                key={cat}
                className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wider text-muted"
              >
                {COST_LABELS[cat]}
              </th>
            ))}
            <th className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wider text-muted">
              Efficiency
            </th>
            <th className="px-4 py-3 text-end text-xs font-bold uppercase tracking-wider text-foreground">
              Total
            </th>
          </tr>
        </thead>

        <AnimatePresence mode="wait">
          <motion.tbody
            key={levelKey}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {nodes.map((node, i) => (
              <motion.tr
                key={`${levelKey}-${node.id}`}
                custom={i}
                variants={rowVariants}
                className="border-b border-[var(--color-border-light)] last:border-b-0 transition-colors hover:bg-surface"
              >
                <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                  {node.name}
                </td>
                {COST_CATEGORIES.map((cat) => (
                  <td
                    key={cat}
                    className="px-4 py-3 text-end font-mono text-muted whitespace-nowrap"
                  >
                    <AnimatedCounter value={node.costs[cat]} duration={0.7} />
                  </td>
                ))}
                <td className="px-4 py-3 text-end">
                  <EfficiencyBadge value={node.efficiency} />
                </td>
                <td className="px-4 py-3 text-end font-mono font-bold text-foreground whitespace-nowrap">
                  <AnimatedCounter value={node.total} duration={0.9} />
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </AnimatePresence>
      </table>
    </div>
  );
}
