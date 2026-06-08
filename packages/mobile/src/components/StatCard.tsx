import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

interface Props { label: string; value: string | number; color?: string }

export default function StatCard({ label, value, color = colors.primary }: Props) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    elevation: 2,
  },
  value: { fontSize: 20, fontWeight: "700" },
  label: { fontSize: 11, color: colors.textSecondary, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
});
