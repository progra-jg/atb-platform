import { View, Text, StyleSheet } from "react-native";
import { colors, typography } from "../theme";
import PriceText from "../components/PriceText";

interface SimulatedGainsProps {
  /** Prix estimé par kg */
  prixEstime: number;
  /** Volume en kg */
  volume: number;
  /** Nom du produit */
  produit: string;
}

/**
 * Composant "Argent fictif visible" (Séquence d'Engagement Forcée).
 *
 * Affiche les gains potentiels AVANT que l'utilisateur ait complété
 * son KYC. L'argent est visuellement présent et "brillant",
 * créant un biais des coûts irrécupérables : l'utilisateur fera
 * son KYC pour libérer cette récompense.
 */
export default function SimulatedGains({ prixEstime, volume, produit }: SimulatedGainsProps) {
  const total = prixEstime * volume;
  const fraisSequestre = Math.round(total * 0.02);
  const net = total - fraisSequestre;

  return (
    <View style={styles.container}>
      <View style={styles.glow} />
      <Text style={styles.badge}>💰 Gain potentiel estimé</Text>

      <Text style={styles.produit}>{produit}</Text>

      <View style={styles.priceRow}>
        <PriceText value={prixEstime} size="lg" />
        <Text style={styles.perKg}>/kg</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>{volume.toLocaleString()} kg</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Total brut</Text>
          <PriceText value={total} size="sm" />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Net (séq. 2%)</Text>
          <PriceText value={net} size="sm" />
        </View>
      </View>

      <Text style={styles.lockNote}>
        🔐 Complétez votre KYC pour libérer ces fonds
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.accent + "30",
    overflow: "hidden",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.accent,
    opacity: 0.04,
    borderRadius: 20,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  produit: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 16,
  },
  perKg: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    width: "100%",
    marginBottom: 12,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  lockNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
});
