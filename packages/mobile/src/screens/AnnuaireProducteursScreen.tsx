import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, StyleSheet } from "react-native";
import { colors } from "../theme";
import { enqueueAction } from "../storage/offline";
import { useNetworkStatus } from "../utils/network";
import EmptyState from "../components/EmptyState";

interface ProducteurProfile {
  id: string;
  nom: string;
  localisation: string;
  departement: string;
  produits: string[];
  badge: "bronze" | "argent" | "or";
  trustScore: number;
  nbVentes: number;
  email?: string;
  telephone?: string;
  follow: boolean;
  dateFollow?: string;
}

const MOCK_PROFILS: ProducteurProfile[] = [
  { id: "prod-001", nom: "Kossi Agué", localisation: "Covè", departement: "Zou", produits: ["Maïs", "Soja"], badge: "argent", trustScore: 82, nbVentes: 34, telephone: "+229 97 00 00 01", follow: false },
  { id: "prod-002", nom: "Fatima Diallo", localisation: "Malanville", departement: "Alibori", produits: ["Riz", "Oignon"], badge: "or", trustScore: 91, nbVentes: 87, telephone: "+229 61 00 00 02", follow: false },
  { id: "prod-003", nom: "Yao Kpèdété", localisation: "Dassa", departement: "Collines", produits: ["Manioc", "Niébé"], badge: "bronze", trustScore: 65, nbVentes: 12, telephone: "+229 54 00 00 03", follow: true, dateFollow: "2026-05-20" },
  { id: "prod-004", nom: "Mariam Soro", localisation: "Parakou", departement: "Borgou", produits: ["Coton", "Maïs"], badge: "argent", trustScore: 78, nbVentes: 45, telephone: "+229 97 00 00 04", follow: false },
  { id: "prod-005", nom: "Benoît Zinsou", localisation: "Pobè", departement: "Plateau", produits: ["Cacao", "Palmier"], badge: "argent", trustScore: 85, nbVentes: 52, telephone: "+229 61 00 00 05", follow: true, dateFollow: "2026-04-15" },
  { id: "prod-006", nom: "Estelle Hounkpè", localisation: "Cotonou", departement: "Atlantique", produits: ["Légumes", "Piment"], badge: "bronze", trustScore: 58, nbVentes: 8, email: "estelle.h@agri.bj", follow: false },
];

const BADGE_STYLES = {
  bronze: { bg: "#CD7F32", label: "🥉" },
  argent: { bg: "#A8A8A8", label: "🥈" },
  or: { bg: "#FFD700", label: "🥇" },
};

export default function AnnuaireProducteursScreen() {
  const isOnline = useNetworkStatus();
  const [profils, setProfils] = useState<ProducteurProfile[]>(MOCK_PROFILS);
  const [search, setSearch] = useState("");

  const filtered = profils.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.localisation.toLowerCase().includes(search.toLowerCase()) ||
    p.produits.some(pr => pr.toLowerCase().includes(search.toLowerCase()))
  );

  const handleFollow = (item: ProducteurProfile) => {
    const updated = profils.map(p => p.id === item.id ? { ...p, follow: !p.follow, dateFollow: !p.follow ? new Date().toISOString().slice(0, 10) : undefined } : p);
    setProfils(updated);
    if (!isOnline) enqueueAction(item.follow ? "annuaire/unfollow" : "annuaire/follow", { producerId: item.id });
    Alert.alert(item.follow ? "Ne plus suivre" : "✅ Abonné", item.follow ? `Vous ne suivez plus ${item.nom}` : `Vous suivez maintenant ${item.nom}`);
  };

  const header = (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>🌾 Annuaire producteurs</Text>
        <Text style={styles.sub}>{profils.filter(p => p.follow).length} abonnements</Text>
      </View>
      <TextInput style={styles.search} placeholder="Rechercher (nom, localité, produit…)" value={search} onChangeText={setSearch} placeholderTextColor={colors.textTertiary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="Aucun producteur trouvé" />}
        renderItem={({ item }) => {
          const badge = BADGE_STYLES[item.badge];
          return (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.nom.charAt(0)}</Text>
                </View>
                <View style={styles.profile}>
                  <View style={styles.nameRow}>
                    <Text style={styles.nom}>{item.nom}</Text>
                    <Text style={styles.badgeIcon}>{badge.label}</Text>
                  </View>
                  <Text style={styles.localisation}>📍 {item.localisation}, {item.departement}</Text>
                </View>
                <TouchableOpacity style={[styles.followBtn, item.follow && styles.followBtnActive]} onPress={() => handleFollow(item)}>
                  <Text style={[styles.followText, item.follow && styles.followTextActive]}>{item.follow ? "✓ Suivi" : "+ Suivre"}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tagsRow}>
                {item.produits.map((p) => (
                  <View key={p} style={styles.tag}><Text style={styles.tagText}>{p}</Text></View>
                ))}
              </View>

              <View style={styles.statsRow}>
                <Text style={styles.stat}>Score confiance : <Text style={styles.statValue}>{item.trustScore}/100</Text></Text>
                <Text style={styles.stat}>Ventes : <Text style={styles.statValue}>{item.nbVentes}</Text></Text>
              </View>

              {(item.email || item.telephone) && (
                <View style={styles.contactRow}>
                  {item.telephone && <Text style={styles.contact}>📞 {item.telephone}</Text>}
                  {item.email && <Text style={styles.contact}>✉️ {item.email}</Text>}
                </View>
              )}

              {item.dateFollow && <Text style={styles.followDate}>📅 Abonné depuis le {item.dateFollow}</Text>}
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
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  search: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, fontSize: 14, color: colors.text, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + "30", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "700", color: colors.primary },
  profile: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  nom: { fontSize: 15, fontWeight: "700", color: colors.text },
  badgeIcon: { fontSize: 14 },
  localisation: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  followBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.primary },
  followBtnActive: { backgroundColor: colors.primary + "20" },
  followText: { fontSize: 12, fontWeight: "600", color: colors.white },
  followTextActive: { color: colors.primary },
  tagsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 10 },
  tag: { backgroundColor: colors.primary + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagText: { fontSize: 11, color: colors.primary, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 16, marginTop: 8 },
  stat: { fontSize: 12, color: colors.textSecondary },
  statValue: { fontWeight: "700", color: colors.text },
  contactRow: { marginTop: 8, gap: 2 },
  contact: { fontSize: 12, color: colors.textSecondary },
  followDate: { fontSize: 10, color: colors.textTertiary, marginTop: 6 },
});
