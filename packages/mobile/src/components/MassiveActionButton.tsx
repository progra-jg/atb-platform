import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from "react-native";
import { colors } from "../theme";
import { radii } from "../theme/tokens";

interface MassiveActionButtonProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  /** Couleur de fond (défaut: primary) */
  color?: string;
}

/**
 * Bouton d'action massif (Poka-Yoke).
 * Une seule action possible par écran critique.
 * Tellement gros qu'il est impossible de le rater.
 */
export default function MassiveActionButton({
  title,
  subtitle,
  icon,
  onPress,
  loading,
  disabled,
  style,
  color,
}: MassiveActionButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: disabled ? colors.border : (color || colors.primary) },
        disabled && { opacity: 0.5 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} size="large" />
      ) : (
        <View style={styles.content}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: 80,
    borderRadius: radii.xl,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  content: {
    alignItems: "center",
    gap: 4,
  },
  icon: {
    fontSize: 28,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.85,
    textAlign: "center",
    marginTop: 2,
  },
});
