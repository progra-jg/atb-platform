import { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Switch, StyleSheet, Alert, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import { formatBulletinMessage, formatBulletinSms, getDefaultBulletin, getDefaultPreferences, triggerBulletinPush, scheduleEveningBulletin, SoirBulletinItem, SoirPreferences } from "../services/marcheSoir";

export default function MarcheSoirScreen() {
  const { t } = useTranslation();
  const [bulletins] = useState<SoirBulletinItem[]>(getDefaultBulletin());
  const [prefs, setPrefs] = useState<SoirPreferences>(getDefaultPreferences());
  const [pushed, setPushed] = useState(false);

  const handleSendNow = async () => {
    setPushed(true);
    if (Platform.OS === "web") {
      Alert.alert("📱 Bulletin simulé", formatBulletinMessage(bulletins));
      return;
    }
    await triggerBulletinPush(bulletins);
    Alert.alert("✅ Bulletin envoyé", "Notification push Marché du Soir déclenchée");
  };

  const handleSchedule = async () => {
    if (Platform.OS === "web") {
      Alert.alert("📅 Programmation simulée", `Bulletin quotidien à ${prefs.heureEnvoi}`);
      return;
    }
    const [h, m] = prefs.heureEnvoi.split(":").map(Number);
    await scheduleEveningBulletin(bulletins, h, m);
    Alert.alert("✅ Programmé", `Bulletin automatique chaque jour à ${prefs.heureEnvoi}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={bulletins}
        keyExtractor={(_, i) => `${i}`}
        ListHeaderComponent={
          <View>
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>🌾 {t("marcheSoir.title")}</Text>
              <Text style={styles.bannerSub}>{new Date().toLocaleDateString("fr-FR")}</Text>
              <Text style={styles.bannerDesc}>{t("marcheSoir.desc")}</Text>
            </View>

            <View style={styles.controlCard}>
              <Text style={styles.controlTitle}>⚙️ {t("marcheSoir.preferences")}</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t("marcheSoir.actif")}</Text>
                <Switch value={prefs.actif} onValueChange={(v) => setPrefs({...prefs, actif: v})} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={prefs.actif ? colors.primary : colors.textTertiary} />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t("marcheSoir.heure")}</Text>
                <Text style={styles.heureValue}>{prefs.heureEnvoi}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.pushBtn} onPress={handleSendNow}>
                  <Text style={styles.pushBtnText}>📲 {t("marcheSoir.envoyer")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scheduleBtn} onPress={handleSchedule}>
                  <Text style={styles.scheduleBtnText}>📅 {t("marcheSoir.programmer")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t("marcheSoir.bulletin")} ({bulletins.length} produits)</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.produit}>{item.produit}</Text>
              <Text style={styles.tendance}>{item.tendance === "hausse" ? "📈" : item.tendance === "baisse" ? "📉" : "➡️"}</Text>
            </View>
            <Text style={styles.region}>{item.region}</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceCol}>
                <Text style={styles.priceLabel}>{t("market.producteur")}</Text>
                <Text style={styles.priceValue}>{item.prixProducteur.toLocaleString()}</Text>
                <Text style={styles.priceUnit}>FCFA</Text>
              </View>
              <Text style={styles.spread}>+{item.spread}</Text>
              <View style={styles.priceCol}>
                <Text style={styles.priceLabel}>{t("market.acheteur")}</Text>
                <Text style={[styles.priceValue, { color: colors.secondary }]}>{item.prixAcheteur.toLocaleString()}</Text>
                <Text style={styles.priceUnit}>FCFA</Text>
              </View>
            </View>
            <Text style={styles.volume}>{item.volume.toLocaleString()} tonnes</Text>
          </View>
        )}
      />

      {pushed && (
        <View style={styles.smsPreview}>
          <Text style={styles.smsTitle}>📱 SMS / USSD Preview</Text>
          <Text style={styles.smsText}>{formatBulletinSms(bulletins)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  banner: { backgroundColor: colors.accent + "15", padding: 18, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.accent + "30" },
  bannerTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 2 },
  bannerSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  bannerDesc: { fontSize: 12, color: colors.textTertiary, lineHeight: 17 },
  controlCard: { backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  controlTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 10 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  switchLabel: { fontSize: 14, color: colors.text },
  heureValue: { fontSize: 14, fontWeight: "600", color: colors.primary },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  pushBtn: { flex: 1, backgroundColor: colors.primary, padding: 12, borderRadius: 10, alignItems: "center" },
  pushBtnText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  scheduleBtn: { flex: 1, backgroundColor: colors.secondary, padding: 12, borderRadius: 10, alignItems: "center" },
  scheduleBtnText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  card: { backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  produit: { fontSize: 15, fontWeight: "700", color: colors.text },
  tendance: { fontSize: 16 },
  region: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  priceRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 10 },
  priceCol: { flex: 1, alignItems: "center" },
  priceLabel: { fontSize: 10, color: colors.textTertiary, textTransform: "uppercase" },
  priceValue: { fontSize: 18, fontWeight: "700", color: colors.success },
  priceUnit: { fontSize: 10, color: colors.textTertiary },
  spread: { fontSize: 14, fontWeight: "700", color: colors.accent, paddingHorizontal: 8 },
  volume: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
  smsPreview: { backgroundColor: colors.surfaceAlt, padding: 14, margin: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  smsTitle: { fontSize: 12, fontWeight: "700", color: colors.textTertiary, marginBottom: 6, textTransform: "uppercase" },
  smsText: { fontSize: 12, color: colors.text, fontFamily: "monospace", lineHeight: 18 },
});
