export interface CostBreakdown {
  cpu: number;
  ram: number;
  storage: number;
  network: number;
  gpu: number;
}

export interface CostNode {
  id: string;
  name: string;
  costs: CostBreakdown;
  total: number;
  efficiency: number;
  children?: CostNode[];
}

export type DrillLevel = "cluster" | "namespace" | "pod";

export interface BreadcrumbItem {
  id: string;
  name: string;
  level: DrillLevel;
}

export const COST_CATEGORIES: (keyof CostBreakdown)[] = [
  "cpu",
  "ram",
  "storage",
  "network",
  "gpu",
];

export const COST_LABELS: Record<keyof CostBreakdown, string> = {
  cpu: "CPU",
  ram: "RAM",
  storage: "Storage",
  network: "Network",
  gpu: "GPU",
};

export const LEVEL_LABELS: Record<DrillLevel, string> = {
  cluster: "Cluster",
  namespace: "Namespace",
  pod: "Pod",
};
