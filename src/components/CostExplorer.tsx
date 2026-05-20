"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useClusterData } from "@/hooks/useClusterData";
import type { BreadcrumbItem, CostNode, DrillLevel } from "@/types";
import { Breadcrumb } from "./Breadcrumb";
import { CostBarChart } from "./CostBarChart";
import { MetricsTable } from "./MetricsTable";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

const LEVELS: DrillLevel[] = ["cluster", "namespace", "pod"];

export function CostExplorer() {
  const { data, isLoading, error, refetch } = useClusterData();
  const [path, setPath] = useState<CostNode[]>([]);
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

  const handleDrillDown = useCallback((node: CostNode) => {
    if (!node.children?.length) return;
    setPath((prev) => [...prev, node]);
  }, []);

  const handleNavigate = useCallback((index: number) => {
    if (index === 0) {
      setPath([]);
    } else {
      setPath((prev) => prev.slice(0, index));
    }
  }, []);

  const headingText =
    path.length === 0
      ? "Cloud Cost Overview"
      : `${path[path.length - 1].name} — ${currentLevel === "namespace" ? "Namespaces" : "Pods"}`;

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
            <span className="rounded-full bg-mint px-4 py-1.5 text-sm font-semibold text-[#065f46]">
              {currentLevel === "cluster"
                ? "Cluster"
                : currentLevel === "namespace"
                  ? path[path.length - 1]?.name
                  : `${path[path.length - 2]?.name} — ${path[path.length - 1]?.name}`}
            </span>
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
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CostBarChart
              nodes={currentNodes}
              level={currentLevel}
              onSelect={handleDrillDown}
            />
            <MetricsTable nodes={currentNodes} level={currentLevel} />
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
