import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme";

interface LocalValidationBadgeProps {
  /** Type de validation */
  type?: "local" | "pending" | "synced";
  style?: ViewStyle;
}

/**
 * Badge de statut de synchronisation.
 * Indique si la donnée est validée localement, en attente,
 * ou synchronisée avec le serveur.
 */
export default function LocalValidationBadge({
  type = "local",
  style,
}: LocalValidationBadgeProps) {
  const config = {
    local: { icon: "✓", label: "Validé localement", color: colors.success },
    pending: { icon: "⏳", label: "Validation en cours…", color: colors.warning },
    synced: { icon: "✓", label: "Synchronisé", color: colors.primary },
  };

  const c = config[type];

  return (
    <View style={[styles.badge, { backgroundColor: c.color + "12", borderColor: c.color + "25" }, style]}>
      <Text style={[styles.icon, { color: c.color }]}>{c.icon}</Text>
      <Text style={[styles.label, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  icon: { fontSize: 11, fontWeight: "700" },
  label: { fontSize: 10, fontWeight: "600" },
});
