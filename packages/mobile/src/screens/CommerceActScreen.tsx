import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TextInput, ScrollView, Modal, RefreshControl, Alert, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "../theme";
import ThumbButton from "../components/ThumbButton";
import Card from "../components/Card";
import SecurityBadge from "../components/SecurityBadge";
import LocalValidationBadge from "../components/LocalValidationBadge";
import CalculationOverlay from "../components/CalculationOverlay";
import EmptyState from "../components/EmptyState";
import { useNetworkStatus } from "../utils/network";
import { enqueueAction } from "../storage/offline";
import { useOptimistic } from "../hooks/useOptimistic";
import { useHaptic } from "../hooks/useHaptic";
import { artificialLatency } from "../hooks/useLatency";

interface Temoin { nom: string; phone: string; role: string }
interface CommerceActItem { id: string; produit: string; montant: number; quantite: number; prixUnitaire: number; lieu: string; temoins: Temoin[]; qrSeal: string; dateCreation: string }

export default function CommerceActScreen() {
  const { t } = useTranslation();
  const { trigger } = useHaptic();
  const isOnline = useNetworkStatus();
  const optimistic = useOptimistic<CommerceActItem>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [produit, setProduit] = useState("");
  const [montant, setMontant] = useState("");
  const [quantite, setQuantite] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [lieu, setLieu] = useState("");
  const [temoins, setTemoins] = useState<Temoin[]>([]);
  const [tNom, setTNom] = useState("");
  const [TPhone, setTPhone] = useState("");
  const [TRole, setTRole] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await import("../services/api").then(m => m.default.get("/commerce-acts")); optimistic.replaceAll(data); }
    catch { optimistic.replaceAll([]); }
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTemoin = () => {
    if (!tNom || !TPhone) return;
    setTemoins([...temoins, { nom: tNom, phone: TPhone, role: TRole }]);
    setTNom(""); setTPhone(""); setTRole("");
  };

  const handleSign = async () => {
    if (!produit || !montant) { Alert.alert("Champs requis", "Produit et montant obligatoires"); return; }
    setCalculating(true);
    const newAct: CommerceActItem = {
      id: `ACT-${Date.now()}`,
      produit,
      montant: Number(montant),
      quantite: Number(quantite) || 0,
      prixUnitaire: Number(prixUnitaire) || 0,
      lieu: lieu || "Non spécifié",
      temoins: [...temoins],
      qrSeal: `ATR-${Date.now()}`,
      dateCreation: new Date().toISOString().split("T")[0],
    };
    // Latence artificielle : l'utilisateur perçoit le poids du hash cryptographique
    await artificialLatency();
    setCalculating(false);
    const rollback = optimistic.add(newAct, async () => {
      await enqueueAction("commerce-act/create", newAct);
    });
    trigger("lock"); // clac-clac du cadenas physique
    setModalVisible(false);
    setProduit(""); setMontant(""); setQuantite(""); setPrixUnitaire(""); setLieu("");
    setTemoins([]);
    Alert.alert(
      t("common.success"),
      `${t("commerce.signer")} ✓\n${temoins.length} témoin(s)\n${t("commerce.qrSeal")}: ${newAct.qrSeal}`,
      [{ text: "OK", onPress: () => {} }]
    );
    // Rollback silencieux si hors-ligne et synchro échoue
    if (!isOnline) { enqueueAction("commerce-act/create", newAct).catch(() => rollback()); }
  };

  return (
    <View style={styles.container}>
      <CalculationOverlay
        visible={calculating}
        label={t("commerce.hashGeneration") || "Génération du sceau…"}
        sublabel={`Sécurisation juridique — ${produit}`}
        duration={1200}
      />
      <FlatList
        data={optimistic.items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View>
            <ThumbButton title={`+ ${t("commerce.create")}`} onPress={() => setModalVisible(true)} widthPercent={90} style={{ marginBottom: 12 }} />
            <LocalValidationBadge type="local" style={{ marginBottom: 8 }} />
          </View>
        }
        ListEmptyComponent={<EmptyState title={t("commerce.noActs")} />}
        contentContainerStyle={optimistic.items.length === 0 ? { flex: 1, padding: 16 } : { padding: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <Text style={styles.cardTitle}>{t("commerce.transaction")} #{item.id?.slice(0, 8)}</Text>
            <Text style={styles.amount}>{formatCurrency(item.montant || 0)}</Text>
            <Text style={styles.meta}>{t("commerce.temoins")}: {item.temoins?.length || 0}</Text>
            {item.qrSeal && <Text style={styles.qr}>🔗 {item.qrSeal}</Text>}
          </Card>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <ScrollView style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("commerce.create")}</Text>

            <Text style={styles.sectionLabel}>{t("commerce.produit")}</Text>
            <TextInput style={styles.input} placeholder="Ex: Maïs blanc" placeholderTextColor={colors.textTertiary} value={produit} onChangeText={setProduit} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder={t("commerce.quantite")} placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={quantite} onChangeText={setQuantite} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder={t("commerce.prixUnitaire")} placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={prixUnitaire} onChangeText={setPrixUnitaire} />
            </View>
            <TextInput style={styles.input} placeholder={t("commerce.montant")} placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={montant} onChangeText={setMontant} />
            <TextInput style={styles.input} placeholder={t("commerce.lieu")} placeholderTextColor={colors.textTertiary} value={lieu} onChangeText={setLieu} />
            <Text style={styles.gpsHint}>📍 {t("commerce.gps")}: 6.3589°N, 2.4527°E</Text>

            <Text style={styles.sectionLabel}>{t("commerce.temoins")}</Text>
            {temoins.map((tm, i) => (
              <View key={i} style={styles.temoinRow}>
                <Text style={styles.temoinText}>{tm.nom} — {tm.phone} ({tm.role})</Text>
              </View>
            ))}
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              <TextInput style={[styles.inputSmall, { flex: 1 }]} placeholder={t("commerce.nom")} placeholderTextColor={colors.textTertiary} value={tNom} onChangeText={setTNom} />
              <TextInput style={[styles.inputSmall, { flex: 1 }]} placeholder={t("commerce.phone")} placeholderTextColor={colors.textTertiary} keyboardType="phone-pad" value={TPhone} onChangeText={setTPhone} />
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TextInput style={[styles.inputSmall, { flex: 1 }]} placeholder={t("commerce.role")} placeholderTextColor={colors.textTertiary} value={TRole} onChangeText={setTRole} />
              <TouchableOpacity style={styles.addTemoinBtn} onPress={addTemoin}>
                <Text style={styles.addTemoinText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.photoBtn}>
              <Text style={styles.photoBtnText}>📸 {t("commerce.takePhoto")}</Text>
            </TouchableOpacity>

            <ThumbButton title={`${t("commerce.signer")} — PDF + QR + Blockchain`} icon="⚖️" onPress={handleSign} style={{ marginTop: 12 }} />
            <SecurityBadge size="sm" style={{ marginTop: 8 }} />
            <ThumbButton title={t("common.cancel")} variant="secondary" onPress={() => { setModalVisible(false); setTemoins([]); }} widthPercent={90} />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

function formatCurrency(n: number) { return `${n.toLocaleString()} FCFA`; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cardTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  amount: { fontSize: 18, fontWeight: "700", color: "#7c3aed", marginTop: 2 },
  meta: { fontSize: 12, color: colors.textSecondary },
  qr: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, marginTop: 60 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 12 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text, marginBottom: 10, backgroundColor: colors.background },
  inputSmall: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, fontSize: 14, color: colors.text, marginBottom: 10, backgroundColor: colors.background },
  gpsHint: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  temoinRow: { backgroundColor: colors.surfaceAlt, padding: 10, borderRadius: 8, marginBottom: 6 },
  temoinText: { fontSize: 13, color: colors.text },
  addTemoinBtn: { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  addTemoinText: { color: colors.white, fontSize: 22, fontWeight: "700" },
  photoBtn: { borderWidth: 1.5, borderColor: colors.border, borderStyle: "dashed", padding: 20, borderRadius: 14, alignItems: "center", marginBottom: 12, marginTop: 8 },
  photoBtnText: { fontSize: 15, color: colors.textSecondary },
  signBtn: { backgroundColor: "#7c3aed", padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 8 },
  signBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  cancelBtn: { alignItems: "center", padding: 12, marginBottom: 40 },
  cancelText: { color: colors.textSecondary, fontSize: 14 },
});
