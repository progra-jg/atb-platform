import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, useTheme } from "../theme";
import { useEffect, useState, useRef } from "react";

interface StaleDataWrapperProps {
  /** Les données à afficher (peuvent être périmées) */
  children: React.ReactNode;
  /** Timestamp ISO de la dernière mise à jour */
  lastUpdated: string | Date | null;
  /** TTL en minutes (défaut 5) */
  ttlMinutes?: number;
  /** Style du conteneur */
  style?: ViewStyle;
  /** Contenu optionnel à montrer si aucune donnée (même périmée) n'existe */
  fallback?: React.ReactNode;
}

/**
 * Chrono-Caching Visuel.
 *
 * Ne supprime JAMAIS visuellement une donnée avant d'avoir reçu la nouvelle.
 * Si le TTL (5 min) est dépassé, les données sont teintées d'une "patine visuelle"
 * (légère désaturation, texte en italique, icône d'horloge, timestamp).
 *
 * L'utilisateur n'est JAMAIS confronté au vide.
 */
export default function StaleDataWrapper({
  children,
  lastUpdated,
  ttlMinutes = 5,
  style,
  fallback,
}: StaleDataWrapperProps) {
  const { isDark } = useTheme();
  const [now, setNow] = useState(Date.now());
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timer.current = setInterval(() => setNow(Date.now()), 30_000); // check every 30s
    return () => clearInterval(timer.current);
  }, []);

  if (!lastUpdated && !fallback) {
    // Aucune donnée du tout → on montre un message plutôt que du vide
    return (
      <View style={[styles.container, style]}>
        <Text style={[styles.patinaText, { color: colors.textTertiary }]}>
          ⏳ Aucune donnée disponible
        </Text>
      </View>
    );
  }

  if (!lastUpdated && fallback) {
    return <>{fallback}</>;
  }

  const lastUpdateTime = new Date(lastUpdated!).getTime();
  const diffMs = now - lastUpdateTime;
  const diffMin = diffMs / 60_000;
  const isStale = diffMin > ttlMinutes;

  // Formater l'heure de dernière mise à jour
  const formattedTime = new Date(lastUpdated!).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = new Date(lastUpdated!).toLocaleDateString();

  return (
    <View style={[isStale && styles.staleContainer, style]}>
      {children}

      {/* Patine visuelle : badge de fraîcheur */}
      <View style={styles.freshnessBar}>
        <Text style={[styles.freshnessIcon, isStale && { opacity: 0.6 }]}>
          {isStale ? "⏰" : "🟢"}
        </Text>
        <Text
          style={[
            styles.freshnessText,
            isStale && styles.staleText,
            { color: isStale ? colors.textTertiary : colors.textSecondary },
          ]}
        >
          {isStale
            ? `Données du ${formattedDate} à ${formattedTime} (${Math.round(diffMin)} min)`
            : `Mis à jour à ${formattedTime}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  staleContainer: {
    opacity: 0.85,
  },
  patinaText: {
    fontSize: 14,
    fontWeight: "500",
    fontStyle: "italic",
  },
  freshnessBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  freshnessIcon: {
    fontSize: 10,
  },
  freshnessText: {
    fontSize: 10,
    fontWeight: "400",
  },
  staleText: {
    fontStyle: "italic",
    fontWeight: "400",
  },
});
