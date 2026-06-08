import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { colors, radii, shadows } from "../theme";

interface ThumbButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  /** Largeur en % de l'écran. Minimum 25% recommandé. */
  widthPercent?: number;
  style?: ViewStyle;
}

export default function ThumbButton({
  title, onPress, icon, variant = "primary", loading, disabled, widthPercent = 90, style,
}: ThumbButtonProps) {
  const bg = variant === "primary" ? colors.primary
    : variant === "secondary" ? colors.secondary
    : colors.error;
  const txt = colors.white;

  return (
    <TouchableOpacity
      style={[styles.button, {
        backgroundColor: disabled ? colors.border : bg,
        width: `${widthPercent}%` as any,
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
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: radii.lg,
    gap: 10,
    alignSelf: "center",
    ...shadows.md,
  },
  text: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  icon: {
    fontSize: 20,
  },
});
