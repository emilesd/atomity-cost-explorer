"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CostNode, DrillLevel } from "@/types";
import { CostBar } from "./CostBar";

export interface DrillSource {
  /** The parent node that was clicked to trigger this drill-down */
  parent: CostNode;
  /** The clicked bar's bounding rect at click time */
  rect: DOMRect;
  /** The index of the clicked bar in its grid */
  index: number;
}

interface CostBarChartProps {
  nodes: CostNode[];
  level: DrillLevel;
  onSelect: (node: CostNode, rect: DOMRect, index: number) => void;
  isTransitioning: boolean;
  /** When set, the new bars in this view will animate from the source position */
  drillSource: DrillSource | null;
}

export function CostBarChart({
  nodes,
  level,
  onSelect,
  isTransitioning,
  drillSource,
}: CostBarChartProps) {
  const maxTotal = Math.max(...nodes.map((n) => n.total));
  const isInteractive = level !== "pod";
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridRect, setGridRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (gridRef.current) {
      setGridRect(gridRef.current.getBoundingClientRect());
    }
  }, [nodes.length]);

  // Compute enterFrom data for each new bar when there's a drill source
  const enterFromMap = useMemo(() => {
    const map = new Map<
      string,
      {
        sourceIndex: number;
        sourceTotal: number;
        sourceHeightPx: number;
        siblingOffsetPx: number;
        columnWidthPx: number;
        sharePercent: number;
      }
    >();

    if (!drillSource || !gridRect) return map;

    const parent = drillSource.parent;
    if (!parent.children) return map;

    // Verify the current view is showing the children of the drill source
    const childIds = new Set(parent.children.map((c) => c.id));
    const isChildView = nodes.every((n) => childIds.has(n.id));
    if (!isChildView) return map;

    const columnWidthPx = gridRect.width / nodes.length;
    const parentTotal = parent.children.reduce((s, c) => s + c.total, 0);
    const sourceHeightPx = drillSource.rect.height;

    // Calculate cumulative offset for stacking — each sibling starts above the previous one
    let cumulativeHeight = 0;
    parent.children.forEach((child) => {
      const sharePercent = (child.total / parentTotal) * 100;
      const sliceHeight = (sharePercent / 100) * sourceHeightPx;
      const siblingOffsetPx = -(cumulativeHeight + sliceHeight / 2);
      cumulativeHeight += sliceHeight;

      map.set(child.id, {
        sourceIndex: drillSource.index,
        sourceTotal: parent.total,
        sourceHeightPx,
        siblingOffsetPx,
        columnWidthPx,
        sharePercent,
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
              backgroundColor: [
                "var(--color-bg-card)",
                "color-mix(in srgb, var(--color-accent-mint-light) 70%, var(--color-bg-card))",
                "var(--color-bg-card)",
              ],
            }
          : {}
      }
      transition={{ duration: 0.7, ease: "easeOut" }}
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
              enterFrom={enterFromMap.get(node.id)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
