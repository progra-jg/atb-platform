import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { useChromaticEntrainment } from "../hooks/useChromaticEntrainment";
import { colors } from "../theme";

interface ChromaticLoaderProps {
  active?: boolean;
  size?: number;
  style?: ViewStyle;
}

/**
 * Loader visuel à pulsation lente.
 * Simple indicateur décoratif de chargement.
 */
export default function ChromaticLoader({
  active = true,
  size = 24,
  style,
}: ChromaticLoaderProps) {
  const chroma1 = useChromaticEntrainment(active);
  const chroma2 = useChromaticEntrainment(active);

  if (!active) return null;

  const barW = Math.max(3, size * 0.15);
  const gap = Math.max(2, size * 0.12);

  return (
    <View style={[styles.row, { height: size, gap }, style]}>
      {[0.7, 1.0, 0.85, 1.0, 0.7].map((heightRatio, i) => {
        const chroma = i % 2 === 0 ? chroma1 : chroma2;
        return (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              {
                width: barW,
                height: size * heightRatio,
                borderRadius: barW / 2,
                opacity: chroma.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    backgroundColor: colors.primary,
  },
});
