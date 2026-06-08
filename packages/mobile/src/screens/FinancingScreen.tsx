import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, RefreshControl, Modal, Alert, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { checkEligibility, applyForFinancing, getActiveContracts, repayContract } from "../services/financing";
import { formatCurrency, getStatusColor, getStatusLabel } from "../utils/format";
import { colors } from "../theme";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorView from "../components/ErrorView";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { useAuthStore } from "../store/authStore";
import { computeReputationFromOrders } from "../services/reputation";
import ThumbButton from "../components/ThumbButton";
import type { FinancingEligibility, FinancingContract, FinancingOffer } from "../types";

export default function FinancingScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const producteurId = user?.id || "prod_1";
  const [trustScore, setTrustScore] = useState(650);

  const [eligibility, setEligibility] = useState<FinancingEligibility | null>(null);
  const [contracts, setContracts] = useState<FinancingContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<FinancingOffer | null>(null);
  const [amount, setAmount] = useState("");
  const [collateralRef, setCollateralRef] = useState("");
  const [applying, setApplying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const rep = await computeReputationFromOrders(user?.id || "", user?.role, user?.kycLevel);
      setTrustScore(rep.creditScore);
      const [elig, ctr] = await Promise.all([
        checkEligibility(producteurId, rep.creditScore),
        getActiveContracts(producteurId),
      ]);
      setEligibility(elig);
      setContracts(ctr);
    } catch { setError(t("common.error")); }
    setLoading(false); setRefreshing(false);
  }, [t, user]);

  useEffect(() => { load(); }, [load]);

  const handleApply = async () => {
    if (!selectedOffer || !amount) return;
    setApplying(true);
    try {
      await applyForFinancing(producteurId, trustScore, selectedOffer.id, Number(amount), "harvest", collateralRef || undefined);
      setModalVisible(false);
      setSelectedOffer(null); setAmount(""); setCollateralRef("");
      Alert.alert(t("common.success"), t("financing.applySuccess"));
      load();
    } catch { Alert.alert(t("common.error"), t("common.error")); }
    setApplying(false);
  };

  const handleRepay = async (id: string) => {
    try {
      await repayContract(id, 0, `repay_${Date.now()}`);
      Alert.alert(t("common.success"), t("financing.applySuccess"));
      load();
    } catch { Alert.alert(t("common.error"), t("common.error")); }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorView message={error} onRetry={() => load()} />;

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}>
        {eligibility && (
          <View style={styles.statsRow}>
            <StatCard label={t("financing.eligibility")} value={eligibility.eligible ? t("common.yes") : t("common.no")} color={eligibility.eligible ? colors.success : colors.error} />
            <StatCard label={t("financing.maxAmount")} value={formatCurrency(eligibility.maxAmount)} color={colors.secondary} />
            <StatCard label={t("financing.activeContracts")} value={eligibility.activeContracts} color={colors.accent} />
            <StatCard label={t("financing.repaymentRate")} value={`${eligibility.repaymentRate}%`} color={colors.success} />
          </View>
        )}

        {!eligibility?.eligible && (
          <View style={styles.notEligible}>
            <Text style={styles.notEligibleText}>{t("financing.notEligible")}</Text>
          </View>
        )}

        {eligibility?.eligible && (
          <>
            <Text style={styles.sectionTitle}>{t("financing.availableOffers")}</Text>
            {eligibility.availableOffers.map((offer) => (
              <TouchableOpacity key={offer.id} style={[styles.offerCard, selectedOffer?.id === offer.id && styles.offerCardActive]} onPress={() => { setSelectedOffer(offer); setModalVisible(true); }}>
                <View style={styles.offerHeader}>
                  <Text style={styles.offerLabel}>{offer.label}</Text>
                  <Text style={styles.offerScore}>{t("financing.scoreMin")} {offer.minTrustScore}</Text>
                </View>
                <Text style={styles.offerAmount}>{formatCurrency(offer.maxAmount)}</Text>
                <Text style={styles.offerMeta}>{offer.durationDays}j - {offer.interestRate}%</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>{t("financing.activeContracts")}</Text>
        {contracts.length === 0 ? (
          <EmptyState title={t("financing.noContracts")} />
        ) : (
          contracts.map((c) => (
            <View key={c.id} style={styles.contractCard}>
              <View style={styles.contractHeader}>
                <Text style={styles.contractAmount}>{formatCurrency(c.amount)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(c.status) + "20" }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(c.status) }]}>{getStatusLabel(c.status)}</Text>
                </View>
              </View>
              <Text style={styles.contractMeta}>{t("financing.repayable")}: {formatCurrency(c.totalRepayable)}</Text>
              {c.schedule.map((r, i) => (
                <View key={i} style={styles.scheduleRow}>
                  <Text style={styles.scheduleDate}>{new Date(r.dueDate).toLocaleDateString()}</Text>
                  <Text style={styles.scheduleAmount}>{formatCurrency(r.amount)}</Text>
                  <View style={[styles.scheduleStatus, { backgroundColor: getStatusColor(r.status) + "20" }]}>
                    <Text style={[styles.scheduleStatusText, { color: getStatusColor(r.status) }]}>{getStatusLabel(r.status)}</Text>
                  </View>
                </View>
              ))}
              {c.status === "active" && (
                <TouchableOpacity style={styles.repayBtn} onPress={() => handleRepay(c.id)}>
                  <Text style={styles.repayBtnText}>{t("financing.repayNow")}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("financing.applyTitle")}</Text>
            <TextInput style={styles.input} placeholder={t("financing.amount")} placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.input} placeholder={t("financing.collateralRef")} placeholderTextColor={colors.textTertiary} value={collateralRef} onChangeText={setCollateralRef} />
            <ThumbButton title={applying ? t("common.sending") : t("financing.apply")} onPress={handleApply} loading={applying} disabled={!selectedOffer || !amount} />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setSelectedOffer(null); }}>
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  statsRow: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, paddingHorizontal: 16, marginBottom: 8, marginTop: 8 },
  notEligible: { marginHorizontal: 16, padding: 14, borderRadius: 12, backgroundColor: colors.warningLight, borderWidth: 1, borderColor: colors.warning + "30" },
  notEligibleText: { fontSize: 13, color: colors.warning },
  offerCard: { marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  offerCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + "08" },
  offerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  offerLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  offerScore: { fontSize: 11, color: colors.textTertiary },
  offerAmount: { fontSize: 18, fontWeight: "700", color: colors.primary },
  offerMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  contractCard: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, backgroundColor: colors.surface, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  contractHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  contractAmount: { fontSize: 17, fontWeight: "700", color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "600" },
  contractMeta: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  scheduleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4, gap: 8 },
  scheduleDate: { flex: 1, fontSize: 12, color: colors.textSecondary },
  scheduleAmount: { fontSize: 12, fontWeight: "600", color: colors.text },
  scheduleStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  scheduleStatusText: { fontSize: 10, fontWeight: "600" },
  repayBtn: { marginTop: 10, backgroundColor: colors.primary, padding: 12, borderRadius: 10, alignItems: "center" },
  repayBtnText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text, marginBottom: 12, backgroundColor: colors.background },
  submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 8 },
  submitBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  cancelBtn: { alignItems: "center", padding: 12 },
  cancelText: { color: colors.textSecondary, fontSize: 14 },
});
