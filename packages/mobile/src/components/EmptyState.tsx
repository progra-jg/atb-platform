import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";
import Button from "./Button";

interface Props { icon?: string; title: string; subtitle?: string; actionLabel?: string; onAction?: () => void }

export default function EmptyState({ icon = "📭", title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" size="sm" style={{ marginTop: 16 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "600", color: colors.textSecondary, textAlign: "center" },
  subtitle: { fontSize: 13, color: colors.textTertiary, textAlign: "center", marginTop: 4 },
});
