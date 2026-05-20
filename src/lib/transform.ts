import type { DummyProduct } from "./api";
import type { CostBreakdown, CostNode } from "@/types";

function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const value = String(item[key] ?? "unknown");
    if (!groups[value]) groups[value] = [];
    groups[value].push(item);
    return groups;
  }, {});
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function aggregateCosts(nodes: CostNode[]): CostBreakdown {
  return nodes.reduce<CostBreakdown>(
    (acc, node) => ({
      cpu: acc.cpu + node.costs.cpu,
      ram: acc.ram + node.costs.ram,
      storage: acc.storage + node.costs.storage,
      network: acc.network + node.costs.network,
      gpu: acc.gpu + node.costs.gpu,
    }),
    { cpu: 0, ram: 0, storage: 0, network: 0, gpu: 0 }
  );
}

function costTotal(costs: CostBreakdown): number {
  return costs.cpu + costs.ram + costs.storage + costs.network + costs.gpu;
}

function averageEfficiency(nodes: CostNode[]): number {
  if (nodes.length === 0) return 0;
  return Math.round(
    nodes.reduce((sum, n) => sum + n.efficiency, 0) / nodes.length
  );
}

function scaleCostNode(node: CostNode, factor: number): CostNode {
  const scaledCosts: CostBreakdown = {
    cpu: Math.round(node.costs.cpu * factor),
    ram: Math.round(node.costs.ram * factor),
    storage: Math.round(node.costs.storage * factor),
    network: Math.round(node.costs.network * factor),
    gpu: Math.round(node.costs.gpu * factor),
  };
  return { ...node, costs: scaledCosts, total: costTotal(scaledCosts) };
}

export function transformToClusterData(products: DummyProduct[]): CostNode[] {
  const categoryGroups = groupBy(products, "category");

  const sortedCategories = Object.entries(categoryGroups)
    .filter(([, prods]) => prods.length >= 4)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4);

  const clusterTargets = [6800, 5500, 4600, 2500];
  const efficiencyTargets = [10, 28, 15, 50];

  return sortedCategories.map(([, categoryProducts], i) => {
    const clusterLetter = String.fromCharCode(65 + i);
    const target = clusterTargets[i];

    const nsChunkSize = Math.max(
      1,
      Math.ceil(categoryProducts.length / 4)
    );
    const nsChunks = chunkArray(categoryProducts, nsChunkSize).slice(0, 4);

    const rawNamespaces: CostNode[] = nsChunks.map((chunk, j) => {
      const nsLetter = String.fromCharCode(65 + j);
      const podChunkSize = Math.max(1, Math.ceil(chunk.length / 4));
      const podChunks = chunkArray(chunk, podChunkSize).slice(0, 4);

      const pods: CostNode[] = podChunks.map((podProducts, k) => {
        const avgPrice =
          podProducts.reduce((s, p) => s + p.price, 0) / podProducts.length;
        const avgRating =
          podProducts.reduce((s, p) => s + p.rating, 0) / podProducts.length;
        const avgWeight =
          podProducts.reduce((s, p) => s + p.weight, 0) / podProducts.length;
        const avgStock =
          podProducts.reduce((s, p) => s + p.stock, 0) / podProducts.length;

        const costs: CostBreakdown = {
          cpu: Math.round(avgPrice * 2.8 * podProducts.length),
          ram: Math.round(avgPrice * 1.5 * podProducts.length),
          storage: Math.round(avgPrice * 0.3 * podProducts.length),
          network: Math.round(
            (avgWeight * 10 + avgStock * 0.5) * podProducts.length
          ),
          gpu: Math.round(
            avgPrice * (avgRating > 4.2 ? 1.1 : 0.4) * podProducts.length
          ),
        };

        return {
          id: `pod-${i}-${j}-${k}`,
          name: `Pod ${String.fromCharCode(65 + k)}`,
          costs,
          total: costTotal(costs),
          efficiency: Math.min(
            95,
            Math.max(
              5,
              Math.round((avgRating / 5) * 55 + (Math.round(avgStock) % 30))
            )
          ),
        };
      });

      const nsCosts = aggregateCosts(pods);
      return {
        id: `ns-${i}-${j}`,
        name: `Namespace ${nsLetter}`,
        costs: nsCosts,
        total: costTotal(nsCosts),
        efficiency: averageEfficiency(pods),
        children: pods,
      };
    });

    const rawTotal = rawNamespaces.reduce((sum, ns) => sum + ns.total, 0);
    const scaleFactor = rawTotal > 0 ? target / rawTotal : 1;

    const namespaces: CostNode[] = rawNamespaces.map((ns) => {
      const scaledPods = ns.children?.map((pod) => scaleCostNode(pod, scaleFactor));
      const nsCosts = aggregateCosts(scaledPods ?? []);
      return {
        ...ns,
        costs: nsCosts,
        total: costTotal(nsCosts),
        children: scaledPods,
      };
    });

    const clusterCosts = aggregateCosts(namespaces);
    return {
      id: `cluster-${i}`,
      name: `Cluster ${clusterLetter}`,
      costs: clusterCosts,
      total: costTotal(clusterCosts),
      efficiency: efficiencyTargets[i],
      children: namespaces,
    };
  });
}
