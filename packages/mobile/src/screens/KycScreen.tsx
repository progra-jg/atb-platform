import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";
import { useNetworkStatus } from "../utils/network";
import { enqueueAction } from "../storage/offline";
import SecurityBadge from "../components/SecurityBadge";

const KYC_LEVELS = [
  { level: 1, label: "level1", icon: "🪪", desc: "CNI recto/verso + Selfie" },
  { level: 2, label: "level2", icon: "🏠", desc: "Justificatif de domicile (facture eau/électricité)" },
  { level: 3, label: "level3", icon: "🤝", desc: "Vérification agent terrain + signature" },
];

export default function KycScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isOnline = useNetworkStatus();
  const isAgent = user?.role === "agent";
  const [currentLevel, setCurrentLevel] = useState(0);
  const [cniPhoto, setCniPhoto] = useState(false);
  const [selfiePhoto, setSelfiePhoto] = useState(false);
  const [residenceDoc, setResidenceDoc] = useState(false);
  const [prodNom, setProdNom] = useState("");
  const [prodPhone, setProdPhone] = useState("");
  const [prodVillage, setProdVillage] = useState("");

  const canUpgradeTo = (level: number) => {
    if (level === 1) return true;
    if (level === 2) return cniPhoto && selfiePhoto;
    if (level === 3) return cniPhoto && selfiePhoto && residenceDoc;
    return false;
  };

  const handleUpgrade = (level: number) => {
    if (!canUpgradeTo(level)) {
      Alert.alert("KYC", t("kyc.required"));
      return;
    }
    Alert.alert(t("common.success"), `${t("kyc.level")} ${level} ✓`);
    setCurrentLevel(level);
  };

  const handleAgentRegister = () => {
    if (!prodNom || !prodPhone) {
      Alert.alert("Champs requis", "Nom et téléphone du producteur obligatoires");
      return;
    }
    const payload = { nom: prodNom, phone: prodPhone, village: prodVillage, kycLevel: currentLevel, agentId: user?.id, date: new Date().toISOString() };
    if (!isOnline) enqueueAction("agent/register", payload);
    Alert.alert("✅ Producteur inscrit", `${prodNom} — KYC niveau ${currentLevel}\n${!isOnline ? " (mis en file d'attente)" : ""}`);
    setProdNom(""); setProdPhone(""); setProdVillage("");
  };

  const getStatusColor = (level: number) => {
    if (currentLevel >= level) return colors.success;
    if (canUpgradeTo(level)) return colors.accent;
    return colors.textTertiary;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {isAgent && (
        <View style={styles.agentBanner}>
          <Text style={styles.agentBannerTitle}>👤 Mode Agent de terrain</Text>
          <Text style={styles.agentBannerText}>Inscrivez un nouveau producteur et validez son KYC</Text>
        </View>
      )}

      {isAgent && (
        <View style={styles.agentForm}>
          <Text style={styles.sectionTitle}>Nouveau producteur</Text>
          <TextInput style={styles.input} placeholder="Nom complet *" value={prodNom} onChangeText={setProdNom} placeholderTextColor={colors.textTertiary} />
          <TextInput style={styles.input} placeholder="Téléphone *" value={prodPhone} onChangeText={setProdPhone} keyboardType="phone-pad" placeholderTextColor={colors.textTertiary} />
          <TextInput style={styles.input} placeholder="Village / quartier" value={prodVillage} onChangeText={setProdVillage} placeholderTextColor={colors.textTertiary} />
          <TouchableOpacity style={styles.registerBtn} onPress={handleAgentRegister}>
            <Text style={styles.registerBtnText}>✅ Enregistrer le producteur</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.headerRow}>
        <Text style={styles.headerIcon}>🪪</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Vérification KYC</Text>
          <Text style={styles.headerSub}>Niveau actuel : {currentLevel}/3</Text>
        </View>
      </View>

      {KYC_LEVELS.map((k) => (
        <View key={k.level} style={[styles.levelCard, { borderLeftColor: getStatusColor(k.level) }]}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelIcon}>{k.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.levelTitle}>{t(`kyc.${k.label}`)}</Text>
              <Text style={styles.levelDesc}>{k.desc}</Text>
            </View>
            {currentLevel >= k.level ? (
              <Text style={styles.verifiedBadge}>✓</Text>
            ) : (
              <TouchableOpacity style={[styles.upgradeBtn, !canUpgradeTo(k.level) && { opacity: 0.4 }]}
                onPress={() => handleUpgrade(k.level)}>
                <Text style={styles.upgradeBtnText}>Valider</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Documents requis</Text>
      <TouchableOpacity style={styles.docRow} onPress={() => setCniPhoto(!cniPhoto)}>
        <Text style={styles.docIcon}>📸</Text>
        <Text style={styles.docLabel}>Photo CNI recto/verso</Text>
        <Text style={[styles.docStatus, cniPhoto && { color: colors.success }]}>{cniPhoto ? "✓" : "—"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.docRow} onPress={() => setSelfiePhoto(!selfiePhoto)}>
        <Text style={styles.docIcon}>🤳</Text>
        <Text style={styles.docLabel}>Selfie</Text>
        <Text style={[styles.docStatus, selfiePhoto && { color: colors.success }]}>{selfiePhoto ? "✓" : "—"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.docRow} onPress={() => setResidenceDoc(!residenceDoc)}>
        <Text style={styles.docIcon}>🏠</Text>
        <Text style={styles.docLabel}>Justificatif de domicile</Text>
        <Text style={[styles.docStatus, residenceDoc && { color: colors.success }]}>{residenceDoc ? "✓" : "—"}</Text>
      </TouchableOpacity>

      <SecurityBadge size="sm" style={{ marginTop: 20 }} hash={`KYC-${(user?.kycLevel || 0) + 1}`} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  agentBanner: { backgroundColor: colors.accent + "15", padding: 14, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.accent + "25" },
  agentBannerTitle: { fontSize: 15, fontWeight: "700", color: colors.accent, marginBottom: 2 },
  agentBannerText: { fontSize: 12, color: colors.textSecondary },
  agentForm: { backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginBottom: 16 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text, marginBottom: 10, backgroundColor: colors.background },
  registerBtn: { backgroundColor: colors.success, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 4 },
  registerBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20, backgroundColor: colors.surface, padding: 16, borderRadius: 16 },
  headerIcon: { fontSize: 32 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  headerSub: { fontSize: 13, color: colors.textSecondary },
  levelCard: { marginBottom: 10, backgroundColor: colors.surface, padding: 14, borderRadius: 14, borderLeftWidth: 3 },
  levelHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelIcon: { fontSize: 24 },
  levelTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  levelDesc: { fontSize: 12, color: colors.textSecondary },
  verifiedBadge: { fontSize: 20, color: colors.success, fontWeight: "700" },
  upgradeBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  upgradeBtnText: { color: colors.white, fontWeight: "600", fontSize: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 16, marginBottom: 8 },
  docRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 12, marginBottom: 6 },
  docIcon: { fontSize: 18, marginRight: 10 },
  docLabel: { flex: 1, fontSize: 14, color: colors.text },
  docStatus: { fontSize: 16, color: colors.textTertiary, fontWeight: "700" },
});
