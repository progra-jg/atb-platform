import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { toggleFollow, isFollowing, getFollowStats } from "../services/follow";
import type { FollowStats } from "../types/follow";
import { UserPlus, UserMinus, Users } from "@phosphor-icons/react";

interface FollowButtonProps {
  farmerId: string;
  size?: "sm" | "md";
  variant?: "icon" | "full";
}

export default function FollowButton({ farmerId, size = "md", variant = "full" }: FollowButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [stats, setStats] = useState<FollowStats>({ followersCount: 0, followingCount: 0 });

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      isFollowing(user.id, farmerId),
      getFollowStats(farmerId),
    ]).then(([follow, s]) => {
      setFollowing(follow);
      setStats(s);
      setLoading(false);
    });
  }, [user?.id, farmerId]);

  const handleToggle = async () => {
    if (!user?.id || toggling) return;
    setToggling(true);
    const nowFollowing = await toggleFollow(user.id, farmerId);
    setFollowing(nowFollowing);
    setStats((prev) => ({
      ...prev,
      followersCount: nowFollowing ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1),
    }));
    setToggling(false);
  };

  if (loading) {
    return (
      <div style={{
        width: size === "sm" ? 32 : 36, height: size === "sm" ? 32 : 36, borderRadius: 10,
        background: colors.skeleton ?? colors.surface,
        animation: "shimmer 1.5s ease-in-out infinite",
      }} />
    );
  }

  const isSm = size === "sm";

  if (variant === "icon") {
    return (
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        disabled={toggling}
        style={{
          width: isSm ? 32 : 36, height: isSm ? 32 : 36, borderRadius: 10,
          border: `1.5px solid ${following ? colors.accent : colors.borderLight}`,
          background: following ? `${colors.accent}15` : colors.surface,
          cursor: toggling ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: following ? colors.accent : colors.textMuted,
          transition: "all 0.2s",
        }}
      >
        {following ? <UserMinus size={isSm ? 12 : 14} weight="fill" /> : <UserPlus size={isSm ? 12 : 14} />}
      </motion.button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={toggling}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: isSm ? "6px 12px" : "8px 16px", borderRadius: 10,
          border: `1.5px solid ${following ? colors.accent : colors.borderLight}`,
          background: following ? `${colors.accent}15` : colors.surface,
          cursor: toggling ? "not-allowed" : "pointer",
          color: following ? colors.accent : colors.text,
          fontSize: isSm ? 11 : 12, fontWeight: 600,
          transition: "all 0.2s", fontFamily: "inherit",
        }}
      >
        {following ? <UserMinus size={isSm ? 12 : 14} /> : <UserPlus size={isSm ? 12 : 14} />}
        {following ? t("follow.unfollow") : t("follow.follow")}
      </motion.button>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: colors.textMuted }}>
        <Users size={isSm ? 11 : 12} />
        <span style={{ fontSize: isSm ? 10 : 11, fontWeight: 500 }}>{stats.followersCount}</span>
      </div>
    </div>
  );
}
