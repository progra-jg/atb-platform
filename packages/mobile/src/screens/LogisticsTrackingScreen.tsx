import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, StyleSheet } from "react-native";
import { colors } from "../theme";
import { enqueueAction } from "../storage/offline";
import { useNetworkStatus } from "../utils/network";
import EmptyState from "../components/EmptyState";

interface Livraison {
  id: string;
  orderId: string;
  produit: string;
  quantite: number;
  unite: string;
  origine: string;
  destination: string;
  transporteur: string;
  transporteurTel: string;
  statut: "preparation" | "en_transit" | "douane" | "arrive" | "livre" | "probleme";
  dateDepart: string;
  dateArriveePrevue: string;
  dateArriveeReelle?: string;
  qrCode: string;
  evenements: { date: string; lieu: string; statut: string; note?: string }[];
  coutTransport: number;
}

const MOCK_LIVRAISONS: Livraison[] = [
  { id: "LIV-001", orderId: "CMD-001", produit: "Maïs blanc", quantite: 2500, unite: "kg", origine: "Covè", destination: "Cotonou", transporteur: "Mamadou Koné", transporteurTel: "+229 97 11 22 33", statut: "en_transit", dateDepart: "2026-06-08", dateArriveePrevue: "2026-06-10", qrCode: "QR-LIV-001", evenements: [
    { date: "2026-06-08 06:00", lieu: "Covè", statut: "Chargement", note: "2.5T maïs blanc chargé" },
    { date: "2026-06-08 08:30", lieu: "PK10", statut: "Passage péage" },
    { date: "2026-06-08 11:00", lieu: "Bohicon", statut: "Contrôle routier" },
  ], coutTransport: 45000 },
  { id: "LIV-002", orderId: "CMD-003", produit: "Cacao bio", quantite: 1000, unite: "kg", origine: "Pobè", destination: "Cotonou", transporteur: "Aliou Sy", transporteurTel: "+229 61 11 22 33", statut: "preparation", dateDepart: "2026-06-10", dateArriveePrevue: "2026-06-11", qrCode: "QR-LIV-002", evenements: [
    { date: "2026-06-09 14:00", lieu: "Pobè", statut: "Inspection", note: "Cacao conforme, humidité 7.2%" },
  ], coutTransport: 25000 },
  { id: "LIV-003", orderId: "CMD-002", produit: "Soja", quantite: 3000, unite: "kg", origine: "Dassa", destination: "Parakou", transporteur: "Kossi Zinsou", transporteurTel: "+229 54 11 22 33", statut: "livre", dateDepart: "2026-06-05", dateArriveePrevue: "2026-06-07", dateArriveeReelle: "2026-06-06", qrCode: "QR-LIV-003", evenements: [
    { date: "2026-06-05 07:00", lieu: "Dassa", statut: "Chargement" },
    { date: "2026-06-05 10:00", lieu: "Glazoué", statut: "Transit" },
    { date: "2026-06-05 15:00", lieu: "Tchaourou", statut: "Poste pesée" },
    { date: "2026-06-06 09:00", lieu: "Parakou", statut: "Livré", note: "Livré avec succès, 3T conformes" },
  ], coutTransport: 55000 },
];

const STATUT_STYLES = {
  preparation: { bg: colors.warning + "20", text: colors.warning, label: "📦 Préparation", icon: "📦" },
  en_transit: { bg: colors.primary + "20", text: colors.primary, label: "🚛 En transit", icon: "🚛" },
  douane: { bg: colors.secondary + "20", text: colors.secondary, label: "🛃 Douane", icon: "🛃" },
  arrive: { bg: colors.success + "20", text: colors.success, label: "📍 Arrivé", icon: "📍" },
  livre: { bg: colors.success + "30", text: colors.success, label: "✅ Livré", icon: "✅" },
  probleme: { bg: colors.error + "20", text: colors.error, label: "⚠️ Problème", icon: "⚠️" },
};

export default function LogisticsTrackingScreen() {
  const isOnline = useNetworkStatus();
  const [livraisons] = useState<Livraison[]>(MOCK_LIVRAISONS);
  const [selected, setSelected] = useState<Livraison | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const [calcDist, setCalcDist] = useState("");
  const [calcPoids, setCalcPoids] = useState("");

  const calculerCout = () => {
    const dist = parseFloat(calcDist) || 0;
    const poids = parseFloat(calcPoids) || 0;
    const base = 5000;
    const km = dist * 150;
    const tonne = (poids / 1000) * 2000;
    const total = base + km + tonne;
    Alert.alert("💰 Estimation transport", `Base: ${base.toLocaleString()} F\nDistance: ${km.toLocaleString()} F (${dist} km)\nPoids: ${tonne.toLocaleString()} F (${poids/1000}T)\n---\nTotal: ${total.toLocaleString()} FCFA`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={livraisons}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>🚚 Logistique</Text>
              <Text style={styles.sub}>{livraisons.filter(l => l.statut !== "livre").length} en cours</Text>
            </View>
            <TouchableOpacity style={styles.calcBtn} onPress={() => setShowCalc(true)}>
              <Text style={styles.calcText}>💰 Calculer coût transport</Text>
            </TouchableOpacity>
            <Text style={styles.sectionLabel}>Suivi des livraisons</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Aucune livraison" />}
        renderItem={({ item }) => {
          const ss = STATUT_STYLES[item.statut];
          return (
            <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardId}>{item.id}</Text>
                <View style={[styles.badge, { backgroundColor: ss.bg }]}>
                  <Text style={[styles.badgeText, { color: ss.text }]}>{ss.label}</Text>
                </View>
              </View>
              <Text style={styles.cardProduit}>{item.produit} · {item.quantite}{item.unite}</Text>
              <Text style={styles.cardTrajet}>{item.origine} → {item.destination}</Text>
              <Text style={styles.cardTransport}>🚛 {item.transporteur}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>📅 {item.dateDepart} → {item.dateArriveePrevue}</Text>
                <Text style={styles.cardCout}>{item.coutTransport.toLocaleString()} F</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <FlatList
              data={selected?.evenements || []}
              keyExtractor={(_, i) => String(i)}
              ListHeaderComponent={selected ? () => {
                const ss = STATUT_STYLES[selected.statut];
                return (
                  <View>
                    <View style={styles.modalHeader}>
                      <View>
                        <Text style={styles.modalId}>{selected.id}</Text>
                        <Text style={styles.modalOrder}>Commande : {selected.orderId}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: ss.bg }]}>
                        <Text style={[styles.badgeText, { color: ss.text }]}>{ss.label}</Text>
                      </View>
                    </View>

                    <Text style={styles.modalProduit}>{selected.produit} · {selected.quantite}{selected.unite}</Text>
                    <Text style={styles.modalTrajet}>📍 {selected.origine} → {selected.destination}</Text>

                    <View style={styles.contactRow}>
                      <Text style={styles.contactLabel}>🚛 Transporteur</Text>
                      <Text style={styles.contactNom}>{selected.transporteur}</Text>
                      <Text style={styles.contactTel}>{selected.transporteurTel}</Text>
                    </View>

                    <View style={styles.qrBox}>
                      <Text style={styles.qrIcon}>📱</Text>
                      <Text style={styles.qrCode}>{selected.qrCode}</Text>
                      <Text style={styles.qrHint}>QR code livraison — à scanner à l'arrivée</Text>
                    </View>

                    <View style={styles.datesRow}>
                      <Text style={styles.dateText}>Départ : {selected.dateDepart}</Text>
                      <Text style={styles.dateText}>Arrivée prévue : {selected.dateArriveePrevue}</Text>
                      {selected.dateArriveeReelle && <Text style={[styles.dateText, { color: colors.success }]}>Arrivée réelle : {selected.dateArriveeReelle}</Text>}
                    </View>

                    <Text style={styles.sectionLabel}>📜 Chronologie</Text>
                  </View>
                );
              } : () => null}
              renderItem={({ item, index }) => (
                <View style={styles.eventRow}>
                  <View style={styles.eventLine}>
                    <View style={styles.eventDot} />
                    {index < (selected?.evenements.length || 0) - 1 && <View style={styles.eventDash} />}
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventStatut}>{item.statut}</Text>
                    <Text style={styles.eventLieu}>📍 {item.lieu}</Text>
                    <Text style={styles.eventDate}>{item.date}</Text>
                    {item.note && <Text style={styles.eventNote}>💬 {item.note}</Text>}
                  </View>
                </View>
              )}
              ListFooterComponent={() => selected?.statut !== "livre" ? (
                <TouchableOpacity style={styles.updateBtn} onPress={() => {
                  if (!isOnline) enqueueAction("logistics/update", { livraisonId: selected?.id });
                  Alert.alert("✅ Mise à jour", "Événement ajouté (simulation)");
                }}>
                  <Text style={styles.updateText}>+ Ajouter un événement</Text>
                </TouchableOpacity>
              ) : null}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showCalc} transparent animationType="slide" onRequestClose={() => setShowCalc(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>💰 Calcul coût transport</Text>
            <Text style={styles.formule}>Base 5 000 F + (distance × 150 F) + (poids T × 2 000 F)</Text>
            <TextInput style={styles.input} placeholder="Distance (km)" value={calcDist} onChangeText={setCalcDist} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
            <TextInput style={styles.input} placeholder="Poids (kg)" value={calcPoids} onChangeText={setCalcPoids} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
            <TouchableOpacity style={styles.estimerBtn} onPress={calculerCout}>
              <Text style={styles.estimerText}>💵 Estimer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCalc(false)}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 6 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  calcBtn: { backgroundColor: colors.primary + "15", padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 14, borderWidth: 1, borderColor: colors.primary + "30" },
  calcText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  cardId: { fontSize: 13, fontWeight: "700", color: colors.textTertiary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  cardProduit: { fontSize: 15, fontWeight: "700", color: colors.text },
  cardTrajet: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardTransport: { fontSize: 12, color: colors.text, marginTop: 2 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  cardDate: { fontSize: 11, color: colors.textTertiary },
  cardCout: { fontSize: 13, fontWeight: "700", color: colors.primary },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  modalId: { fontSize: 16, fontWeight: "700", color: colors.text },
  modalOrder: { fontSize: 12, color: colors.textTertiary },
  modalProduit: { fontSize: 15, fontWeight: "600", color: colors.text, marginTop: 6 },
  modalTrajet: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  contactRow: { backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 10, marginTop: 8 },
  contactLabel: { fontSize: 10, color: colors.textTertiary, textTransform: "uppercase" },
  contactNom: { fontSize: 14, fontWeight: "600", color: colors.text },
  contactTel: { fontSize: 13, color: colors.primary },
  qrBox: { backgroundColor: colors.primary + "10", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: colors.primary + "30", borderStyle: "dashed" },
  qrIcon: { fontSize: 32 },
  qrCode: { fontSize: 14, fontWeight: "700", color: colors.primary, marginTop: 4 },
  qrHint: { fontSize: 10, color: colors.textTertiary, marginTop: 2 },
  datesRow: { marginTop: 8, gap: 2 },
  dateText: { fontSize: 12, color: colors.textSecondary },
  eventRow: { flexDirection: "row", gap: 10, marginBottom: 2 },
  eventLine: { alignItems: "center", width: 16 },
  eventDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  eventDash: { width: 2, flex: 1, backgroundColor: colors.primary + "40", marginTop: 2 },
  eventContent: { flex: 1, paddingBottom: 12 },
  eventStatut: { fontSize: 14, fontWeight: "600", color: colors.text },
  eventLieu: { fontSize: 12, color: colors.textSecondary },
  eventDate: { fontSize: 11, color: colors.textTertiary },
  eventNote: { fontSize: 12, color: colors.text, fontStyle: "italic", marginTop: 2, backgroundColor: colors.surfaceAlt, padding: 6, borderRadius: 6 },
  updateBtn: { backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 12, alignItems: "center", marginTop: 8 },
  updateText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  closeBtn: { alignItems: "center", padding: 12, marginTop: 8 },
  closeText: { color: colors.textSecondary, fontSize: 15 },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12, fontSize: 16, color: colors.text, textAlign: "center", marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 4 },
  formule: { fontSize: 11, color: colors.textTertiary, fontStyle: "italic", marginBottom: 12 },
  estimerBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center" },
  estimerText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});
