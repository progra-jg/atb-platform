export interface FollowRelation {
  farmerId: string;
  followedAt: string;
  notifications: boolean;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}

export interface ProducerFeedItem {
  farmerId: string;
  farmerName: string;
  farmerAvatar: string;
  lotId: string;
  crop: string;
  quantity: string;
  price: number;
  postedAt: string;
  status: string;
}
