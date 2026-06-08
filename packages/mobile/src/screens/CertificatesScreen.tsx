import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";
import EmptyState from "../components/EmptyState";

interface Certificat {
  id: string;
  type: "eudr" | "globalgap" | "bio" | "commerce";
  titre: string;
  lotId?: string;
  produit?: string;
  statut: "valide" | "expire" | "en_attente" | "echec";
  dateEmission: string;
  dateExpiration: string;
  emetteur: string;
  note: number;
}

const MOCK_CERTIFICATS: Certificat[] = [
  { id: "cert-001", type: "eudr", titre: "EUDR Due Diligence - Maïs", lotId: "LOT-B012", produit: "Maïs blanc", statut: "valide", dateEmission: "2026-03-15", dateExpiration: "2027-03-15", emetteur: "AgriTrace Compliance", note: 94 },
  { id: "cert-002", type: "bio", titre: "Certification Biologique - Cacao", lotId: "LOT-C002", produit: "Cacao bio", statut: "valide", dateEmission: "2026-01-10", dateExpiration: "2027-01-10", emetteur: "Ecocert", note: 88 },
  { id: "cert-003", type: "globalgap", titre: "GlobalGAP - Soja", lotId: "LOT-B015", produit: "Soja", statut: "en_attente", dateEmission: "2026-05-20", dateExpiration: "2026-11-20", emetteur: "SGS", note: 72 },
  { id: "cert-004", type: "eudr", titre: "EUDR Due Diligence - Soja", lotId: "LOT-B015", produit: "Soja", statut: "valide", dateEmission: "2026-04-01", dateExpiration: "2027-04-01", emetteur: "AgriTrace Compliance", note: 91 },
  { id: "cert-005", type: "commerce", titre: "Commerce Act - Cacao #ACT-001", produit: "Cacao bio", statut: "valide", dateEmission: "2026-05-01", dateExpiration: "2026-12-31", emetteur: "Chambre de Commerce", note: 100 },
  { id: "cert-006", type: "globalgap", titre: "GlobalGAP - Anacarde", statut: "expire", dateEmission: "2024-06-01", dateExpiration: "2025-06-01", emetteur: "SGS", note: 65 },
];

const TYPE_CONFIG = {
  eudr: { label: "EUDR", color: "#2E7D32", icon: "🌳" },
  globalgap: { label: "GlobalGAP", color: "#1565C0", icon: "✅" },
  bio: { label: "Bio", color: "#6A1B9A", icon: "🌿" },
  commerce: { label: "Commerce Act", color: "#E65100", icon: "⚖️" },
};

const STATUT_STYLES = {
  valide: { bg: colors.success + "20", text: colors.success, label: "✅ Valide" },
  expire: { bg: colors.error + "20", text: colors.error, label: "❌ Expiré" },
  en_attente: { bg: colors.warning + "20", text: colors.warning, label: "⏳ En attente" },
  echec: { bg: colors.textTertiary + "20", text: colors.textTertiary, label: "⚠️ Échec" },
};

export default function CertificatesScreen() {
  const [filtre, setFiltre] = useState<string | null>(null);
  const certs = filtre ? MOCK_CERTIFICATS.filter(c => c.type === filtre) : MOCK_CERTIFICATS;

  const estConforme = certs.filter(c => c.statut === "valide").length;
  const conformite = certs.length > 0 ? Math.round((estConforme / certs.length) * 100) : 0;

  return (
    <View style={styles.container}>
      <FlatList
        data={certs}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>📜 Certificats & Conformité</Text>
              <Text style={styles.sub}>{certs.length} certificats — {conformite}% conformité</Text>
            </View>

            <View style={styles.conformiteRow}>
              <View style={styles.conformiteCard}><Text style={styles.conformiteValue}>{conformite}%</Text><Text style={styles.conformiteLabel}>Conformité</Text></View>
              <View style={styles.conformiteCard}><Text style={[styles.conformiteValue, { color: colors.success }]}>{estConforme}</Text><Text style={styles.conformiteLabel}>Valides</Text></View>
              <View style={styles.conformiteCard}><Text style={[styles.conformiteValue, { color: colors.error }]}>{certs.filter(c => c.statut === "expire" || c.statut === "echec").length}</Text><Text style={styles.conformiteLabel}>Problèmes</Text></View>
            </View>

            <View style={styles.filters}>
              {[null, "eudr", "globalgap", "bio", "commerce"].map((t) => (
                <TouchableOpacity key={t || "all"} style={[styles.filterBtn, filtre === t && styles.filterActive]} onPress={() => setFiltre(t)}>
                  <Text style={[styles.filterText, filtre === t && styles.filterTextActive]}>{t ? TYPE_CONFIG[t as keyof typeof TYPE_CONFIG]?.label : "Tous"}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {filtre === "eudr" && (
              <View style={styles.eudrBanner}>
                <Text style={styles.eudrTitle}>🌳 Règlement EUDR</Text>
                <Text style={styles.eudrText}>Depuis 2025, l'export vers l'UE exige une Due Diligence prouvant que vos produits n'ont pas causé de déforestation. AgriTrace génère automatiquement les rapports de conformité pour chaque lot.</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={<EmptyState title="Aucun certificat" />}
        renderItem={({ item }) => {
          const tc = TYPE_CONFIG[item.type];
          const ss = STATUT_STYLES[item.statut];
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.typeRow}>
                  <Text style={styles.typeIcon}>{tc.icon}</Text>
                  <Text style={styles.typeLabel}>{tc.label}</Text>
                </View>
                <View style={[styles.statutBadge, { backgroundColor: ss.bg }]}>
                  <Text style={[styles.statutText, { color: ss.text }]}>{ss.label}</Text>
                </View>
              </View>

              <Text style={styles.titre}>{item.titre}</Text>
              {item.lotId && <Text style={styles.lotRef}>Lot : {item.lotId} · {item.produit}</Text>}

              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Score conformité</Text>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreFill, { width: `${item.note}%`, backgroundColor: item.note >= 80 ? colors.success : item.note >= 60 ? colors.warning : colors.error }]} />
                </View>
                <Text style={styles.scoreValue}>{item.note}/100</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>📅 {item.dateEmission} → {item.dateExpiration}</Text>
                <Text style={styles.meta}>🏛️ {item.emetteur}</Text>
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
  header: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 10 },
  conformiteRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  conformiteCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" },
  conformiteValue: { fontSize: 20, fontWeight: "800", color: colors.text },
  conformiteLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  filters: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.surfaceAlt },
  filterActive: { backgroundColor: colors.primary + "25" },
  filterText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  filterTextActive: { color: colors.primary },
  eudrBanner: { backgroundColor: colors.success + "12", padding: 12, borderRadius: 12, marginBottom: 12 },
  eudrTitle: { fontSize: 14, fontWeight: "700", color: colors.success },
  eudrText: { fontSize: 12, color: colors.text, marginTop: 4, lineHeight: 17 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  typeIcon: { fontSize: 16 },
  typeLabel: { fontSize: 12, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase" },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statutText: { fontSize: 10, fontWeight: "600" },
  titre: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 },
  lotRef: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  scoreLabel: { fontSize: 11, color: colors.textTertiary, width: 60 },
  scoreBar: { flex: 1, height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: "hidden" },
  scoreFill: { height: "100%", borderRadius: 4 },
  scoreValue: { fontSize: 12, fontWeight: "700", color: colors.text, width: 40, textAlign: "right" },
  metaRow: { marginTop: 8, gap: 2 },
  meta: { fontSize: 11, color: colors.textTertiary },
});
