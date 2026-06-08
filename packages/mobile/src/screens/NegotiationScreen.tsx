import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert, StyleSheet } from "react-native";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";
import { enqueueAction } from "../storage/offline";
import { useNetworkStatus } from "../utils/network";
import EmptyState from "../components/EmptyState";

interface Negotiation {
  id: string;
  lotId: string;
  offreId: string;
  produit: string;
  quantite: number;
  unite: string;
  prixPropose: number;
  prixActuel?: number;
  statut: "pending" | "accepted" | "declined" | "countered";
  acteur: string;
  role: string;
  date: string;
  message?: string;
  contrePropositions?: { prix: number; date: string; par: string }[];
}

const MOCK_NEGOS: Negotiation[] = [
  { id: "neg-001", lotId: "LOT-B012", offreId: "ao_1", produit: "Maïs blanc", quantite: 5000, unite: "kg", prixPropose: 180, statut: "pending", acteur: "Koffi Agbéko", role: "acheteur", date: "2026-06-07", message: "Pouvez-vous livrer 5 tonnes ?" },
  { id: "neg-002", lotId: "LOT-B015", offreId: "ao_2", produit: "Soja", quantite: 3000, unite: "kg", prixPropose: 240, prixActuel: 250, statut: "countered", acteur: "Olam Agri", role: "acheteur", date: "2026-06-05", message: "Proposons 240 FCFA/kg", contrePropositions: [{ prix: 245, date: "2026-06-06", par: "Vous" }] },
  { id: "neg-003", lotId: "LOT-C002", offreId: "ao_3", produit: "Cacao bio", quantite: 1000, unite: "kg", prixPropose: 1550, prixActuel: 1500, statut: "pending", acteur: "Cargill Bénin", role: "acheteur", date: "2026-06-08" },
];

export default function NegotiationScreen() {
  const { user } = useAuthStore();
  const isOnline = useNetworkStatus();
  const [negos, setNegos] = useState<Negotiation[]>(MOCK_NEGOS);
  const [showCounter, setShowCounter] = useState<Negotiation | null>(null);
  const [counterPrice, setCounterPrice] = useState("");

  const handleAccept = (item: Negotiation) => {
    Alert.alert("Accepter l'offre", `Accepter ${item.prixPropose} FCFA/kg pour ${item.produit} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Accepter", onPress: async () => {
        const updated = negos.map(n => n.id === item.id ? { ...n, statut: "accepted" as const } : n);
        setNegos(updated);
        if (isOnline) {
          Alert.alert("✅ Offre acceptée", `${item.produit} — ${item.prixPropose} FCFA/kg`);
        } else {
          await enqueueAction("negotiation/accept", { negotiationId: item.id });
          Alert.alert("✅ Accepté (hors-ligne)", "Sera synchronisé à la prochaine connexion");
        }
      }},
    ]);
  };

  const handleDecline = (item: Negotiation) => {
    Alert.alert("Refuser l'offre", `Refuser ${item.prixPropose} FCFA/kg ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Refuser", style: "destructive", onPress: async () => {
        const updated = negos.map(n => n.id === item.id ? { ...n, statut: "declined" as const } : n);
        setNegos(updated);
        if (!isOnline) await enqueueAction("negotiation/decline", { negotiationId: item.id });
      }},
    ]);
  };

  const handleCounter = () => {
    if (!showCounter || !counterPrice) return;
    const price = parseInt(counterPrice);
    if (isNaN(price) || price <= 0) { Alert.alert("Prix invalide"); return; }
    const updated = negos.map(n => n.id === showCounter.id ? {
      ...n, statut: "countered" as const, contrePropositions: [...(n.contrePropositions || []), { prix: price, date: new Date().toISOString().slice(0, 10), par: "Vous" }]
    } : n);
    setNegos(updated);
    setShowCounter(null);
    setCounterPrice("");
    if (!isOnline) enqueueAction("negotiation/counter", { negotiationId: showCounter.id, prix: price });
    Alert.alert("💬 Contre-proposition envoyée", `${price} FCFA/kg`);
  };

  const statuts = ["pending", "countered", "accepted", "declined"];

  return (
    <View style={styles.container}>
      <FlatList
        data={negos}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>💬 Négociations</Text>
            <Text style={styles.headerSub}>{negos.filter(n => n.statut === "pending" || n.statut === "countered").length} en cours</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Aucune négociation" />}
        renderItem={({ item }) => (
          <View style={[styles.card, (item.statut === "accepted" || item.statut === "declined") && styles.cardDimmed]}>
            <View style={styles.cardHeader}>
              <Text style={styles.produit}>{item.produit}</Text>
              <View style={[styles.badge, { backgroundColor: item.statut === "pending" ? colors.warning + "20" : item.statut === "accepted" ? colors.success + "20" : item.statut === "countered" ? colors.secondary + "20" : colors.textTertiary + "20" }]}>
                <Text style={[styles.badgeText, { color: item.statut === "pending" ? colors.warning : item.statut === "accepted" ? colors.success : item.statut === "countered" ? colors.secondary : colors.textTertiary }]}>
                  {item.statut === "pending" ? "En attente" : item.statut === "accepted" ? "Acceptée" : item.statut === "countered" ? "Contre-proposition" : "Refusée"}
                </Text>
              </View>
            </View>
            <Text style={styles.acteur}>{item.acteur} ({item.role})</Text>
            <Text style={styles.quantite}>{item.quantite} {item.unite} — {item.date}</Text>
            {item.message && <Text style={styles.message}>"{item.message}"</Text>}

            <View style={styles.priceBox}>
              {item.prixActuel && <View style={styles.priceCol}><Text style={styles.priceLabel}>Prix actuel</Text><Text style={styles.priceValueOld}>{item.prixActuel} F</Text></View>}
              <View style={styles.priceCol}><Text style={styles.priceLabel}>Offre</Text><Text style={[styles.priceValue, { color: colors.primary }]}>{item.prixPropose} FCFA</Text></View>
              {item.contrePropositions?.slice(-1).map((cp, i) => (
                <View key={i} style={styles.priceCol}><Text style={styles.priceLabel}>Contre</Text><Text style={[styles.priceValue, { color: colors.secondary }]}>{cp.prix} FCFA</Text></View>
              ))}
            </View>

            {(item.statut === "pending" || item.statut === "countered") && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
                  <Text style={styles.acceptText}>✅ Accepter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setShowCounter(item)}>
                  <Text style={styles.counterText}>💬 Contre-proposer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(item)}>
                  <Text style={styles.declineText}>❌ Refuser</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={!!showCounter} transparent animationType="slide" onRequestClose={() => setShowCounter(null)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>💰 Contre-proposition</Text>
            {showCounter && (
              <>
                <Text style={styles.modalProduit}>{showCounter.produit} — {showCounter.quantite}{showCounter.unite}</Text>
                <Text style={styles.modalInfo}>Offre actuelle : {showCounter.prixPropose} FCFA/kg</Text>
                <TextInput style={styles.input} placeholder="Votre prix (FCFA/kg)" value={counterPrice} onChangeText={setCounterPrice} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
                <TouchableOpacity style={styles.sendBtn} onPress={handleCounter}>
                  <Text style={styles.sendText}>💬 Envoyer la contre-proposition</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCounter(null)}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardDimmed: { opacity: 0.6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  produit: { fontSize: 15, fontWeight: "700", color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  acteur: { fontSize: 13, color: colors.textSecondary },
  quantite: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
  message: { fontSize: 12, color: colors.text, fontStyle: "italic", marginTop: 4, backgroundColor: colors.surfaceAlt, padding: 6, borderRadius: 6 },
  priceBox: { flexDirection: "row", gap: 12, marginTop: 8, backgroundColor: colors.surfaceAlt, padding: 10, borderRadius: 10 },
  priceCol: { flex: 1, alignItems: "center" },
  priceLabel: { fontSize: 10, color: colors.textTertiary, textTransform: "uppercase" },
  priceValue: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  priceValueOld: { fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginTop: 2, textDecorationLine: "line-through" },
  actions: { flexDirection: "row", gap: 6, marginTop: 10 },
  acceptBtn: { flex: 1, backgroundColor: colors.success, padding: 10, borderRadius: 10, alignItems: "center" },
  acceptText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  counterBtn: { flex: 1, backgroundColor: colors.secondary, padding: 10, borderRadius: 10, alignItems: "center" },
  counterText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  declineBtn: { flex: 1, backgroundColor: colors.surfaceAlt, padding: 10, borderRadius: 10, alignItems: "center" },
  declineText: { color: colors.error, fontSize: 12, fontWeight: "700" },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 8 },
  modalProduit: { fontSize: 14, color: colors.text, textAlign: "center", marginBottom: 4 },
  modalInfo: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 12 },
  input: { backgroundColor: colors.surfaceAlt, padding: 14, borderRadius: 12, fontSize: 16, color: colors.text, textAlign: "center", marginBottom: 10 },
  sendBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 8 },
  sendText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  cancelBtn: { alignItems: "center", padding: 10 },
  cancelText: { color: colors.textSecondary, fontSize: 14 },
});
