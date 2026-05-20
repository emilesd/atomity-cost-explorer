"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { BreadcrumbItem } from "@/types";
import { LEVEL_LABELS } from "@/types";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (index: number) => void;
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  const lastItem = items[items.length - 1];
  const levelLabel = lastItem ? LEVEL_LABELS[lastItem.level] : "Cluster";

  return (
    <nav
      aria-label="Cost hierarchy breadcrumb"
      className="flex flex-wrap items-center gap-x-1 gap-y-2"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <motion.span
              key={item.id}
              className="flex items-center"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {index > 0 && (
                <svg
                  className="inline-size-4 block-size-4 text-subtle mx-1 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {isLast ? (
                <span
                  className="font-semibold text-foreground"
                  aria-current="location"
                >
                  {item.name}
                </span>
              ) : (
                <button
                  onClick={() => onNavigate(index)}
                  className="text-muted hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-mint-dark focus-visible:outline-offset-2 rounded-sm"
                >
                  {item.name}
                </button>
              )}
            </motion.span>
          );
        })}
      </AnimatePresence>

      {items.length > 0 && (
        <motion.span
          key={`agg-${levelLabel}`}
          className="ms-auto rounded-full bg-mint-light px-3 py-1 text-xs font-medium text-mint-dark"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          Aggregated by: {levelLabel}
        </motion.span>
      )}
    </nav>
  );
}
