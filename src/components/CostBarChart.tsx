"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CostNode, DrillLevel } from "@/types";
import { CostBar } from "./CostBar";
import type { DrillPhase } from "./CostExplorer";

export interface DrillSource {
  parent: CostNode;
  rect: DOMRect;
  index: number;
}

interface CostBarChartProps {
  nodes: CostNode[];
  level: DrillLevel;
  onSelect: (node: CostNode, rect: DOMRect, index: number) => void;
  isTransitioning: boolean;
  phase: DrillPhase;
  drillSource: DrillSource | null;
}

// Visible gap between stacked split segments (px)
export const SEGMENT_GAP_PX = 6;

export function CostBarChart({
  nodes,
  level,
  onSelect,
  isTransitioning,
  phase,
  drillSource,
}: CostBarChartProps) {
  const maxTotal = Math.max(...nodes.map((n) => n.total));
  const isInteractive = level !== "pod" && phase === "idle";
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridRect, setGridRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (gridRef.current) {
      setGridRect(gridRef.current.getBoundingClientRect());
    }
  }, [nodes.length]);

  // Compute enterFrom data for the namespace/pod bars after `path` updates.
  // Each new bar starts at its parent's column position, stacked with the
  // same gaps that were visible during the split phase.
  const enterFromMap = useMemo(() => {
    const map = new Map<
      string,
      {
        sourceIndex: number;
        sourceHeightPx: number;
        siblingOffsetPx: number;
        columnWidthPx: number;
        sharePercent: number;
      }
    >();

    if (!drillSource || !gridRect) return map;

    const parent = drillSource.parent;
    if (!parent.children) return map;

    const childIds = new Set(parent.children.map((c) => c.id));
    const isChildView = nodes.every((n) => childIds.has(n.id));
    if (!isChildView) return map;

    const columnWidthPx = gridRect.width / nodes.length;
    const parentTotal = parent.children.reduce((s, c) => s + c.total, 0);
    const sourceHeightPx = drillSource.rect.height;
    const totalGapsPx = (parent.children.length - 1) * SEGMENT_GAP_PX;
    const availableHeight = sourceHeightPx - totalGapsPx;

    // Stack from bottom up — first child sits at the bottom of the parent
    let cumulativeHeight = 0;
    parent.children.forEach((child, i) => {
      const sharePercent = (child.total / parentTotal) * 100;
      const sliceHeight = (sharePercent / 100) * availableHeight;
      const gapAbove = i * SEGMENT_GAP_PX;
      const siblingOffsetPx = -(cumulativeHeight + sliceHeight / 2 + gapAbove);
      cumulativeHeight += sliceHeight;

      map.set(child.id, {
        sourceIndex: drillSource.index,
        sourceHeightPx,
        siblingOffsetPx,
        columnWidthPx,
        sharePercent: (sliceHeight / sourceHeightPx) * 100,
      });
    });

    return map;
  }, [drillSource, gridRect, nodes]);

  return (
    <motion.div
      className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-card p-4 sm:p-6"
      style={{ boxShadow: "var(--shadow-sm)" }}
      animate={
        isTransitioning
          ? {
              boxShadow: [
                "var(--shadow-sm)",
                "0 0 0 1px var(--color-accent-mint) inset, 0 8px 32px color-mix(in srgb, var(--color-accent-mint) 18%, transparent)",
                "var(--shadow-sm)",
              ],
            }
          : {}
      }
      transition={{ duration: 1.1, ease: "easeOut" }}
      role="img"
      aria-label={`Cost comparison chart showing ${nodes.length} ${level}s`}
    >
      <div
        className="pointer-events-none absolute inset-x-4 sm:inset-x-6 top-6 bottom-20 flex flex-col justify-between"
        aria-hidden="true"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-t border-dashed border-[var(--color-border)] opacity-50"
          />
        ))}
      </div>

      <div className="relative overflow-x-auto">
        <div
          ref={gridRef}
          className="grid items-end gap-3 sm:gap-4"
          style={{
            gridTemplateColumns: `repeat(${nodes.length}, minmax(60px, 1fr))`,
            minInlineSize:
              nodes.length > 3 ? `${nodes.length * 80}px` : undefined,
          }}
        >
          {nodes.map((node, i) => (
            <CostBar
              key={node.id}
              node={node}
              maxTotal={maxTotal}
              index={i}
              onSelect={onSelect}
              isInteractive={isInteractive}
              isTransitioning={isTransitioning}
              phase={phase}
              isClickSource={drillSource?.parent.id === node.id}
              enterFrom={enterFromMap.get(node.id)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
