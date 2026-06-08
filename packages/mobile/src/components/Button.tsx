import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { colors } from "../theme";
import { radii } from "../theme/tokens";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: string;
}

const heightMap = { sm: 36, md: 44, lg: 52 } as const;
const fontMap = { sm: 13, md: 15, lg: 17 } as const;

export default function Button({ title, onPress, variant = "primary", size = "md", loading, disabled, style, icon }: ButtonProps) {
  const bg = variant === "primary" ? colors.primary
    : variant === "secondary" ? colors.secondary
    : variant === "danger" ? colors.error
    : "transparent";
  const txt = variant === "outline" || variant === "ghost" ? (variant === "outline" ? colors.primary : colors.textSecondary)
    : colors.white;
  const border = variant === "outline" ? colors.primary : "transparent";

  return (
    <TouchableOpacity
      style={[styles.base, {
        height: heightMap[size],
        backgroundColor: disabled ? colors.border : bg,
        borderWidth: variant === "outline" ? 1.5 : 0,
        borderColor: border,
        opacity: disabled ? 0.5 : 1,
      }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={txt} size="small" />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.text, { color: txt, fontSize: fontMap[size] }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    paddingHorizontal: 20,
    gap: 8,
  },
  text: { fontWeight: "600" },
  icon: { fontSize: 16 },
});
