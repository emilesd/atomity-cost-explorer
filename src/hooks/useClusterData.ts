import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api";
import { transformToClusterData } from "@/lib/transform";
import type { CostNode } from "@/types";

export function useClusterData() {
  return useQuery<CostNode[]>({
    queryKey: ["cluster-cost-data"],
    queryFn: async () => {
      const products = await fetchProducts();
      return transformToClusterData(products);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
