import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";
import EmptyState from "../components/EmptyState";

interface AlerteMeteo {
  id: string;
  type: "pluie" | "secheresse" | "vent" | "chaleur" | "inondation";
  niveau: "info" | "warning" | "danger";
  titre: string;
  message: string;
  zone: string;
  date: string;
  valableJusqu: string;
  source: string;
}

const MOCK_ALERTES: AlerteMeteo[] = [
  { id: "met-001", type: "pluie", niveau: "warning", titre: "Forte pluie attendue", message: "Précipitations de 40-60mm prévues dans les prochaines 48h. Risque d'inondation dans les bas-fonds.", zone: "Zou - Covè", date: "2026-06-08", valableJusqu: "2026-06-10", source: "Météo Bénin / ASECNA" },
  { id: "met-002", type: "secheresse", niveau: "danger", titre: "Sécheresse prolongée", message: "15 jours sans précipitations significatives. Irriguez les cultures sensibles et retardez les semis.", zone: "Alibori - Malanville", date: "2026-06-07", valableJusqu: "2026-06-20", source: "Météo Bénin" },
  { id: "met-003", type: "vent", niveau: "info", titre: "Vents modérés", message: "Rafales de 30-40 km/h annoncées. Vérifiez les tuteurs des cultures grimpantes.", zone: "Atlantique - Cotonou", date: "2026-06-08", valableJusqu: "2026-06-09", source: "ASECNA" },
  { id: "met-004", type: "chaleur", niveau: "warning", titre: "Canicule", message: "Températures > 38°C attendues. Hydratez le bétail et paillez les sols.", zone: "Borgou - Parakou", date: "2026-06-08", valableJusqu: "2026-06-12", source: "Météo Bénin" },
  { id: "met-005", type: "pluie", niveau: "info", titre: "Bonne pluie pour les semis", message: "20-30mm attendus. Conditions favorables pour les semis de maïs et niébé.", zone: "Collines - Dassa", date: "2026-06-06", valableJusqu: "2026-06-09", source: "ASECNA" },
];

const NIVEAU_STYLES = {
  info: { bg: colors.secondary + "20", text: colors.secondary },
  warning: { bg: colors.warning + "20", text: colors.warning },
  danger: { bg: colors.error + "20", text: colors.error },
};

const TYPE_LABELS = {
  pluie: "🌧️", secheresse: "☀️", vent: "💨", chaleur: "🔥", inondation: "🌊",
};

const CONSEILS: Record<string, string> = {
  pluie: "Surveillez les bas-fonds et préparez le drainage",
  secheresse: "Arrosez tôt le matin et paillez les sols",
  vent: "Renforcez les tuteurs et serres",
  chaleur: "Hydratez le bétail et protégez les semis",
  inondation: "Évacuez les zones à risque",
};

export default function AlertMeteoScreen() {
  const [filtreNiveau, setFiltreNiveau] = useState<string | null>(null);
  const alertes = filtreNiveau ? MOCK_ALERTES.filter(a => a.niveau === filtreNiveau) : MOCK_ALERTES;

  const header = (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>🌤️ Alertes météo</Text>
        <Text style={styles.sub}>Basé sur les prévisions Météo Bénin / ASECNA</Text>
      </View>
      <View style={styles.filters}>
        {[null, "info", "warning", "danger"].map((n) => (
          <TouchableOpacity key={n || "all"} style={[styles.filterBtn, filtreNiveau === n && styles.filterActive]} onPress={() => setFiltreNiveau(n)}>
            <Text style={[styles.filterText, filtreNiveau === n && styles.filterTextActive]}>{n ? { info: "💚 Info", warning: "⚠️ Warning", danger: "🔴 Danger" }[n] : "Toutes"}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={alertes}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="Aucune alerte" />}
        renderItem={({ item }) => {
          const ns = NIVEAU_STYLES[item.niveau];
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.typeRow}>
                  <Text style={styles.typeIcon}>{TYPE_LABELS[item.type]}</Text>
                  <Text style={styles.titre}>{item.titre}</Text>
                </View>
                <View style={[styles.niveauBadge, { backgroundColor: ns.bg }]}>
                  <Text style={[styles.niveauText, { color: ns.text }]}>{item.niveau.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.zone}>📍 {item.zone}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <View style={styles.conseilBox}>
                <Text style={styles.conseilLabel}>💡 Conseil</Text>
                <Text style={styles.conseil}>{CONSEILS[item.type] || "Restez vigilant"}</Text>
              </View>
              <View style={styles.footer}>
                <Text style={styles.source}>{item.source}</Text>
                <Text style={styles.date}>📅 {item.date} → {item.valableJusqu}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  sub: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  filters: { flexDirection: "row", gap: 6, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceAlt },
  filterActive: { backgroundColor: colors.primary + "30" },
  filterText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  filterTextActive: { color: colors.primary },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  typeIcon: { fontSize: 22 },
  titre: { fontSize: 15, fontWeight: "700", color: colors.text, flex: 1 },
  niveauBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  niveauText: { fontSize: 10, fontWeight: "700" },
  zone: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  message: { fontSize: 13, color: colors.text, lineHeight: 18 },
  conseilBox: { backgroundColor: colors.secondary + "12", padding: 10, borderRadius: 10, marginTop: 8 },
  conseilLabel: { fontSize: 10, fontWeight: "700", color: colors.secondary, textTransform: "uppercase" },
  conseil: { fontSize: 12, color: colors.text, marginTop: 2 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  source: { fontSize: 10, color: colors.textTertiary },
  date: { fontSize: 10, color: colors.textTertiary },
});
