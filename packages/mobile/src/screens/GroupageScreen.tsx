import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import EmptyState from "../components/EmptyState";

const COMMISSION_PERCENT = 6;

const MOCK_GROUPAGES = [
  { id: "g1", corridor: "RNIE 2 (Parakou → Cotonou)", pointCollecte: "Carrefour Glazoué", gps: [8.123, 2.567] as [number, number], lots: [{ lotId: "l1", quantite: 3000, producteur: "Koffi A." }, { lotId: "l2", quantite: 2500, producteur: "Marie D." }], dateGroupement: "2026-06-11", coutProrata: [{ producteurId: "p1", montant: 45000 }, { producteurId: "p2", montant: 37500 }], fretRetour: true, commissionAgriTrace: 4950 },
];

export default function GroupageScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_GROUPAGES}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <TouchableOpacity style={styles.createBtn}>
              <Text style={styles.createBtnText}>+ {t("groupage.create")}</Text>
            </TouchableOpacity>
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>🚚 Optimisation de groupage</Text>
              <Text style={styles.bannerText}>Groupement linéaire par corridor routier — point de collecte toujours en bord de route.</Text>
              <Text style={styles.bannerText}>Commission AgriTrace : {COMMISSION_PERCENT}% uniquement sur le fret de retour optimisé.</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState title={t("groupage.noGroupage")} />}
        contentContainerStyle={MOCK_GROUPAGES.length === 0 ? { flex: 1, padding: 16 } : { padding: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.corridor}>🛣️ {item.corridor}</Text>
            <View style={styles.collecteRow}>
              <Text style={styles.collecteLabel}>{t("groupage.pointCollecte")}:</Text>
              <Text style={styles.collecteValue}>{item.pointCollecte}</Text>
            </View>
            <Text style={styles.date}>{item.dateGroupement}</Text>

            <Text style={styles.sectionTitle}>{t("groupage.lots")} ({item.lots.length})</Text>
            {item.lots.map((l, i) => (
              <View key={i} style={styles.lotRow}>
                <Text style={styles.lotName}>{l.producteur}</Text>
                <Text style={styles.lotQt}>{l.quantite.toLocaleString()} kg</Text>
              </View>
            ))}

            <View style={styles.prorataBox}>
              <Text style={styles.sectionTitle}>{t("groupage.coutProrata")}</Text>
              {item.coutProrata.map((c, i) => (
                <View key={i} style={styles.coutRow}>
                  <Text style={styles.coutName}>Producteur {i + 1}</Text>
                  <Text style={styles.coutMontant}>{c.montant.toLocaleString()} FCFA</Text>
                </View>
              ))}
            </View>

            {item.fretRetour && (
              <View style={styles.commissionRow}>
                <Text style={styles.commissionLabel}>🔄 Fret retour optimisé</Text>
                <Text style={styles.commissionValue}>Commission {COMMISSION_PERCENT}% : {item.commissionAgriTrace.toLocaleString()} FCFA</Text>
                <Text style={styles.commissionHint}>Uniquement sur le fret de retour — pas de frais sur le trajet principal</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  createBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 8 },
  createBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  banner: { backgroundColor: colors.accent + "08", padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.accent + "20" },
  bannerTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 4 },
  bannerText: { fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
  card: { marginBottom: 12, borderRadius: 14, backgroundColor: colors.surface, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  corridor: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4 },
  collecteRow: { flexDirection: "row", gap: 4, marginBottom: 2 },
  collecteLabel: { fontSize: 13, color: colors.textSecondary },
  collecteValue: { fontSize: 13, fontWeight: "600", color: colors.text },
  date: { fontSize: 12, color: colors.textTertiary, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8, marginBottom: 4 },
  lotRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.surfaceAlt, padding: 8, borderRadius: 8, marginBottom: 4 },
  lotName: { fontSize: 13, color: colors.text },
  lotQt: { fontSize: 13, fontWeight: "600", color: colors.primary },
  prorataBox: { marginBottom: 4 },
  coutRow: { flexDirection: "row", justifyContent: "space-between", padding: 6 },
  coutName: { fontSize: 12, color: colors.textSecondary },
  coutMontant: { fontSize: 12, fontWeight: "600", color: colors.text },
  commissionRow: { backgroundColor: colors.success + "10", borderWidth: 1, borderColor: colors.success + "30", padding: 10, borderRadius: 10, marginTop: 4 },
  commissionLabel: { fontSize: 12, fontWeight: "700", color: colors.success, marginBottom: 2 },
  commissionValue: { fontSize: 13, fontWeight: "600", color: colors.text },
  commissionHint: { fontSize: 10, color: colors.textTertiary, fontStyle: "italic", marginTop: 2 },
});
