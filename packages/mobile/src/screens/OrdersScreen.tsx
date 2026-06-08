import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";
import { getOrders, Order, getOrderStatusLabel, getOrderStatusColor, getOrderStatusIcon } from "../services/orders";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ErrorView from "../components/ErrorView";
import { useVoiceRecording } from "../hooks/useVoiceRecording";

function OrderTimeline({ events }: { events: Order["events"] }) {
  return (
    <View style={styles.timeline}>
      {events.map((ev, i) => (
        <View key={i} style={styles.timelineItem}>
          <View style={styles.timelineDot}>
            <Text style={styles.timelineDotIcon}>{getOrderStatusIcon(ev.statut)}</Text>
          </View>
          {i < events.length - 1 && <View style={styles.timelineLine} />}
          <View style={styles.timelineContent}>
            <Text style={styles.timelineDate}>{ev.date}</Text>
            <Text style={styles.timelineDesc}>{ev.description}</Text>
            <Text style={styles.timelineActor}>— {ev.acteur}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filterStatut, setFilterStatut] = useState("");
  const [error, setError] = useState("");
  const voice = useVoiceRecording();

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const data = await getOrders(user?.role, user?.id);
      setOrders(data);
    } catch {
      setError(t("common.error"));
    }
    setLoading(false); setRefreshing(false);
  }, [t, user]);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorView message={error} onRetry={() => load()} />;

  const allStatuts = Array.from(new Set(orders.map(o => o.statut)));
  const filtered = filterStatut ? orders.filter(o => o.statut === filterStatut) : orders;
  const sorted = [...filtered].sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View style={styles.filtersRow}>
            <TouchableOpacity style={[styles.filterChip, !filterStatut && styles.filterActive]} onPress={() => setFilterStatut("")}>
              <Text style={[styles.filterText, !filterStatut && styles.filterTextActive]}>Toutes</Text>
            </TouchableOpacity>
            {allStatuts.map(s => (
              <TouchableOpacity key={s} style={[styles.filterChip, filterStatut === s && styles.filterActive]} onPress={() => setFilterStatut(s)}>
                <Text style={[styles.filterText, filterStatut === s && styles.filterTextActive]}>{getOrderStatusIcon(s)} {getOrderStatusLabel(s)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        ListEmptyComponent={<EmptyState title="Aucune commande" />}
        contentContainerStyle={sorted.length === 0 ? { flex: 1, padding: 16 } : { padding: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>{item.id}</Text>
              <View style={[styles.badge, { backgroundColor: getOrderStatusColor(item.statut) + "20" }]}>
                <Text style={[styles.badgeText, { color: getOrderStatusColor(item.statut) }]}>
                  {getOrderStatusIcon(item.statut)} {getOrderStatusLabel(item.statut)}
                </Text>
              </View>
            </View>
            <Text style={styles.produit}>{item.produit} — {item.quantite}{item.unite}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.montant}>{item.montantTotal.toLocaleString()} FCFA</Text>
              <Text style={styles.acheteur}>{item.acheteurNom}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.dateCreation).toLocaleDateString("fr-FR")}</Text>
            {item.escrowRef && <Text style={styles.escrowRef}>🔒 {item.escrowRef}</Text>}
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} contentContainerStyle={{ padding: 20 }}>
            {selected && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selected.id}</Text>
                  <View style={[styles.badge, { backgroundColor: getOrderStatusColor(selected.statut) + "20" }]}>
                    <Text style={[styles.badgeText, { color: getOrderStatusColor(selected.statut) }]}>
                      {getOrderStatusIcon(selected.statut)} {getOrderStatusLabel(selected.statut)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Produit</Text>
                  <Text style={styles.sectionValue}>{selected.produit}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Quantité</Text>
                  <Text style={styles.sectionValue}>{selected.quantite} {selected.unite}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Prix unitaire</Text>
                  <Text style={styles.sectionValue}>{selected.prixUnitaire.toLocaleString()} FCFA</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Montant total</Text>
                  <Text style={[styles.sectionValue, { fontWeight: "700", color: colors.primary }]}>{selected.montantTotal.toLocaleString()} FCFA</Text>
                </View>

                {selected.fraisSequestre && (
                  <View style={[styles.detailSection, { backgroundColor: colors.accent + "10", borderRadius: 10, padding: 10 }]}>
                    <Text style={styles.sectionLabel}>Frais de séquestre (2%)</Text>
                    <Text style={styles.sectionValue}>{selected.fraisSequestre.toLocaleString()} FCFA</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Acheteur</Text>
                  <Text style={styles.sectionValue}>{selected.acheteurNom}</Text>
                </View>

                {selected.transporteurNom && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Transporteur</Text>
                    <Text style={styles.sectionValue}>{selected.transporteurNom}</Text>
                  </View>
                )}

                {selected.dateLivraisonPrevue && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Livraison prévue</Text>
                    <Text style={styles.sectionValue}>{new Date(selected.dateLivraisonPrevue).toLocaleDateString("fr-FR")}</Text>
                  </View>
                )}

                {selected.dateLivraisonReelle && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Livrée le</Text>
                    <Text style={[styles.sectionValue, { color: colors.success }]}>{new Date(selected.dateLivraisonReelle).toLocaleDateString("fr-FR")}</Text>
                  </View>
                )}

                <Text style={styles.timelineTitle}>📋 Chronologie</Text>
                <OrderTimeline events={selected.events} />

                {selected.statut === "conteste" && (
                  <View style={styles.disputeBanner}>
                    <Text style={styles.disputeText}>⚠️ Cette commande est contestée. Contactez le support AgriTrace.</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.voiceBtn} onPress={async () => {
                  if (voice.recording) {
                    const r = await voice.stopRecording();
                    if (r) Alert.alert("✅ Confirmé", `Commande ${selected.id} confirmée\n${(r.durationMs/1000).toFixed(1)}s — preuve vocale enregistrée`);
                  } else {
                    const s = await voice.startRecording();
                    if (s === "permission_denied") Alert.alert("Permission", "Autorisez le microphone dans Paramètres");
                    else if (s === "started") Alert.alert("🎤 Enregistrement", "Parlez pour confirmer...");
                  }
                }}>
                  <Text style={styles.voiceBtnText}>{voice.recording ? "⬛ Arrêter" : "🎤 Confirmer par message vocal"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.closeBtnText}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filtersRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.surfaceAlt },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },
  filterTextActive: { color: colors.white, fontWeight: "600" },
  card: { backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardId: { fontSize: 13, fontWeight: "700", color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  produit: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 6 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  montant: { fontSize: 16, fontWeight: "700", color: colors.primary },
  acheteur: { fontSize: 12, color: colors.textSecondary },
  date: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
  escrowRef: { fontSize: 11, color: colors.accent, fontWeight: "500", marginTop: 2 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  detailSection: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border + "50" },
  sectionLabel: { fontSize: 13, color: colors.textTertiary },
  sectionValue: { fontSize: 14, color: colors.text, fontWeight: "500" },
  timelineTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 16, marginBottom: 12 },
  timeline: { paddingLeft: 4 },
  timelineItem: { flexDirection: "row", marginBottom: 4, position: "relative" },
  timelineDot: { width: 32, alignItems: "center", zIndex: 1 },
  timelineDotIcon: { fontSize: 14 },
  timelineLine: { position: "absolute", left: 16, top: 20, bottom: -8, width: 2, backgroundColor: colors.border, zIndex: 0 },
  timelineContent: { flex: 1, paddingLeft: 8, paddingBottom: 16 },
  timelineDate: { fontSize: 10, color: colors.textTertiary },
  timelineDesc: { fontSize: 13, color: colors.text, fontWeight: "500", marginTop: 1 },
  timelineActor: { fontSize: 11, color: colors.textSecondary, marginTop: 1, fontStyle: "italic" },
  disputeBanner: { backgroundColor: colors.error + "15", padding: 14, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: colors.error + "30" },
  disputeText: { fontSize: 13, color: colors.error, fontWeight: "500", lineHeight: 18 },
  voiceBtn: { backgroundColor: colors.success + "15", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: colors.success + "30" },
  voiceBtnText: { color: colors.success, fontWeight: "700", fontSize: 13 },
  closeBtn: { backgroundColor: colors.surfaceAlt, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 16 },
  closeBtnText: { fontSize: 15, fontWeight: "600", color: colors.text },
});
