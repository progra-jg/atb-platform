import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme";
import { radii } from "../theme/tokens";

interface SkeletonProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  flex?: number;
}

export default function Skeleton({ width, height = 16, borderRadius = radii.sm, style, flex }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[{ width, height, flex, borderRadius, backgroundColor: colors.border, opacity }, style]} />
  );
}

export function SkeletonCard() {
  return (
    <View style={cardStyles.card}>
      <Skeleton flex={1} height={14} style={{ marginBottom: 8 }} />
      <Skeleton flex={1} height={12} style={{ marginBottom: 4 }} />
      <Skeleton flex={0.6} height={12} />
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ padding: 16, gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radii.lg,
  },
});
