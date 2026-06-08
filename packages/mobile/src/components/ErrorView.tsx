import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";

interface Props { message?: string; onRetry?: () => void }

export default function ErrorView({ message = "Une erreur est survenue", onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  message: { fontSize: 15, color: colors.textSecondary, textAlign: "center", marginBottom: 16 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: colors.white, fontWeight: "600", fontSize: 14 },
});
