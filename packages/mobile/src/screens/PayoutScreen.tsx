import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, RefreshControl, Modal, StyleSheet, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { fetchPayouts, fetchPayoutStats, initiatePayout } from "../services/payout";
import { formatCurrency, getStatusColor, getStatusLabel, formatDateTime } from "../utils/format";
import { colors } from "../theme";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorView from "../components/ErrorView";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import type { PayoutRecord, PayoutStats } from "../types";

const PROVIDERS = [
  { key: "mtn", labelKey: "mtn" },
  { key: "moov", labelKey: "moov" },
  { key: "orange", labelKey: "orange" },
];

export default function PayoutScreen() {
  const { t } = useTranslation();
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState("mtn");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const [p, s] = await Promise.all([fetchPayouts(), fetchPayoutStats()]);
      setPayouts(p);
      setStats(s);
    } catch { setError(t("common.error")); }
    setLoading(false); setRefreshing(false);
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!amount || !phone) return;
    setSubmitting(true);
    try {
      await initiatePayout({ amount: Number(amount), phone, provider });
      setModalVisible(false);
      setAmount(""); setPhone("");
      Alert.alert(t("common.success"), t("payout.success"));
      load();
    } catch { Alert.alert(t("common.error"), t("common.error")); }
    setSubmitting(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorView message={error} onRetry={() => load()} />;

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}>
        {stats && (
          <View style={styles.statsRow}>
            <StatCard label={t("payout.totalDisbursed")} value={formatCurrency(stats.totalDisbursed)} />
            <StatCard label={t("payout.totalTransactions")} value={stats.totalTransactions} color={colors.secondary} />
            <StatCard label={t("payout.successRate")} value={`${Math.round(stats.successRate)}%`} color={colors.accent} />
            <StatCard label={t("payout.pending")} value={stats.pendingCount} color={stats.pendingCount > 0 ? colors.accent : colors.success} />
          </View>
        )}

        <TouchableOpacity style={styles.initiateBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.initiateBtnText}>{t("payout.initiate")}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t("payout.history")}</Text>
        {payouts.length === 0 ? (
          <EmptyState title={t("payout.noPayouts")} />
        ) : (
          payouts.map((p) => (
            <View key={p.id} style={styles.payoutCard}>
              <View style={styles.payoutHeader}>
                <Text style={styles.payoutAmount}>{formatCurrency(p.amount)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(p.status) + "20" }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(p.status) }]}>{getStatusLabel(p.status)}</Text>
                </View>
              </View>
              <Text style={styles.payoutMeta}>{p.provider} — {p.phone}</Text>
              <Text style={styles.payoutDate}>{formatDateTime(p.createdAt)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("payout.initiate")}</Text>
            <TextInput style={styles.input} placeholder={t("payout.amount")} placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.input} placeholder={t("payout.phone")} placeholderTextColor={colors.textTertiary} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <Text style={styles.label}>{t("payout.provider")}</Text>
            <View style={styles.providerRow}>
              {PROVIDERS.map((p) => (
                <TouchableOpacity key={p.key} style={[styles.providerBtn, provider === p.key && styles.providerBtnActive]} onPress={() => setProvider(p.key)}>
                  <Text style={[styles.providerText, provider === p.key && styles.providerTextActive]}>{t(`payout.${p.labelKey}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.5 }]} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitBtnText}>{submitting ? t("common.sending") : t("payout.submit")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
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
  initiateBtn: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center" },
  initiateBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, paddingHorizontal: 16, marginBottom: 8 },
  payoutCard: { marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12, backgroundColor: colors.surface, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  payoutHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  payoutAmount: { fontSize: 17, fontWeight: "700", color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "600" },
  payoutMeta: { fontSize: 12, color: colors.textSecondary },
  payoutDate: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text, marginBottom: 12, backgroundColor: colors.background },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 },
  providerRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  providerBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  providerBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + "10" },
  providerText: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  providerTextActive: { color: colors.primary, fontWeight: "700" },
  submitBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 8 },
  submitBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  cancelBtn: { alignItems: "center", padding: 12 },
  cancelText: { color: colors.textSecondary, fontSize: 14 },
});
