import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, Modal, RefreshControl, StyleSheet, Alert } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { useAuthStore } from "../store/authStore";
import { useNetworkStatus } from "../utils/network";
import { enqueueAction } from "../storage/offline";

const SPREAD_PERCENT = 11;

const MOCK_OFFERS = [
  { id: "ao_1", acheteur: "Cargill Bénin", culture: "Maïs blanc", quantiteMin: 50, quantiteMax: 200, prixProducteur: 180, prixAcheteur: 200, region: "Donga", qualite: "Grade A", dateLimite: "2026-07-15", statut: "ouvert" },
  { id: "ao_2", acheteur: "Nestlé Côte d'Ivoire", culture: "Cacao bio", quantiteMin: 20, quantiteMax: 100, prixProducteur: 1500, prixAcheteur: 1665, region: "Couffo", qualite: "Certifié bio", dateLimite: "2026-08-01", statut: "ouvert" },
  { id: "ao_3", acheteur: "Olam Agri", culture: "Soja", quantiteMin: 100, quantiteMax: 500, prixProducteur: 250, prixAcheteur: 278, region: "Alibori", qualite: "Non-OGM", dateLimite: "2026-06-30", statut: "clos" },
];

export default function OffersScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const role = user?.role || "producteur";
  const [offers, setOffers] = useState(MOCK_OFFERS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [culture, setCulture] = useState("");
  const [prixMin, setPrixMin] = useState("");
  const [region, setRegion] = useState("");
  const [quantiteMin, setQuantiteMin] = useState("");
  const [quantiteMax, setQuantiteMax] = useState("");
  const [qualite, setQualite] = useState("");
  const [dateLimite, setDateLimite] = useState("");
  const isOnline = useNetworkStatus();

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data } = await import("../services/api").then(m => m.default.get("/offers"));
      setOffers(data);
    } catch { setOffers(MOCK_OFFERS); }
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = () => {
    if (!culture || !quantiteMin || !prixMin) {
      Alert.alert(t("common.error"), t("offers.requiredFields"));
      return;
    }
    const newOffer = {
      id: `ao_${Date.now()}`,
      acheteur: user?.company || "Acheteur",
      culture,
      quantiteMin: Number(quantiteMin),
      quantiteMax: Number(quantiteMax) || Number(quantiteMin) * 2,
      prixProducteur: Number(prixMin),
      prixAcheteur: Math.round(Number(prixMin) * (1 + SPREAD_PERCENT / 100) * 1.05),
      region: region || "National",
      qualite: qualite || "Standard",
      dateLimite: dateLimite || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      statut: "ouvert",
    };
    setOffers((prev) => [newOffer, ...prev]);
    resetForm();
    setModalVisible(false);
    if (!isOnline) {
      enqueueAction("CREATE_OFFER", newOffer);
    }
    Alert.alert(t("common.success"), t("offers.created"));
  };

  const resetForm = () => {
    setCulture(""); setPrixMin(""); setRegion("");
    setQuantiteMin(""); setQuantiteMax(""); setQualite(""); setDateLimite("");
  };

  const mesOffres = role === "acheteur" ? offers.filter((o) => o.acheteur === user?.company) : [];
  const [onglet, setOnglet] = useState<"toutes" | "mes">("toutes");
  const dataSource = onglet === "mes" && role === "acheteur" ? mesOffres : offers;

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={dataSource}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View>
            {role === "acheteur" && (
              <>
                <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
                  <Text style={styles.createBtnText}>+ {t("offers.create")}</Text>
                </TouchableOpacity>
                <View style={styles.tabRow}>
                  {(["toutes", "mes"] as const).map((tab) => (
                    <TouchableOpacity key={tab} style={[styles.tab, onglet === tab && styles.tabActive]} onPress={() => setOnglet(tab)}>
                      <Text style={[styles.tabText, onglet === tab && styles.tabTextActive]}>{t(`offers.${tab}`)} ({tab === "toutes" ? offers.length : mesOffres.length})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>📊 Prix nets — Spread intégré</Text>
              {role === "producteur" && <Text style={styles.bannerText}>Vous voyez votre prix net producteur. L'acheteur voit un prix incluant frais de séquestre.</Text>}
              {role === "acheteur" && <Text style={styles.bannerText}>Vous voyez le prix tout compris (séquestre + spread). Le producteur reçoit son prix net.</Text>}
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState title={t("offers.noOffers")} />}
        contentContainerStyle={offers.length === 0 ? { flex: 1, padding: 16 } : { padding: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.culture}</Text>
              <View style={[styles.badge, { backgroundColor: item.statut === "ouvert" ? colors.success + "20" : colors.textTertiary + "20" }]}>
                <Text style={[styles.badgeText, { color: item.statut === "ouvert" ? colors.success : colors.textTertiary }]}>{t(`offers.${item.statut}`)}</Text>
              </View>
            </View>
            <Text style={styles.buyer}>{item.acheteur}</Text>
            <Text style={styles.region}>{item.region} — {item.qualite}</Text>
            <Text style={styles.quantite}>{item.quantiteMin}-{item.quantiteMax}t</Text>
            {role === "producteur" || role === "intermediaire" ? (
              <Text style={styles.prix}>{formatCurrency(item.prixProducteur)}/kg <Text style={{ fontSize: 11, color: colors.textTertiary }}>(net producteur)</Text></Text>
            ) : (
              <View>
                <Text style={styles.prix}>{formatCurrency(item.prixAcheteur)}/kg <Text style={{ fontSize: 11, color: colors.textTertiary }}>(tout compris)</Text></Text>
                <Text style={styles.spreadHint}>Dont spread ~{SPREAD_PERCENT}% + frais séquestre</Text>
              </View>
            )}
            <Text style={styles.date}>{t("offers.dateLimite")}: {item.dateLimite}</Text>
            {item.statut === "ouvert" && role === "acheteur" && item.acheteur === user?.company && (
              <TouchableOpacity style={styles.closeBtn} onPress={() => {
                setOffers((prev) => prev.map((o) => o.id === item.id ? { ...o, statut: "clos" } : o));
              }}>
                <Text style={styles.closeBtnText}>{t("offers.fermer")}</Text>
              </TouchableOpacity>
            )}
            {item.statut === "ouvert" && role !== "acheteur" && (
              <TouchableOpacity style={styles.respondBtn}>
                <Text style={styles.respondBtnText}>{t("offers.repondre")}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modal} contentContainerStyle={{ padding: 24 }}>
            <Text style={styles.modalTitle}>{t("offers.create")}</Text>
            <TextInput style={styles.input} placeholder={t("offers.culture")} placeholderTextColor={colors.textTertiary} value={culture} onChangeText={setCulture} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder={t("offers.quantiteMin")} placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={quantiteMin} onChangeText={setQuantiteMin} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder={t("offers.quantiteMax")} placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={quantiteMax} onChangeText={setQuantiteMax} />
            </View>
            <TextInput style={styles.input} placeholder={t("offers.prixMin")} placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={prixMin} onChangeText={setPrixMin} />
            <TextInput style={styles.input} placeholder={t("offers.region")} placeholderTextColor={colors.textTertiary} value={region} onChangeText={setRegion} />
            <TextInput style={styles.input} placeholder={t("offers.qualite")} placeholderTextColor={colors.textTertiary} value={qualite} onChangeText={setQualite} />
            <TextInput style={styles.input} placeholder={t("offers.dateLimite")} placeholderTextColor={colors.textTertiary} value={dateLimite} onChangeText={setDateLimite} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
              <Text style={styles.submitBtnText}>{t("common.send")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function formatCurrency(n: number) { return `${n.toLocaleString()} FCFA`; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  createBtn: { backgroundColor: colors.secondary, padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 8 },
  createBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  tabRow: { flexDirection: "row", marginBottom: 10, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.primary + "15" },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: colors.primary },
  banner: { backgroundColor: colors.primary + "08", padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.primary + "15" },
  bannerTitle: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 2 },
  bannerText: { fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
  card: { marginBottom: 10, borderRadius: 14, backgroundColor: colors.surface, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  buyer: { fontSize: 13, color: colors.textSecondary },
  region: { fontSize: 12, color: colors.textTertiary },
  quantite: { fontSize: 14, fontWeight: "600", color: colors.text, marginTop: 4 },
  prix: { fontSize: 16, fontWeight: "700", color: colors.primary },
  spreadHint: { fontSize: 10, color: colors.accent, fontStyle: "italic" },
  date: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  respondBtn: { marginTop: 10, backgroundColor: colors.success, padding: 12, borderRadius: 10, alignItems: "center" },
  respondBtnText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  closeBtn: { marginTop: 10, backgroundColor: colors.error + "15", padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: colors.error + "30" },
  closeBtnText: { color: colors.error, fontWeight: "700", fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text, marginBottom: 12, backgroundColor: colors.background },
  submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 8 },
  submitBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  cancelBtn: { alignItems: "center", padding: 12 },
  cancelText: { color: colors.textSecondary, fontSize: 14 },
});
