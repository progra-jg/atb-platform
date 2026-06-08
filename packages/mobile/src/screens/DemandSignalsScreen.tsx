import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert, StyleSheet } from "react-native";
import { colors } from "../theme";
import { useNetworkStatus } from "../utils/network";
import { enqueueAction } from "../storage/offline";
import EmptyState from "../components/EmptyState";

interface SignalDemande {
  id: string;
  produit: string;
  quantite: number;
  unite: string;
  prixMax: number;
  localisation: string;
  dateLimite: string;
  statut: "actif" | "en_cours" | "satisfait" | "expire";
  nbPropositions: number;
  dateCreation: string;
  description?: string;
}

const MOCK_SIGNAUX: SignalDemande[] = [
  { id: "sig-001", produit: "Maïs blanc", quantite: 10000, unite: "kg", prixMax: 190, localisation: "Cotonou", dateLimite: "2026-07-01", statut: "actif", nbPropositions: 3, dateCreation: "2026-06-01", description: "Recherche maïs blanc qualité supérieure pour transformation" },
  { id: "sig-002", produit: "Soja", quantite: 5000, unite: "kg", prixMax: 230, localisation: "Parakou", dateLimite: "2026-06-20", statut: "en_cours", nbPropositions: 5, dateCreation: "2026-05-25", description: "Soja non-OGM pour alimentation animale" },
  { id: "sig-003", produit: "Cacao bio", quantite: 2000, unite: "kg", prixMax: 1500, localisation: "Pobè", dateLimite: "2026-06-30", statut: "actif", nbPropositions: 1, dateCreation: "2026-06-05" },
  { id: "sig-004", produit: "Anacarde", quantite: 5000, unite: "kg", prixMax: 500, localisation: "Bohicon", dateLimite: "2026-05-30", statut: "satisfait", nbPropositions: 7, dateCreation: "2026-05-01" },
];

const STATUT_STYLES = {
  actif: { bg: colors.success + "20", text: colors.success, label: "🟢 Actif" },
  en_cours: { bg: colors.warning + "20", text: colors.warning, label: "💬 En cours" },
  satisfait: { bg: colors.primary + "20", text: colors.primary, label: "✅ Satisfait" },
  expire: { bg: colors.textTertiary + "20", text: colors.textTertiary, label: "⌛ Expiré" },
};

export default function DemandSignalsScreen() {
  const isOnline = useNetworkStatus();
  const [signaux, setSignaux] = useState<SignalDemande[]>(MOCK_SIGNAUX);
  const [showCreate, setShowCreate] = useState(false);
  const [newProduit, setNewProduit] = useState("");
  const [newQuantite, setNewQuantite] = useState("");
  const [newPrix, setNewPrix] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = () => {
    if (!newProduit || !newQuantite || !newPrix) { Alert.alert("Champs requis"); return; }
    const signal: SignalDemande = {
      id: `sig-${Date.now()}`, produit: newProduit, quantite: parseInt(newQuantite), unite: "kg",
      prixMax: parseInt(newPrix), localisation: "Bénin", dateLimite: "2026-08-01",
      statut: "actif", nbPropositions: 0, dateCreation: new Date().toISOString().slice(0, 10),
      description: newDesc || undefined,
    };
    setSignaux(prev => [signal, ...prev]);
    setShowCreate(false); setNewProduit(""); setNewQuantite(""); setNewPrix(""); setNewDesc("");
    if (!isOnline) enqueueAction("demand/create", signal);
    Alert.alert("✅ Signal publié");
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={signaux}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>📢 Signaux de demande</Text>
              <Text style={styles.sub}>{signaux.filter(s => s.statut === "actif").length} demandes actives</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 Aux acheteurs</Text>
              <Text style={styles.infoText}>Publiez ce que vous cherchez. Les producteurs peuvent vous contacter directement avec leurs offres.</Text>
            </View>

            <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.newText}>+ Publier une demande</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Mes demandes</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Aucune demande" />}
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

              <Text style={styles.details}>{item.quantite.toLocaleString()} {item.unite} · max {item.prixMax} FCFA/kg · 📍 {item.localisation}</Text>
              {item.description && <Text style={styles.desc}>"{item.description}"</Text>}

              <View style={styles.statsRow}>
                <Text style={styles.stat}>{item.nbPropositions} proposition(s)</Text>
                <Text style={styles.stat}>📅 Limite : {item.dateLimite}</Text>
              </View>

              {item.statut === "actif" && (
                <View style={styles.propRow}>
                  <TouchableOpacity style={styles.voirBtn}><Text style={styles.voirText}>👀 Voir les offres</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.editBtn}><Text style={styles.editText}>✏️ Modifier</Text></TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>📢 Nouvelle demande</Text>
            <TextInput style={styles.input} placeholder="Produit recherché" value={newProduit} onChangeText={setNewProduit} placeholderTextColor={colors.textTertiary} />
            <TextInput style={styles.input} placeholder="Quantité (kg)" value={newQuantite} onChangeText={setNewQuantite} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
            <TextInput style={styles.input} placeholder="Prix max (FCFA/kg)" value={newPrix} onChangeText={setNewPrix} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
            <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Description (optionnelle)" value={newDesc} onChangeText={setNewDesc} multiline placeholderTextColor={colors.textTertiary} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}><Text style={styles.cancelText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={styles.publishBtn} onPress={handleCreate}><Text style={styles.publishText}>📢 Publier</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 4 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  infoBox: { backgroundColor: colors.secondary + "12", padding: 12, borderRadius: 12, marginBottom: 12 },
  infoTitle: { fontSize: 13, fontWeight: "700", color: colors.secondary },
  infoText: { fontSize: 12, color: colors.text, marginTop: 4, lineHeight: 17 },
  newBtn: { backgroundColor: colors.primary, padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 14 },
  newText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  produit: { fontSize: 16, fontWeight: "700", color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  details: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  desc: { fontSize: 12, color: colors.text, fontStyle: "italic", marginTop: 4, backgroundColor: colors.surfaceAlt, padding: 6, borderRadius: 6 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  stat: { fontSize: 12, color: colors.textTertiary },
  propRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  voirBtn: { flex: 1, backgroundColor: colors.primary, padding: 10, borderRadius: 10, alignItems: "center" },
  voirText: { color: colors.white, fontWeight: "600", fontSize: 12 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  editText: { fontSize: 12, fontWeight: "600", color: colors.text },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 12 },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12, fontSize: 14, color: colors.text, marginBottom: 8 },
  modalActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: colors.surfaceAlt },
  cancelText: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" },
  publishBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: colors.primary },
  publishText: { fontSize: 14, color: colors.white, fontWeight: "700" },
});
