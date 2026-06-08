import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, Alert, StyleSheet } from "react-native";
import { colors } from "../theme";
import { useNetworkStatus } from "../utils/network";
import { enqueueAction } from "../storage/offline";
import { getContracts, getContractById, getContractStatusIcon, getContractStatusColor, formatContractStatut } from "../services/contracts";
import type { Contract } from "../services/contracts";
import EmptyState from "../components/EmptyState";
import { useAuthStore } from "../store/authStore";

export default function ContractsScreen() {
  const isOnline = useNetworkStatus();
  const { user } = useAuthStore();
  const [contracts, setContracts] = useState<Contract[]>(getContracts());
  const [selected, setSelected] = useState<Contract | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitre, setNewTitre] = useState("");
  const [newProduit, setNewProduit] = useState("");
  const [newQuantite, setNewQuantite] = useState("");
  const [newPrix, setNewPrix] = useState("");
  const [newModalites, setNewModalites] = useState("");
  const [newConditions, setNewConditions] = useState("");

  const filtreStats = {
    actifs: contracts.filter(c => c.statut === "actif" || c.statut === "signe").length,
    termines: contracts.filter(c => c.statut === "complete").length,
    negociations: contracts.filter(c => c.statut === "negociation").length,
  };

  const handleAction = (action: string, c: Contract) => {
    Alert.alert(action === "signer" ? "✍️ Signer le contrat" : action === "resilier" ? "⛔ Résilier" : action === "livrer" ? "🚚 Marquer livré" : "", 
      action === "signer" ? `Signer ${c.titre} ?` : action === "resilier" ? `Résilier ${c.titre} ? Cette action est irréversible.` : `Confirmer la livraison pour ${c.titre} ?`,
      [{ text: "Annuler", style: "cancel" }, { text: "Confirmer", style: action === "resilier" ? "destructive" : "default", onPress: () => {
        if (!isOnline) enqueueAction(`contract/${action}`, { contractId: c.id });
        Alert.alert("✅ Action effectuée", action === "signer" ? "Contrat signé" : action === "resilier" ? "Contrat résilié" : "Livraison confirmée");
      }}]
    );
  };

  const DetailModal = () => {
    if (!selected) return null;
    const c = selected;
    return (
      <Modal visible transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalId}>{c.id}</Text>
                <View style={[styles.statutBadge, { backgroundColor: getContractStatusColor(c.statut) + "20" }]}>
                  <Text style={[styles.statutText, { color: getContractStatusColor(c.statut) }]}>{getContractStatusIcon(c.statut)} {formatContractStatut(c.statut)}</Text>
                </View>
              </View>
              <Text style={styles.modalTitre}>{c.titre}</Text>
              <Text style={styles.modalPart}>Acheteur : {c.acheteurNom}</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Produit</Text><Text style={styles.detailVal}>{c.produit}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantité</Text><Text style={styles.detailVal}>{c.quantite} {c.unite}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Prix unitaire</Text><Text style={styles.detailVal}>{c.prixUnitaire} FCFA/kg</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Montant total</Text><Text style={[styles.detailVal, { fontWeight: "800", color: colors.primary }]}>{c.montantTotal.toLocaleString()} FCFA</Text>
              </View>

              {c.modalites && (
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionTitle}>📋 Modalités</Text>
                  <Text style={styles.sectionText}>{c.modalites}</Text>
                </View>
              )}
              {c.conditions && (
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionTitle}>⚖️ Conditions</Text>
                  <Text style={styles.sectionText}>{c.conditions}</Text>
                </View>
              )}

              {c.echeances.length > 0 && (
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionTitle}>📅 Échéancier</Text>
                  {c.echeances.map((e, i) => (
                    <View key={i} style={styles.echeanceRow}>
                      <View>
                        <Text style={styles.echType}>{e.type}</Text>
                        <Text style={styles.echDate}>{e.date}</Text>
                      </View>
                      <Text style={styles.echMontant}>{e.montant.toLocaleString()} F</Text>
                      <Text style={[styles.echStatut, { color: e.statut === "paye" ? colors.success : e.statut === "retard" ? colors.error : colors.warning }]}>
                        {e.statut === "paye" ? "✅" : e.statut === "retard" ? "⚠️" : "⏳"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>📜 Chronologie</Text>
                {c.historique.map((h, i) => (
                  <View key={i} style={styles.histRow}>
                    <View style={styles.histDot} />
                    <View style={styles.histContent}>
                      <Text style={styles.histAction}>{h.action}</Text>
                      <Text style={styles.histMeta}>{h.date} — {h.par}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {(c.statut === "signe" || c.statut === "negociation") && (
                <View style={styles.actionRow}>
                  {c.statut === "signe" && <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction("livrer", c)}><Text style={styles.actionText}>🚚 Marquer livré</Text></TouchableOpacity>}
                  {(c.statut === "negociation" || c.statut === "signe") && <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error }]} onPress={() => handleAction("resilier", c)}><Text style={styles.actionText}>⛔ Résilier</Text></TouchableOpacity>}
                </View>
              )}
              {c.statut === "brouillon" && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => handleAction("signer", c)}><Text style={styles.primaryText}>✍️ Signer le contrat</Text></TouchableOpacity>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const handleCreateContract = () => {
    if (!newTitre || !newProduit || !newQuantite || !newPrix) {
      Alert.alert("Champs requis", "Titre, produit, quantité et prix sont obligatoires.");
      return;
    }
    const qte = Number(newQuantite);
    const pu = Number(newPrix);
    const newContract: Contract = {
      id: `CT-${Date.now()}`,
      titre: newTitre,
      produit: newProduit,
      quantite: qte,
      unite: "kg",
      prixUnitaire: pu,
      montantTotal: qte * pu,
      acheteurId: user?.id || "acheteur",
      acheteurNom: user?.company || "Acheteur",
      producteurId: "",
      producteurNom: "",
      statut: "brouillon",
      dateCreation: new Date().toISOString().split("T")[0],
      modalites: newModalites || undefined,
      conditions: newConditions || undefined,
      historique: [{ date: new Date().toISOString().split("T")[0], action: "Création du contrat", par: user?.company || "Vous" }],
      echeances: [],
    };
    setContracts((prev) => [newContract, ...prev]);
    setShowCreate(false);
    setNewTitre(""); setNewProduit(""); setNewQuantite(""); setNewPrix(""); setNewModalites(""); setNewConditions("");
    if (!isOnline) enqueueAction("contract/create", newContract);
    Alert.alert("✅ Contrat créé", `${newContract.id} — ${newContract.titre}`);
  };

  const CreateModal = () => (
    <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView>
            <Text style={styles.modalTitle}>📝 Nouveau contrat</Text>
            <TextInput style={styles.input} placeholder="Titre du contrat *" value={newTitre} onChangeText={setNewTitre} placeholderTextColor={colors.textTertiary} />
            <TextInput style={styles.input} placeholder="Produit *" value={newProduit} onChangeText={setNewProduit} placeholderTextColor={colors.textTertiary} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Quantité (kg) *" value={newQuantite} onChangeText={setNewQuantite} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Prix (FCFA/kg) *" value={newPrix} onChangeText={setNewPrix} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
            </View>
            <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Modalités (optionnel)" value={newModalites} onChangeText={setNewModalites} multiline placeholderTextColor={colors.textTertiary} />
            <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Conditions (optionnel)" value={newConditions} onChangeText={setNewConditions} multiline placeholderTextColor={colors.textTertiary} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateContract}>
              <Text style={styles.primaryText}>✅ Créer le contrat</Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCreate(false)}>
            <Text style={styles.closeText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={contracts}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>📝 Contrats-cadres</Text>
              <Text style={styles.sub}>{contracts.length} contrats</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: colors.primary }]}>{filtreStats.actifs}</Text><Text style={styles.statLabel}>Actifs</Text></View>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: colors.warning }]}>{filtreStats.negociations}</Text><Text style={styles.statLabel}>Négociations</Text></View>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: colors.success }]}>{filtreStats.termines}</Text><Text style={styles.statLabel}>Terminés</Text></View>
            </View>

            <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.newText}>+ Nouveau contrat</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Tous les contrats</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Aucun contrat" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
            <View style={styles.cardRow}>
              <Text style={styles.cardId}>{item.id}</Text>
              <View style={[styles.badge, { backgroundColor: getContractStatusColor(item.statut) + "20" }]}>
                <Text style={[styles.badgeText, { color: getContractStatusColor(item.statut) }]}>{getContractStatusIcon(item.statut)} {formatContractStatut(item.statut)}</Text>
              </View>
            </View>
            <Text style={styles.cardTitre}>{item.titre}</Text>
            <Text style={styles.cardProduit}>{item.produit} · {item.quantite}{item.unite} · {item.montantTotal.toLocaleString()} FCFA</Text>
            <Text style={styles.cardAcheteur}>{item.acheteurNom} · Créé le {item.dateCreation}</Text>
          </TouchableOpacity>
        )}
      />
      <DetailModal />
      <CreateModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 6 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  newBtn: { backgroundColor: colors.primary, padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  newText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  cardId: { fontSize: 13, fontWeight: "700", color: colors.textTertiary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  cardTitre: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 2 },
  cardProduit: { fontSize: 13, color: colors.textSecondary },
  cardAcheteur: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalId: { fontSize: 14, fontWeight: "700", color: colors.textTertiary },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statutText: { fontSize: 12, fontWeight: "600" },
  modalTitre: { fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: 2 },
  modalPart: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 8 },
  modalSub: { fontSize: 14, color: colors.text, marginBottom: 4 },
  comingSoon: { fontSize: 13, color: colors.textTertiary, fontStyle: "italic" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 13, color: colors.textSecondary },
  detailVal: { fontSize: 14, fontWeight: "600", color: colors.text },
  sectionBox: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12, marginTop: 10 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 6 },
  sectionText: { fontSize: 12, color: colors.text, lineHeight: 17 },
  echeanceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  echType: { fontSize: 12, fontWeight: "600", color: colors.text },
  echDate: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
  echMontant: { fontSize: 13, fontWeight: "700", color: colors.text, flex: 1, textAlign: "right", marginRight: 8 },
  echStatut: { fontSize: 14 },
  histRow: { flexDirection: "row", gap: 10, paddingVertical: 4 },
  histDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  histContent: { flex: 1 },
  histAction: { fontSize: 12, fontWeight: "600", color: colors.text },
  histMeta: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: colors.success, padding: 12, borderRadius: 12, alignItems: "center" },
  actionText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  primaryBtn: { backgroundColor: colors.primary, padding: 12, borderRadius: 12, alignItems: "center", marginTop: 12 },
  primaryText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text, marginBottom: 12, backgroundColor: colors.background },
  closeBtn: { alignItems: "center", padding: 12, marginTop: 8 },
  closeText: { color: colors.textSecondary, fontSize: 15 },
});
