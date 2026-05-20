"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useClusterData } from "@/hooks/useClusterData";
import type { BreadcrumbItem, CostNode, DrillLevel } from "@/types";
import { Breadcrumb } from "./Breadcrumb";
import { CostBarChart, type DrillSource } from "./CostBarChart";
import { MetricsTable } from "./MetricsTable";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

const LEVELS: DrillLevel[] = ["cluster", "namespace", "pod"];
const TRANSITION_MS = 800;

export function CostExplorer() {
  const { data, isLoading, error, refetch } = useClusterData();
  const [path, setPath] = useState<CostNode[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [drillSource, setDrillSource] = useState<DrillSource | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const currentLevel: DrillLevel = LEVELS[Math.min(path.length, 2)] ?? "pod";

  const currentNodes = useMemo(() => {
    if (!data) return [];
    if (path.length === 0) return data;
    const parent = path[path.length - 1];
    return parent.children ?? [];
  }, [data, path]);

  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      { id: "root", name: "Clusters", level: "cluster" },
    ];
    path.forEach((node, i) => {
      items.push({
        id: node.id,
        name: node.name,
        level: LEVELS[Math.min(i + 1, 2)] ?? "pod",
      });
    });
    return items;
  }, [path]);

  const triggerTransition = useCallback(() => {
    setIsTransitioning(true);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      setIsTransitioning(false);
      setDrillSource(null);
    }, TRANSITION_MS);
  }, []);

  const handleDrillDown = useCallback(
    (node: CostNode, rect: DOMRect, index: number) => {
      if (!node.children?.length) return;
      setDrillSource({ parent: node, rect, index });
      triggerTransition();
      setPath((prev) => [...prev, node]);
    },
    [triggerTransition]
  );

  const handleNavigate = useCallback(
    (index: number) => {
      setDrillSource(null);
      triggerTransition();
      if (index === 0) {
        setPath([]);
      } else {
        setPath((prev) => prev.slice(0, index));
      }
    },
    [triggerTransition]
  );

  const headingText =
    path.length === 0
      ? "Cloud Cost Overview"
      : `${path[path.length - 1].name} — ${currentLevel === "namespace" ? "Namespaces" : "Pods"}`;

  const levelKey = `level-${path.map((n) => n.id).join("/")}`;

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
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
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
                ? "Cluster"
                : currentLevel === "namespace"
                  ? path[path.length - 1]?.name
                  : `${path[path.length - 2]?.name} — ${path[path.length - 1]?.name}`}
            </motion.span>
          </div>

          <Breadcrumb items={breadcrumbItems} onNavigate={handleNavigate} />

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
