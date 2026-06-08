import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import EmptyState from "../components/EmptyState";
import { getStatusLabel } from "../utils/format";

const MOCK_MISSIONS = [
  { id: "m1", origine: "Parakou", destination: "Cotonou", corridor: "RNIE 2", dateChargement: "2026-06-10", statut: "en_route", avanceCarburant: 50000, avanceVersee: true, fretRetour: true, commissionRetour: 7500, checkpoints: [{ nom: "Péage Glazoué", type: "peage", ussdCode: "*123*PEAGE_GLA#", checkedAt: "2026-06-10 14:30" }, { nom: "Péage Bohicon", type: "peage", ussdCode: "*123*PEAGE_BOH#", checkedAt: undefined }] },
  { id: "m2", origine: "Cotonou", destination: "Bohicon", corridor: "RNIE 2", dateChargement: "2026-06-12", statut: "affectee", avanceCarburant: 30000, avanceVersee: false, fretRetour: false, commissionRetour: 0, checkpoints: [] },
];

export default function TransportScreen() {
  const { t } = useTranslation();
  const [missions, setMissions] = useState(MOCK_MISSIONS);
  const [refreshing, setRefreshing] = useState(false);

  const handleCheckIn = (mission: any, checkpoint: any) => {
    Alert.alert(
      `Check-in ${checkpoint.nom}`,
      `Composer : ${checkpoint.ussdCode}\nou appuyer pour valider`,
      [
        { text: "Composer USSD", onPress: () => {} },
        { text: t("common.confirm"), onPress: () => {
          const updated = missions.map(m => m.id === mission.id ? { ...m, checkpoints: m.checkpoints.map((cp: any) => cp.nom === checkpoint.nom ? { ...cp, checkedAt: new Date().toISOString() } : cp) } : m);
          setMissions(updated);
        }},
        { text: t("common.cancel"), style: "cancel" },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={missions}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState title={t("transport.noMissions")} />}
        contentContainerStyle={missions.length === 0 ? { flex: 1, padding: 16 } : { padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>🚚 {t("transport.commissionRetour")}</Text>
            <Text style={styles.bannerText}>{t("transport.fretRetourDesc")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.route}>{item.origine} → {item.destination}</Text>
              <View style={[styles.badge, { backgroundColor: item.statut === "en_route" ? colors.success + "20" : colors.accent + "20" }]}>
                <Text style={[styles.badgeText, { color: item.statut === "en_route" ? colors.success : colors.accent }]}>{getStatusLabel(item.statut)}</Text>
              </View>
            </View>
            <Text style={styles.corridor}>🛣️ {item.corridor} — {item.dateChargement}</Text>
            <View style={styles.avanceRow}>
              <Text style={styles.avanceLabel}>{t("transport.avanceCarburant")}: {item.avanceCarburant.toLocaleString()} FCFA</Text>
              <Text style={[styles.avanceStatus, item.avanceVersee ? { color: colors.success } : { color: colors.accent }]}>
                {item.avanceVersee ? "✓ Versée" : "⏳ En attente"}
              </Text>
            </View>
            {item.fretRetour && (
              <View style={styles.fretRow}>
                <Text style={styles.fretLabel}>🔄 Fret retour organisé par AgriTrace</Text>
                <Text style={styles.fretCommission}>Commission 5% : {item.commissionRetour.toLocaleString()} FCFA</Text>
                <Text style={styles.fretHint}>Évite 100% de perte sur voyage retour — vous ne payez que le succès</Text>
              </View>
            )}
            {item.checkpoints.filter((cp: any) => !cp.checkedAt).length > 0 && (
              <View style={styles.checkpoints}>
                <Text style={styles.checkpointTitle}>{t("transport.checkIn")}</Text>
                {item.checkpoints.filter((cp: any) => !cp.checkedAt).map((cp: any, i: number) => (
                  <TouchableOpacity key={i} style={styles.checkpointBtn} onPress={() => handleCheckIn(item, cp)}>
                    <Text style={styles.checkpointName}>📍 {cp.nom} ({cp.type})</Text>
                    <Text style={styles.checkpointUssd}>{cp.ussdCode}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {item.checkpoints.filter((cp: any) => cp.checkedAt).map((cp: any, i: number) => (
              <View key={i} style={styles.checkedRow}>
                <Text style={styles.checkedText}>✅ {cp.nom} — {cp.checkedAt}</Text>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  banner: { backgroundColor: colors.accent + "10", padding: 14, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.accent + "20" },
  bannerTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 4 },
  bannerText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  card: { marginBottom: 12, borderRadius: 14, backgroundColor: colors.surface, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  route: { fontSize: 15, fontWeight: "700", color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  corridor: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  avanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surfaceAlt, padding: 10, borderRadius: 10, marginBottom: 8 },
  avanceLabel: { fontSize: 13, color: colors.text, fontWeight: "500" },
  avanceStatus: { fontSize: 12, fontWeight: "600" },
  fretRow: { backgroundColor: colors.success + "10", borderWidth: 1, borderColor: colors.success + "30", padding: 10, borderRadius: 10, marginBottom: 8 },
  fretLabel: { fontSize: 12, fontWeight: "700", color: colors.success, marginBottom: 2 },
  fretCommission: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 2 },
  fretHint: { fontSize: 10, color: colors.textTertiary, fontStyle: "italic" },
  checkpoints: { marginTop: 4 },
  checkpointTitle: { fontSize: 12, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  checkpointBtn: { backgroundColor: colors.accent + "10", borderWidth: 1, borderColor: colors.accent + "30", padding: 12, borderRadius: 10, marginBottom: 6 },
  checkpointName: { fontSize: 14, fontWeight: "600", color: colors.text },
  checkpointUssd: { fontSize: 12, color: colors.accent, fontFamily: "monospace", marginTop: 2 },
  checkedRow: { backgroundColor: colors.successLight, padding: 8, borderRadius: 8, marginBottom: 4 },
  checkedText: { fontSize: 12, color: colors.success, fontWeight: "500" },
});
