import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, StyleSheet, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import EmptyState from "../components/EmptyState";
import LocalValidationBadge from "../components/LocalValidationBadge";
import SecurityBadge from "../components/SecurityBadge";
import TransactionReceipt from "../components/TransactionReceipt";
import { useAuthStore } from "../store/authStore";
import { useHaptic } from "../hooks/useHaptic";
import { artificialLatency } from "../hooks/useLatency";

const FEE_PERCENT = 2;

interface Escrow {
  id: string; lot: string; montant: number; frais: number; totalBloque: number;
  statut: "hold" | "released"; date: string; acheteur: string; producteur: string;
}

const ESCROWS: Escrow[] = [
  { id: "ESC-001", lot: "LOT-B012", montant: 650000, frais: 13000, totalBloque: 663000, statut: "hold", date: "2026-06-06", acheteur: "Koffi A.", producteur: "Marie D." },
  { id: "ESC-002", lot: "LOT-B015", montant: 1250000, frais: 25000, totalBloque: 1275000, statut: "released", date: "2026-06-04", acheteur: "Koffi A.", producteur: "Sébastien T." },
  { id: "ESC-003", lot: "LOT-C002", montant: 340000, frais: 6800, totalBloque: 346800, statut: "hold", date: "2026-06-01", acheteur: "Koffi A.", producteur: "Amadou B." },
];

export default function EscrowScreen() {
  const { t } = useTranslation();
  const { trigger } = useHaptic();
  const { user } = useAuthStore();
  const role = user?.role || "acheteur";
  const isBuyer = role === "acheteur";

  const [modal, setModal] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [lot, setLot] = useState("");
  const [montant, setMontant] = useState("");
  const [lastRef, setLastRef] = useState("");

  const montantNum = parseFloat(montant.replace(/\s/g, "")) || 0;
  const frais = Math.round(montantNum * FEE_PERCENT / 100);
  const total = montantNum + frais;

  const handleSubmit = async () => {
    if (!lot || montantNum <= 0) return;
    const ref = `ESC-${Date.now().toString(36).toUpperCase()}`;
    setLastRef(ref);
    setModal(false);
    // Micro-latence artificielle : le séquestre doit
    // être perçu comme un acte lourd et sécurisé
    await artificialLatency();
    trigger("release"); // vibration ascendante fluide
    setReceiptVisible(true);
  };

  return (
    <View style={styles.container}>
      <TransactionReceipt
        visible={receiptVisible}
        montant={montantNum || total}
        reference={lastRef}
        produit={`${t("escrow.newDeposit")} — ${lot}`}
        date={new Date().toLocaleDateString()}
        onDone={() => { setReceiptVisible(false); setLot(""); setMontant(""); }}
      />
      {isBuyer && (
        <TouchableOpacity style={styles.submitBtn} onPress={() => setModal(true)}>
          <Text style={styles.submitText}>+ {t("escrow.newDeposit")}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.banner}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Text style={styles.bannerTitle}>🔒 {t("escrow.securedBy")}</Text>
          <LocalValidationBadge type="synced" />
        </View>
        <Text style={styles.bannerText}>{t("escrow.bceaoRule")}</Text>
        <View style={styles.feeBadge}>
          <Text style={styles.feeBadgeText}>{t("escrow.fee")} {FEE_PERCENT}%</Text>
        </View>
      </View>

      <FlatList
        data={ESCROWS}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<EmptyState title={t("escrow.noEscrows")} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>{item.id}</Text>
              <View style={[styles.badge, item.statut === "hold" ? styles.badgeHold : styles.badgeReleased]}>
                <Text style={[styles.badgeText, item.statut === "hold" ? styles.badgeTextHold : styles.badgeTextReleased]}>
                  {item.statut === "hold" ? t("escrow.hold") : t("escrow.released")}
                </Text>
              </View>
            </View>
            <View style={styles.row}><Text style={styles.label}>{t("lots.title")}</Text><Text style={styles.value}>{item.lot}</Text></View>
            <View style={styles.row}><Text style={styles.label}>{t("escrow.montant")}</Text><Text style={styles.value}>{item.montant.toLocaleString()} FCFA</Text></View>
            <View style={styles.row}><Text style={styles.label}>{t("escrow.frais")} ({FEE_PERCENT}%)</Text><Text style={styles.value}>{item.frais.toLocaleString()} FCFA</Text></View>
            <View style={styles.row}><Text style={styles.label}>{t("escrow.total")}</Text><Text style={[styles.value, { fontWeight: "700", color: colors.secondary }]}>{item.totalBloque.toLocaleString()} FCFA</Text></View>
            {item.statut === "hold" && isBuyer && (
              <TouchableOpacity style={styles.releaseBtn}>
                <Text style={styles.releaseBtnText}>{t("escrow.release")}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("escrow.newDeposit")}</Text>
            <TextInput style={styles.input} placeholder={`${t("lots.title")} ID`} value={lot} onChangeText={setLot} placeholderTextColor={colors.textTertiary} />
            <TextInput style={styles.input} placeholder={`${t("escrow.montant")} (FCFA)`} value={montant} onChangeText={setMontant} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />

            {montantNum > 0 && (
              <View style={styles.summary}>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{t("escrow.montant")}</Text><Text style={styles.summaryValue}>{montantNum.toLocaleString()} FCFA</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>+ {t("escrow.frais")} ({FEE_PERCENT}%)</Text><Text style={[styles.summaryValue, { color: colors.accent }]}>{frais.toLocaleString()} FCFA</Text></View>
                <View style={[styles.summaryRow, styles.summaryTotal]}><Text style={styles.summaryTotalLabel}>{t("escrow.total")}</Text><Text style={styles.summaryTotalValue}>{total.toLocaleString()} FCFA</Text></View>
              </View>
            )}

            <Text style={styles.bceaoNote}>📋 {t("escrow.bceaoOrderDesc")}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, (montantNum <= 0 || !lot) && { opacity: 0.4 }]} onPress={handleSubmit} disabled={montantNum <= 0 || !lot}>
                <Text style={styles.confirmText}>🔒 {t("escrow.block")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cognitive Shielding : badge persistant rassurant durant le flux paiement */}
      <SecurityBadge size="sm" pulsing={receiptVisible} hash={`ESC-${ESCROWS.length + 1}`.padEnd(12, "A")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingBottom: 60 },
  submitBtn: { backgroundColor: colors.primary, margin: 16, marginBottom: 0, padding: 14, borderRadius: 14, alignItems: "center" },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  banner: { backgroundColor: colors.primary + "08", margin: 16, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.primary + "20" },
  bannerTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 4 },
  bannerText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  feeBadge: { backgroundColor: colors.accent, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 8 },
  feeBadgeText: { fontSize: 11, color: colors.white, fontWeight: "700" },
  card: { backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cardId: { fontSize: 13, fontWeight: "700", color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeHold: { backgroundColor: colors.warning + "20" },
  badgeReleased: { backgroundColor: colors.success + "20" },
  badgeText: { fontSize: 11, fontWeight: "600" },
  badgeTextHold: { color: colors.warning },
  badgeTextReleased: { color: colors.success },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  label: { fontSize: 13, color: colors.textTertiary },
  value: { fontSize: 13, color: colors.text },
  releaseBtn: { backgroundColor: colors.success, marginTop: 10, padding: 12, borderRadius: 10, alignItems: "center" },
  releaseBtnText: { color: colors.white, fontWeight: "600", fontSize: 13 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 14, textAlign: "center" },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, marginBottom: 10 },
  summary: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 14, marginBottom: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  summaryLabel: { fontSize: 13, color: colors.textTertiary },
  summaryValue: { fontSize: 13, color: colors.text, fontWeight: "500" },
  summaryTotal: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, paddingTop: 8 },
  summaryTotalLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  summaryTotalValue: { fontSize: 16, fontWeight: "800", color: colors.secondary },
  bceaoNote: { fontSize: 11, color: colors.textTertiary, marginBottom: 14, textAlign: "center", fontStyle: "italic" },
  modalActions: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: "center" },
  cancelText: { color: colors.textSecondary, fontWeight: "600" },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.secondary, alignItems: "center" },
  confirmText: { color: colors.white, fontWeight: "700" },
});
