import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

interface Props { size?: "small" | "large"; fullScreen?: boolean; message?: string }

export default function LoadingSpinner({ size = "large", fullScreen = true, message }: Props) {
  if (!fullScreen) return <ActivityIndicator size={size} color={colors.primary} />;
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  message: { fontSize: 13, color: colors.textTertiary, marginTop: 12 },
});
