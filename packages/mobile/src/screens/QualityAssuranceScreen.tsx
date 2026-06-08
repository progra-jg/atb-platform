import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { colors } from "../theme";
import EmptyState from "../components/EmptyState";

interface Echantillon {
  id: string;
  lotId: string;
  produit: string;
  datePrelevement: string;
  statut: "demande" | "preleve" | "en_analyse" | "complete";
  laboratoire: string;
  parametres: { nom: string; valeur: string; conforme: boolean }[];
  noteGlobale?: number;
}

interface PhotoPreuve {
  id: string;
  lotId: string;
  url: string;
  description: string;
  date: string;
}

const MOCK_ECHANTILLONS: Echantillon[] = [
  { id: "ech-001", lotId: "LOT-B012", produit: "Maïs blanc", datePrelevement: "2026-06-01", statut: "complete", laboratoire: "LAB-AGRI Cotonou", parametres: [
    { nom: "Humidité", valeur: "12.5%", conforme: true },
    { nom: "Taux protéines", valeur: "9.8%", conforme: true },
    { nom: "Impuretés", valeur: "1.2%", conforme: true },
    { nom: "Aflatoxines", valeur: "2.1 ppb", conforme: true },
  ], noteGlobale: 92 },
  { id: "ech-002", lotId: "LOT-B015", produit: "Soja", datePrelevement: "2026-06-05", statut: "en_analyse", laboratoire: "LAB-AGRI Parakou", parametres: [
    { nom: "Humidité", valeur: "11.8%", conforme: true },
    { nom: "Taux protéines", valeur: "36.2%", conforme: true },
  ], noteGlobale: 78 },
  { id: "ech-003", lotId: "LOT-C002", produit: "Cacao bio", datePrelevement: "2026-06-08", statut: "demande", laboratoire: "LAB-AGRI Cotonou", parametres: [] },
];

const MOCK_PHOTOS: PhotoPreuve[] = [
  { id: "ph-001", lotId: "LOT-B012", url: "", description: "Stockage maïs blanc — sacs proprement empilés", date: "2026-05-20" },
  { id: "ph-002", lotId: "LOT-B012", url: "", description: "Échantillon prélevé — lot B012", date: "2026-06-01" },
  { id: "ph-003", lotId: "LOT-C002", url: "", description: "Cacao en fermentation — bâches propres", date: "2026-05-25" },
];

const STATUT_STYLES = {
  demande: { bg: colors.warning + "20", text: colors.warning, label: "📋 Demande" },
  preleve: { bg: colors.secondary + "20", text: colors.secondary, label: "🔬 Prélevé" },
  en_analyse: { bg: colors.primary + "20", text: colors.primary, label: "⚗️ En analyse" },
  complete: { bg: colors.success + "20", text: colors.success, label: "✅ Complété" },
};

export default function QualityAssuranceScreen() {
  const [tab, setTab] = useState<"echantillons" | "photos">("echantillons");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔬 Quality Assurance</Text>
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === "echantillons" && styles.tabActive]} onPress={() => setTab("echantillons")}>
            <Text style={[styles.tabText, tab === "echantillons" && styles.tabTextActive]}>🧪 Échantillons ({MOCK_ECHANTILLONS.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === "photos" && styles.tabActive]} onPress={() => setTab("photos")}>
            <Text style={[styles.tabText, tab === "photos" && styles.tabTextActive]}>📸 Photos ({MOCK_PHOTOS.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === "echantillons" ? (
        <FlatList
          data={MOCK_ECHANTILLONS}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ListEmptyComponent={<EmptyState title="Aucun échantillon" />}
          renderItem={({ item }) => {
            const ss = STATUT_STYLES[item.statut];
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.produit}>{item.produit}</Text>
                  <View style={[styles.badge, { backgroundColor: ss.bg }]}>
                    <Text style={[styles.badgeText, { color: ss.text }]}>{ss.label}</Text>
                  </View>
                </View>
                <Text style={styles.lotRef}>Lot : {item.lotId}</Text>
                <Text style={styles.labo}>🏛️ {item.laboratoire}</Text>
                <Text style={styles.date}>📅 Prélèvement : {item.datePrelevement}</Text>

                {item.parametres.length > 0 && (
                  <View style={styles.paramsBox}>
                    {item.parametres.map((p, i) => (
                      <View key={i} style={styles.paramRow}>
                        <Text style={styles.paramNom}>{p.nom}</Text>
                        <Text style={styles.paramValeur}>{p.valeur}</Text>
                        <Text style={[styles.paramConforme, { color: p.conforme ? colors.success : colors.error }]}>{p.conforme ? "✅" : "❌"}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {item.noteGlobale && (
                  <View style={styles.noteRow}>
                    <Text style={styles.noteLabel}>Note qualité</Text>
                    <Text style={[styles.noteValue, { color: item.noteGlobale >= 80 ? colors.success : item.noteGlobale >= 60 ? colors.warning : colors.error }]}>{item.noteGlobale}/100</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={MOCK_PHOTOS}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ListHeaderComponent={<Text style={styles.sectionSub}>Photos de contrôle qualité étalonnées</Text>}
          ListEmptyComponent={<EmptyState title="Aucune photo" />}
          renderItem={({ item }) => (
            <View style={styles.photoCard}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>📸</Text>
                <Text style={styles.photoHint}>Photo preuve</Text>
              </View>
              <Text style={styles.photoDesc}>{item.description}</Text>
              <Text style={styles.photoMeta}>Lot {item.lotId} · {item.date}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, paddingBottom: 0 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 10 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceAlt },
  tabActive: { backgroundColor: colors.primary + "25" },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  sectionSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  produit: { fontSize: 15, fontWeight: "700", color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  lotRef: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  labo: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  date: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
  paramsBox: { backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 10, marginTop: 10 },
  paramRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  paramNom: { fontSize: 13, color: colors.text, flex: 1 },
  paramValeur: { fontSize: 13, fontWeight: "600", color: colors.text, marginHorizontal: 8 },
  paramConforme: { fontSize: 14 },
  noteRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  noteLabel: { fontSize: 13, color: colors.textSecondary },
  noteValue: { fontSize: 18, fontWeight: "800" },
  photoCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, alignItems: "center" },
  photoPlaceholder: { width: "100%", height: 140, backgroundColor: colors.surfaceAlt, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  photoIcon: { fontSize: 36 },
  photoHint: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
  photoDesc: { fontSize: 13, color: colors.text, textAlign: "center" },
  photoMeta: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
});
