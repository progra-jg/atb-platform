import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { colors } from "../theme";
import EmptyState from "../components/EmptyState";

interface ImpactMetric {
  label: string;
  valeur: string;
  icon: string;
  color: string;
}

const MOCK_IMPACT: ImpactMetric[] = [
  { label: "Émissions évitées", valeur: "12.4 T CO₂", icon: "🌳", color: colors.success },
  { label: "Producteurs soutenus", valeur: "47", icon: "🌾", color: colors.primary },
  { label: "Terres tracées", valeur: "86 ha", icon: "🗺️", color: colors.secondary },
  { label: "Eau économisée", valeur: "340 m³", icon: "💧", color: "#1565C0" },
  { label: "Emballages recyclés", valeur: "520 kg", icon: "♻️", color: "#6A1B9A" },
  { label: "Transactions conformes", valeur: "94%", icon: "✅", color: colors.success },
];

interface Cooperative {
  id: string;
  nom: string;
  localisation: string;
  membres: number;
  produitPrincipal: string;
  certificats: string[];
}

const MOCK_COOPS: Cooperative[] = [
  { id: "coop-001", nom: "Coopérative des producteurs du Zou", localisation: "Covè, Zou", membres: 320, produitPrincipal: "Maïs", certificats: ["GlobalGAP", "Bio"] },
  { id: "coop-002", nom: "Groupement Féminin de Pobè", localisation: "Pobè, Plateau", membres: 180, produitPrincipal: "Cacao", certificats: ["Bio", "Commerce Équitable"] },
  { id: "coop-003", nom: "Union des Producteurs du Borgou", localisation: "Parakou, Borgou", membres: 450, produitPrincipal: "Soja", certificats: ["GlobalGAP"] },
  { id: "coop-004", nom: "Coopérative Agricole de l'Atacora", localisation: "Natitingou, Atacora", membres: 210, produitPrincipal: "Anacarde", certificats: ["Bio"] },
];

export default function ImpactScreen() {
  const [tab, setTab] = useState<"impact" | "cooperatives">("impact");

  const renderImpact = () => (
    <View style={styles.section}>
      <View style={styles.esgRing}>
        <Text style={styles.esgScore}>A</Text>
        <Text style={styles.esgLabel}>ESG</Text>
      </View>
      <Text style={styles.esgSub}>Score basé sur vos transactions, certificats et pratiques durables</Text>

      <View style={styles.metricsGrid}>
        {MOCK_IMPACT.map((m, i) => (
          <View key={i} style={styles.metricCard}>
            <Text style={styles.metricIcon}>{m.icon}</Text>
            <Text style={[styles.metricValue, { color: m.color }]}>{m.valeur}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.milestoneBox}>
        <Text style={styles.milestoneTitle}>🏆 Étapes franchies</Text>
        <View style={styles.milestoneRow}><Text style={styles.milestoneIcon}>🥇</Text><Text style={styles.milestoneText}>1ère transaction ≥ 1M FCFA</Text></View>
        <View style={styles.milestoneRow}><Text style={styles.milestoneIcon}>🥇</Text><Text style={styles.milestoneText}>10 lots vendus avec certificat</Text></View>
        <View style={styles.milestoneRow}><Text style={styles.milestoneIcon}>🥇</Text><Text style={styles.milestoneText}>KYC niveau 3 validé</Text></View>
        <View style={styles.milestoneRow}><Text style={styles.milestoneIcon}>🏅</Text><Text style={styles.milestoneText}>3 contrats-cadres signés</Text></View>
      </View>

      <TouchableOpacity style={styles.downloadBtn} onPress={() => Alert.alert("Téléchargement", "Rapport ESG généré (PDF)")}>
        <Text style={styles.downloadText}>📥 Télécharger rapport d'impact</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCooperatives = () => (
    <FlatList
      data={MOCK_COOPS}
      keyExtractor={(c) => c.id}
      scrollEnabled={false}
      ListHeaderComponent={
        <Text style={styles.sectionSub}>Réseau de coopératives certifiées sur AgriTrace</Text>
      }
      ListEmptyComponent={<EmptyState title="Aucune coopérative" />}
      renderItem={({ item }) => (
        <View style={styles.coopCard}>
          <Text style={styles.coopNom}>{item.nom}</Text>
          <Text style={styles.coopLocalisation}>📍 {item.localisation}</Text>
          <Text style={styles.coopDetails}>👥 {item.membres} membres · 🌾 {item.produitPrincipal}</Text>
          <View style={styles.certifsRow}>
            {item.certificats.map((c, i) => (
              <View key={i} style={styles.certifTag}><Text style={styles.certifText}>✅ {c}</Text></View>
            ))}
          </View>
        </View>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌍 Impact & Réseau</Text>
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === "impact" && styles.tabActive]} onPress={() => setTab("impact")}>
            <Text style={[styles.tabText, tab === "impact" && styles.tabTextActive]}>🌍 ESG</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === "cooperatives" && styles.tabActive]} onPress={() => setTab("cooperatives")}>
            <Text style={[styles.tabText, tab === "cooperatives" && styles.tabTextActive]}>🤝 Coopératives</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === "impact" ? (
        <FlatList
          data={[]}
          keyExtractor={() => "x"}
          renderItem={() => null}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ListHeaderComponent={renderImpact}
        />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => "x"}
          renderItem={() => null}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ListHeaderComponent={renderCooperatives}
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
  section: {},
  sectionSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  esgRing: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.success + "20", alignItems: "center", justifyContent: "center", alignSelf: "center", borderWidth: 4, borderColor: colors.success, marginBottom: 8 },
  esgScore: { fontSize: 32, fontWeight: "800", color: colors.success },
  esgLabel: { fontSize: 12, fontWeight: "600", color: colors.success, marginTop: -4 },
  esgSub: { fontSize: 12, color: colors.textSecondary, textAlign: "center", marginBottom: 16 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  metricCard: { flex: 1, minWidth: "30%", backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  metricIcon: { fontSize: 22 },
  metricValue: { fontSize: 16, fontWeight: "800", marginTop: 4 },
  metricLabel: { fontSize: 10, color: colors.textTertiary, textAlign: "center", marginTop: 2 },
  milestoneBox: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 12 },
  milestoneTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 8 },
  milestoneRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  milestoneIcon: { fontSize: 16 },
  milestoneText: { fontSize: 13, color: colors.text, flex: 1 },
  downloadBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center" },
  downloadText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  coopCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  coopNom: { fontSize: 15, fontWeight: "700", color: colors.text },
  coopLocalisation: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  coopDetails: { fontSize: 13, color: colors.text, marginTop: 4 },
  certifsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 8 },
  certifTag: { backgroundColor: colors.success + "15", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  certifText: { fontSize: 11, color: colors.success, fontWeight: "600" },
});
