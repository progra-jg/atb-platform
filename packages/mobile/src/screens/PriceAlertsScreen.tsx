import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert, Switch, StyleSheet } from "react-native";
import { colors } from "../theme";
import { enqueueAction } from "../storage/offline";
import { useNetworkStatus } from "../utils/network";
import EmptyState from "../components/EmptyState";

const PRODUITS = ["Maïs", "Soja", "Cacao", "Riz", "Anacarde", "Manioc", "Niébé", "Oignon", "Coton", "Palmier"];
const REGIONS = ["Toutes", "Alibori", "Atacora", "Atlantique", "Borgou", "Collines", "Couffo", "Donga", "Littoral", "Mono", "Ouémé", "Plateau", "Zou"];

interface AlertePrix {
  id: string;
  produit: string;
  region: string;
  type: "hausse" | "baisse";
  seuil: number;
  actif: boolean;
  dateCreation: string;
  derniereNotification?: string;
}

const MOCK_ALERTES: AlertePrix[] = [
  { id: "alert-001", produit: "Maïs", region: "Zou", type: "hausse", seuil: 200, actif: true, dateCreation: "2026-05-20", derniereNotification: "2026-06-05" },
  { id: "alert-002", produit: "Soja", region: "Toutes", type: "baisse", seuil: 220, actif: true, dateCreation: "2026-05-22" },
  { id: "alert-003", produit: "Cacao", region: "Plateau", type: "hausse", seuil: 1600, actif: false, dateCreation: "2026-04-10" },
  { id: "alert-004", produit: "Riz", region: "Alibori", type: "baisse", seuil: 300, actif: true, dateCreation: "2026-06-01", derniereNotification: "2026-06-07" },
];

export default function PriceAlertsScreen() {
  const isOnline = useNetworkStatus();
  const [alertes, setAlertes] = useState<AlertePrix[]>(MOCK_ALERTES);
  const [showCreate, setShowCreate] = useState(false);
  const [showHistorique, setShowHistorique] = useState(false);
  const [newProduit, setNewProduit] = useState(PRODUITS[0]);
  const [newRegion, setNewRegion] = useState(REGIONS[0]);
  const [newType, setNewType] = useState<"hausse" | "baisse">("hausse");
  const [newSeuil, setNewSeuil] = useState("");

  const handleToggle = (id: string) => {
    setAlertes(prev => prev.map(a => a.id === id ? { ...a, actif: !a.actif } : a));
    if (!isOnline) enqueueAction("alertes/toggle", { alertId: id });
  };

  const handleDelete = (id: string) => {
    Alert.alert("Supprimer l'alerte", "Confirmer la suppression ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => {
        setAlertes(prev => prev.filter(a => a.id !== id));
        if (!isOnline) enqueueAction("alertes/delete", { alertId: id });
      }},
    ]);
  };

  const handleCreate = () => {
    const seuil = parseInt(newSeuil);
    if (isNaN(seuil) || seuil <= 0) { Alert.alert("Seuil invalide"); return; }
    const alerte: AlertePrix = {
      id: `alert-${Date.now()}`, produit: newProduit, region: newRegion,
      type: newType, seuil, actif: true, dateCreation: new Date().toISOString().slice(0, 10),
    };
    setAlertes(prev => [alerte, ...prev]);
    setShowCreate(false);
    setNewSeuil("");
    if (!isOnline) enqueueAction("alertes/create", alerte);
    Alert.alert("✅ Alerte créée", `${newProduit} ${newType === "hausse" ? ">" : "<"} ${seuil} FCFA (${newRegion})`);
  };

  const historiqueMock = [
    { date: "2026-06-07", message: "Riz a dépassé 300 FCFA/kg en Alibori (actuel: 315 FCFA)", type: "déclenchée" },
    { date: "2026-06-05", message: "Maïs a dépassé 200 FCFA/kg dans le Zou (actuel: 210 FCFA)", type: "déclenchée" },
    { date: "2026-05-28", message: "Anacarde en baisse sous 500 FCFA/kg (actuel: 480 FCFA)", type: "déclenchée" },
    { date: "2026-05-15", message: "Soja sous 220 FCFA/kg — opportunité d'achat", type: "conseil" },
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={alertes}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>🔔 Alertes prix</Text>
              <Text style={styles.sub}>{alertes.filter(a => a.actif).length} alertes actives</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
                <Text style={styles.createText}>+ Nouvelle alerte</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.histBtn} onPress={() => setShowHistorique(true)}>
                <Text style={styles.histText}>📋 Historique</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Mes alertes</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Aucune alerte" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardProduit}>{item.produit}</Text>
                <Text style={styles.cardRegion}>📍 {item.region}</Text>
              </View>
              <Switch value={item.actif} onValueChange={() => handleToggle(item.id)} trackColor={{ false: colors.textTertiary, true: colors.primary + "60" }} thumbColor={item.actif ? colors.primary : "#ccc"} />
            </View>
            <View style={styles.cardSeuil}>
              <Text style={[styles.typeLabel, { color: item.type === "hausse" ? colors.success : colors.error }]}>
                {item.type === "hausse" ? "📈 Hausse" : "📉 Baisse"}
              </Text>
              <Text style={styles.seuilText}>{item.type === "hausse" ? ">" : "<"} {item.seuil} FCFA/kg</Text>
            </View>
            {item.derniereNotification && <Text style={styles.notifDate}>🕐 Dernière notification : {item.derniereNotification}</Text>}
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
              <Text style={styles.deleteText}>🗑️ Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>➕ Nouvelle alerte</Text>

            <Text style={styles.label}>Produit</Text>
            <View style={styles.pickerRow}>
              {PRODUITS.slice(0, 5).map(p => (
                <TouchableOpacity key={p} style={[styles.pickerItem, newProduit === p && styles.pickerActive]} onPress={() => setNewProduit(p)}>
                  <Text style={[styles.pickerText, newProduit === p && styles.pickerTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Région</Text>
            <View style={styles.pickerRow}>
              {REGIONS.slice(0, 6).map(r => (
                <TouchableOpacity key={r} style={[styles.pickerItem, newRegion === r && styles.pickerActive]} onPress={() => setNewRegion(r)}>
                  <Text style={[styles.pickerText, newRegion === r && styles.pickerTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeBtn, newType === "hausse" && styles.typeActiveH]} onPress={() => setNewType("hausse")}>
                <Text style={[styles.typeBtnText, newType === "hausse" && { color: colors.success }]}>📈 Hausse</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, newType === "baisse" && styles.typeActiveB]} onPress={() => setNewType("baisse")}>
                <Text style={[styles.typeBtnText, newType === "baisse" && { color: colors.error }]}>📉 Baisse</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Seuil (FCFA/kg)</Text>
            <TextInput style={styles.input} value={newSeuil} onChangeText={setNewSeuil} keyboardType="numeric" placeholder="ex: 200" placeholderTextColor={colors.textTertiary} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}><Text style={styles.cancelText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, !newSeuil && { opacity: 0.5 }]} onPress={handleCreate} disabled={!newSeuil}><Text style={styles.saveText}>✅ Créer l'alerte</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showHistorique} transparent animationType="slide" onRequestClose={() => setShowHistorique(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>📋 Historique des notifications</Text>
            <FlatList
              data={historiqueMock}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <View style={styles.histCard}>
                  <Text style={styles.histDate}>{item.date}</Text>
                  <Text style={styles.histMsg}>{item.message}</Text>
                  <Text style={[styles.histType, { color: item.type === "déclenchée" ? colors.success : colors.secondary }]}>{item.type === "déclenchée" ? "🔔 Déclenchée" : "💡 Conseil"}</Text>
                </View>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowHistorique(false)}><Text style={styles.closeText}>Fermer</Text></TouchableOpacity>
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
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 10 },
  actionRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  createBtn: { flex: 1, backgroundColor: colors.primary, padding: 12, borderRadius: 12, alignItems: "center" },
  createText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  histBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt },
  histText: { fontSize: 13, fontWeight: "600", color: colors.text },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLeft: { flex: 1 },
  cardProduit: { fontSize: 16, fontWeight: "700", color: colors.text },
  cardRegion: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cardSeuil: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  typeLabel: { fontSize: 13, fontWeight: "700" },
  seuilText: { fontSize: 20, fontWeight: "800", color: colors.text },
  notifDate: { fontSize: 11, color: colors.textTertiary, marginTop: 6 },
  deleteBtn: { marginTop: 8, alignSelf: "flex-end" },
  deleteText: { fontSize: 12, color: colors.error },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6, marginTop: 8 },
  pickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pickerItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.surfaceAlt },
  pickerActive: { backgroundColor: colors.primary + "25" },
  pickerText: { fontSize: 12, color: colors.textSecondary },
  pickerTextActive: { color: colors.primary, fontWeight: "600" },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: "center", borderWidth: 1.5, borderColor: "transparent" },
  typeActiveH: { borderColor: colors.success, backgroundColor: colors.success + "12" },
  typeActiveB: { borderColor: colors.error, backgroundColor: colors.error + "12" },
  typeBtnText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12, fontSize: 16, color: colors.text, textAlign: "center", marginBottom: 8 },
  modalActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: colors.surfaceAlt },
  cancelText: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: colors.primary },
  saveText: { fontSize: 14, color: colors.white, fontWeight: "700" },
  closeBtn: { alignItems: "center", padding: 12, marginTop: 8 },
  closeText: { color: colors.textSecondary, fontSize: 15 },
  histCard: { backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 10, marginBottom: 6 },
  histDate: { fontSize: 11, color: colors.textTertiary },
  histMsg: { fontSize: 13, color: colors.text, marginTop: 2 },
  histType: { fontSize: 11, fontWeight: "600", marginTop: 4 },
});
