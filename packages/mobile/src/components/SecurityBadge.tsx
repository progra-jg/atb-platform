import { View, Text, Animated, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme";
import { useTheme } from "../theme";
import { useChromaticEntrainment } from "../hooks/useChromaticEntrainment";

interface SecurityBadgeProps {
  /** Hash court affiché (ex: A7F3...B92C) */
  hash?: string;
  /** Variante de taille */
  size?: "sm" | "md";
  /** Position en absolute ou en static */
  fixed?: boolean;
  style?: ViewStyle;
  /** Active la pulsation (pendant flux paiement) */
  pulsing?: boolean;
}

const HASH_CHARS = "ABCDEF0123456789";

function generateHash(): string {
  let h = "";
  for (let i = 0; i < 4; i++) h += HASH_CHARS[Math.floor(Math.random() * 16)];
  return h + "…" + "SEC";
}

/**
 * Badge de suivi de transaction.
 *
 * Reste immobile à l'écran pendant tout le flux
 * critique (paiement, KYC, signature). En mode `pulsing`, une pulsation
 * douce indique l'état de chargement.
 */
export default function SecurityBadge({
  hash,
  size = "sm",
  fixed = true,
  style,
  pulsing = false,
}: SecurityBadgeProps) {
  const { colors: themeColors } = useTheme();
  const chroma = useChromaticEntrainment(pulsing);
  const displayHash = hash || generateHash();

  const Wrapper = pulsing ? Animated.View : View;

  return (
    <Wrapper
      style={[
        styles.badge,
        size === "md" && styles.badgeMd,
        fixed && styles.fixed,
        { backgroundColor: themeColors.surfaceAlt },
        pulsing && {
          opacity: chroma.interpolate({
            inputRange: [0, 1],
            outputRange: [0.92, 1],
          }),
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.shield, size === "md" && styles.shieldMd]}>🔒</Text>
      <View style={styles.textCol}>
        <Text style={[styles.label, size === "md" && styles.labelMd]}>
          Sécurisé · Contrat traçable
        </Text>
        <Text style={[styles.hash, size === "md" && styles.hashMd]}>
          {displayHash}
        </Text>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "center",
  },
  badgeMd: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  fixed: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  shield: { fontSize: 12 },
  shieldMd: { fontSize: 16 },
  textCol: {},
  label: { fontSize: 10, fontWeight: "600", color: colors.textSecondary, letterSpacing: 0.3 },
  labelMd: { fontSize: 12, letterSpacing: 0.4 },
  hash: { fontSize: 8, color: colors.textTertiary, fontFamily: "monospace", letterSpacing: 1 },
  hashMd: { fontSize: 10, letterSpacing: 1.2 },
});
