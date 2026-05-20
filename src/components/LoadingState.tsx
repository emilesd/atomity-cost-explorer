"use client";

import { motion } from "framer-motion";

export function LoadingState() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-label="Loading cost data"
    >
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className="rounded-[var(--radius-lg)] bg-surface-alt"
            style={{ blockSize: `${180 - i * 30}px` }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className="h-12 rounded-[var(--radius-md)] bg-surface-alt"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      <span className="sr-only">Loading cloud cost data…</span>
    </div>
  );
}
