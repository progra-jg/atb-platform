import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, Modal, ScrollView, Alert, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { fetchLots } from "../services/lots";
import { formatCurrency, getStatusColor, getStatusLabel } from "../utils/format";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";
import { useNetworkStatus } from "../utils/network";
import { createLotOffline, getOfflineLots, mergeServerLots, markLotSynced, OfflineLot } from "../services/offlineLots";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorView from "../components/ErrorView";
import EmptyState from "../components/EmptyState";
import ThumbButton from "../components/ThumbButton";
import { useOptimistic } from "../hooks/useOptimistic";

export default function LotsScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isOnline = useNetworkStatus();
  const isProducer = user?.role === "producteur" || user?.role === "intermediaire";

  const [lots, setLots] = useState<OfflineLot[]>([]);
  const optimistic = useOptimistic<OfflineLot>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const [formCulture, setFormCulture] = useState("");
  const [formVariete, setFormVariete] = useState("");
  const [formQuantite, setFormQuantite] = useState("");
  const [formPrix, setFormPrix] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [formQualite, setFormQualite] = useState("");
  const [formCert, setFormCert] = useState("");
  const [formUnite, setFormUnite] = useState("kg");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      if (isOnline) {
        const data = await fetchLots();
        const userLots = isProducer ? data.filter((l: any) => l.producteurId === user?.id) : data;
        const merged = await mergeServerLots(userLots);
        optimistic.replaceAll(merged);
      } else {
        const cached = await getOfflineLots();
        const filtered = isProducer ? cached.filter(l => l.producteurId === user?.id) : cached;
        optimistic.replaceAll(filtered);
      }
    } catch {
      const cached = await getOfflineLots();
      optimistic.replaceAll(cached);
      if (cached.length === 0) setError(t("common.error"));
    }
    setLoading(false); setRefreshing(false);
  }, [isOnline, t, user, isProducer]);

  useEffect(() => { load(); }, [load]);

  const handleCreateLot = async () => {
    if (!formCulture || !formQuantite || !formPrix) {
      Alert.alert("Champs requis", "Culture, quantité et prix sont obligatoires");
      return;
    }
    const newLot = {
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      culture: formCulture,
      variete: formVariete || undefined,
      quantite: parseFloat(formQuantite),
      unite: formUnite,
      prix: parseFloat(formPrix),
      region: formRegion || user?.country || "Non spécifiée",
      origine: formRegion || user?.country || "Non spécifiée",
      qualite: formQualite || "Standard",
      certification: formCert || undefined,
      gps: undefined as [number, number] | undefined,
      producteur: user?.company || "Producteur",
      producteurId: user?.id || "",
      statut: "disponible",
      synced: false,
      createdOffline: !isOnline,
      createdAt: new Date().toISOString(),
    };
    const rollback = optimistic.add(newLot, async () => {
      await createLotOffline({
        culture: formCulture, variete: formVariete || undefined, quantite: parseFloat(formQuantite),
        unite: formUnite, prix: parseFloat(formPrix), region: formRegion || user?.country || "Non spécifiée",
        origine: formRegion || user?.country || "Non spécifiée", qualite: formQualite || "Standard",
        certification: formCert || undefined, producteur: user?.company || "Producteur", producteurId: user?.id || "",
        statut: "disponible",
      });
    });
    setModalVisible(false);
    resetForm();
    Alert.alert(isOnline ? "✅ Lot publié" : "✅ Lot créé hors-ligne", "Il apparaît immédiatement dans votre liste.");
  };

  const resetForm = () => {
    setFormCulture(""); setFormVariete(""); setFormQuantite("");
    setFormPrix(""); setFormRegion(""); setFormQualite(""); setFormCert(""); setFormUnite("kg");
  };

  const statuts = ["", "disponible", "reserve", "vendu"];
  const filteredLots = optimistic.items.filter(l => {
    const matchSearch = search ? l.culture.toLowerCase().includes(search.toLowerCase()) || (l.region || "").toLowerCase().includes(search.toLowerCase()) : true;
    const matchStatut = filterStatut ? l.statut === filterStatut : true;
    return matchSearch && matchStatut;
  });
  const unsyncedCount = optimistic.items.filter(l => l.createdOffline && !l.synced).length;

  if (loading) return <LoadingSpinner />;
  if (error && optimistic.items.length === 0) return <ErrorView message={error} onRetry={() => load()} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLots}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View>
            <View style={[styles.netBanner, { backgroundColor: isOnline ? colors.success + "15" : colors.warning + "15" }]}>
              <Text style={[styles.netText, { color: isOnline ? colors.success : colors.warning }]}>
                {isOnline ? "🟢 En ligne" : "🟡 Hors-ligne — les lots seront synchronisés plus tard"}
                {unsyncedCount > 0 && !isOnline ? ` (${unsyncedCount} en attente)` : ""}
              </Text>
            </View>
            <TextInput style={styles.search} placeholder={t("lots.searchPlaceholder")} placeholderTextColor={colors.textTertiary}
              value={search} onChangeText={setSearch} />
            <View style={styles.filters}>
              {statuts.map((s) => (
                <TouchableOpacity key={s} style={[styles.filterChip, filterStatut === s && styles.filterChipActive]}
                  onPress={() => setFilterStatut(s)}>
                  <Text style={[styles.filterText, filterStatut === s && styles.filterTextActive]}>
                    {s ? t(`lots.${s}`) : t("lots.all")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {isProducer && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.addBtnText}>+ {t("lots.add")} {!isOnline ? "📡" : ""}</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={<EmptyState title={t("lots.noLots")} />}
        contentContainerStyle={optimistic.items.length === 0 && filteredLots.length === 0 ? { flex: 1, padding: 16 } : { paddingBottom: 16, paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.card, item.createdOffline && !item.synced && styles.cardOffline]}>
            <View style={styles.cardHeader}>
              <Text style={styles.culture}>{item.culture}</Text>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                {item.createdOffline && !item.synced && <Text style={styles.offlineBadge}>📡</Text>}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) + "20" }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.statut) }]}>{getStatusLabel(item.statut)}</Text>
                </View>
              </View>
            </View>
            {item.variete && <Text style={styles.variete}>{item.variete}</Text>}
            <Text style={styles.origin}>{item.origine || item.region} — {item.region}</Text>
            <Text style={styles.price}>{formatCurrency(item.prix)}</Text>
            <Text style={styles.meta}>{item.quantite}{item.unite} — {item.producteur}</Text>
            {item.certification && <Text style={styles.cert}>{item.certification}</Text>}
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.modalTitle}>🌾 {t("lots.add")}</Text>

            <TextInput style={styles.input} placeholder="Culture *" value={formCulture} onChangeText={setFormCulture} placeholderTextColor={colors.textTertiary} />
            <TextInput style={styles.input} placeholder="Variété" value={formVariete} onChangeText={setFormVariete} placeholderTextColor={colors.textTertiary} />

            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 2 }]} placeholder="Quantité *" value={formQuantite} onChangeText={setFormQuantite} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
              <View style={styles.uniteRow}>
                {["kg", "t"].map(u => (
                  <TouchableOpacity key={u} style={[styles.uniteBtn, formUnite === u && styles.uniteBtnActive]} onPress={() => setFormUnite(u)}>
                    <Text style={[styles.uniteText, formUnite === u && styles.uniteTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput style={styles.input} placeholder="Prix unitaire (FCFA) *" value={formPrix} onChangeText={setFormPrix} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
            <TextInput style={styles.input} placeholder="Région" value={formRegion} onChangeText={setFormRegion} placeholderTextColor={colors.textTertiary} />
            <TextInput style={styles.input} placeholder="Qualité (Grade A, Bio...)" value={formQualite} onChangeText={setFormQualite} placeholderTextColor={colors.textTertiary} />
            <TextInput style={styles.input} placeholder="Certification" value={formCert} onChangeText={setFormCert} placeholderTextColor={colors.textTertiary} />

            <Text style={styles.offlineNote}>
              {isOnline
                ? "✅ En ligne — publication immédiate"
                : "📡 Hors-ligne — publié dès que le réseau revient"}
            </Text>

            <ThumbButton title={`🌾 ${t("lots.add")}`} onPress={handleCreateLot} style={{ marginTop: 8 }} />
            <ThumbButton title={t("common.cancel")} variant="secondary" onPress={() => { setModalVisible(false); resetForm(); }} widthPercent={90} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  netBanner: { padding: 8, borderRadius: 10, marginBottom: 8, alignItems: "center" },
  netText: { fontSize: 12, fontWeight: "600" },
  search: { padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text, marginBottom: 10 },
  filters: { flexDirection: "row", marginBottom: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surfaceAlt },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: colors.white, fontWeight: "600" },
  addBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  addBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  card: { marginBottom: 10, borderRadius: 14, backgroundColor: colors.surface, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardOffline: { borderLeftWidth: 3, borderLeftColor: colors.accent },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  culture: { fontSize: 16, fontWeight: "700", color: colors.text },
  offlineBadge: { fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "600" },
  variete: { fontSize: 12, color: colors.textTertiary, fontStyle: "italic", marginBottom: 2 },
  origin: { fontSize: 12, color: colors.textSecondary },
  price: { fontSize: 18, fontWeight: "700", color: colors.primary, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textTertiary },
  cert: { fontSize: 11, color: colors.accent, fontWeight: "500", marginTop: 2 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16, textAlign: "center" },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text, marginBottom: 10, backgroundColor: colors.background },
  row: { flexDirection: "row", gap: 8, marginBottom: 6 },
  uniteRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  uniteBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  uniteBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  uniteText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  uniteTextActive: { color: colors.white },
  offlineNote: { fontSize: 12, color: colors.textTertiary, textAlign: "center", marginBottom: 12, fontStyle: "italic" },
  submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 8 },
  submitBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  cancelBtn: { alignItems: "center", padding: 12 },
  cancelText: { color: colors.textSecondary, fontSize: 14 },
});
