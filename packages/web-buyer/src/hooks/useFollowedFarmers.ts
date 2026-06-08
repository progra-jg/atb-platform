import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getFollowing, getProducerFeed } from "../services/follow";
import { fetchFarmersList } from "../services/farmers";

export function useFollowedFarmers() {
  const { user } = useAuth();

  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: ["following", user?.id],
    queryFn: () => user?.id ? getFollowing(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  const { data: farmers = [] } = useQuery({
    queryKey: ["farmersList"],
    queryFn: () => fetchFarmersList(),
  });

  const followedProfiles = useMemo(() => {
    const ids = new Set(following.map((f) => f.farmerId));
    return farmers.filter((f) => ids.has(f.anonymousId));
  }, [farmers, following]);

  return { following, followedProfiles, isLoading: followingLoading };
}

export function useFollowedFeed() {
  const { user } = useAuth();

  const { data: feed = [], isLoading } = useQuery({
    queryKey: ["followedFeed", user?.id],
    queryFn: () => user?.id ? getProducerFeed(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });

  return { feed, isLoading };
}
