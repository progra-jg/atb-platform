import { View, ViewStyle, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../theme";
import { radii, shadows } from "../theme/tokens";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: keyof typeof paddingMap;
}

const paddingMap = { none: 0, sm: 8, md: 12, lg: 16, xl: 20 } as const;

export default function Card({ children, style, onPress, padding = "lg" }: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.card, { padding: paddingMap[padding] }, style]} onPress={onPress} activeOpacity={0.7}>
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    ...shadows.md,
  },
});
