import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFarmerProfile } from "../services/farmers";
import { fetchOrders } from "../services/orders";
import { getSellerReviews } from "../services/reviews";
import { fetchLots } from "../services/lots";
import { computeTrustScore, type TrustScoreResult } from "../utils/scoring";

export function useTrustScore(farmerId: string | undefined): {
  data: TrustScoreResult | null;
  isLoading: boolean;
  isError: boolean;
} {
  const { data: farmer, isLoading: farmerLoading, isError: farmerError } = useQuery({
    queryKey: ["farmer", farmerId],
    queryFn: () => fetchFarmerProfile(farmerId || ""),
    enabled: !!farmerId,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["farmerReviews", farmerId],
    queryFn: () => farmerId ? getSellerReviews(farmerId) : Promise.resolve([]),
    enabled: !!farmerId,
  });

  const { data: lots = [] } = useQuery({
    queryKey: ["lots"],
    queryFn: () => fetchLots(),
  });

  const result = useMemo(() => {
    if (!farmer) return null;
    const farmerLots = farmer.displayName
      ? lots.filter((l) => l.producteur === farmer.displayName)
      : [];
    return computeTrustScore(farmer, orders, farmerLots, reviews);
  }, [farmer, orders, lots, reviews]);

  return {
    data: result,
    isLoading: farmerLoading,
    isError: farmerError,
  };
}

export function useInferredLotTrustScore(lotNote: number, hasCertification: boolean, isAvailable: boolean): number {
  return useMemo(() => {
    return Math.round(
      (lotNote ?? 50) * 0.4 +
      (hasCertification ? 30 : 0) +
      (isAvailable ? 15 : 0)
    );
  }, [lotNote, hasCertification, isAvailable]);
}
