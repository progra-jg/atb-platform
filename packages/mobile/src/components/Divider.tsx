import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme";
import { spacing } from "../theme/tokens";

interface DividerProps {
  style?: ViewStyle;
  color?: string;
  thickness?: number;
  margin?: number;
}

export default function Divider({ style, color, thickness = 1, margin = spacing.lg }: DividerProps) {
  return (
    <View style={[styles.divider, { borderBottomWidth: thickness, borderBottomColor: color || colors.border, marginVertical: margin }, style]} />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: "100%",
  },
});
