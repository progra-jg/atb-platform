import { View, ViewStyle, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../theme";
import { radii, shadows } from "../theme/tokens";
import { usePerformance } from "../contexts/PerformanceContext";

interface AdaptiveCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: keyof typeof paddingMap;
}

const paddingMap = { none: 0, sm: 8, md: 12, lg: 16, xl: 20 } as const;

/**
 * Carte adaptative au Thermal-Throttling.
 * En mode Performance Critique, les ombres sont supprimées
 * et le border radius est réduit pour économiser le GPU.
 */
export default function AdaptiveCard({ children, style, onPress, padding = "lg" }: AdaptiveCardProps) {
  const { isPerformanceMode } = usePerformance();
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[
        styles.card,
        { padding: paddingMap[padding] },
        isPerformanceMode ? styles.performanceMode : shadows.md,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
  performanceMode: {
    // Pas d'ombre, pas de border-radius → économie GPU
    borderRadius: 0,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
});
