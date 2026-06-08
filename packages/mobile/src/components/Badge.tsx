import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";
import { radii } from "../theme/tokens";

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  icon?: string;
  size?: "sm" | "md";
}

export default function Badge({ label, color = colors.textSecondary, bgColor, icon, size = "sm" }: BadgeProps) {
  const sizeStyles = size === "sm"
    ? { py: 3, px: 8, font: 10, iconSize: 12 }
    : { py: 5, px: 10, font: 12, iconSize: 14 };

  return (
    <View style={[styles.badge, {
      backgroundColor: bgColor || color + "18",
      paddingVertical: sizeStyles.py,
      paddingHorizontal: sizeStyles.px,
    }]}>
      {icon && <Text style={[styles.icon, { fontSize: sizeStyles.iconSize }]}>{icon}</Text>}
      <Text style={[styles.label, { color, fontSize: sizeStyles.font }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.sm,
    gap: 4,
    alignSelf: "flex-start",
  },
  icon: {},
  label: { fontWeight: "600", textTransform: "capitalize" },
});
