import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";
import { useSensorStore } from "../store/sensorStore";
import { persistLanguage } from "../i18n";
import { computeReputation, getBadgeIcon, getBadgeColor, getScoreLabel, getScoreColor } from "../services/reputation";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const nav = useNavigation<any>();
  const rep = user ? computeReputation(user.kycLevel || 0) : null;
  const sensorConsent = useSensorStore((s) => s.sensorConsent);
  const requestConsent = useSensorStore((s) => s.requestConsent);
  const revokeConsent = useSensorStore((s) => s.revokeConsent);

  const handleLogout = () => {
    Alert.alert(t("settings.logout"), t("settings.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("settings.logout"), style: "destructive", onPress: logout },
    ]);
  };

  const toggleLang = () => {
    const next = i18n.language === "fr" ? "en" : "fr";
    persistLanguage(next);
  };

  const toggleSensor = async (value: boolean) => {
    if (value) {
      const granted = await requestConsent();
      if (!granted) return;
    } else {
      Alert.alert(
        "Capteurs",
        "La détection d'angle de lecture sera désactivée. Les données ne seront plus pré-chargées automatiquement.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Désactiver", style: "destructive", onPress: revokeConsent },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {user && rep && (
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.badgeIcon}>{getBadgeIcon(rep.badge?.niveau || "")}</Text>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{user.email}</Text>
              <Text style={styles.profileCompany}>{user.company} — {user.country}</Text>
              <Text style={styles.profileRole}>{t(`role.${user.role}`)}</Text>
            </View>
          </View>
          <View style={styles.scoresInline}>
            <View style={styles.miniScore}>
              <Text style={styles.miniScoreValue}>{rep.creditScore}</Text>
              <Text style={styles.miniScoreLabel}>Crédit</Text>
            </View>
            <View style={styles.miniScore}>
              <Text style={[styles.miniScoreValue, { color: getScoreColor(rep.trustScore) }]}>{rep.trustScore}</Text>
              <Text style={styles.miniScoreLabel}>Confiance</Text>
            </View>
            <View style={styles.miniScore}>
              <Text style={styles.miniScoreValue}>{rep.transactionsReussies}</Text>
              <Text style={styles.miniScoreLabel}>Transactions</Text>
            </View>
            <View style={styles.miniScore}>
              <Text style={styles.miniScoreValue}>KYC {user.kycLevel}</Text>
              <Text style={styles.miniScoreLabel}>Niveau</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
        <TouchableOpacity style={styles.row} onPress={toggleLang}>
          <Text style={styles.rowText}>{i18n.language === "fr" ? t("settings.english") : t("settings.french")}</Text>
          <Text style={styles.rowValue}>{i18n.language === "fr" ? "FR" : "EN"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Capteurs</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowText}>Accéléromètre</Text>
            <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>
              Pré-chargement des données selon l'angle de lecture
            </Text>
          </View>
          <Switch
            value={sensorConsent}
            onValueChange={toggleSensor}
            trackColor={{ false: colors.surfaceAlt, true: colors.primary + "60" }}
            thumbColor={sensorConsent ? colors.primary : colors.textTertiary}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Design</Text>
        <TouchableOpacity style={styles.row} onPress={() => nav.navigate("ComponentCatalog")}>
          <Text style={styles.rowText}>🧩 Catalogue de composants</Text>
          <Text style={styles.rowValue}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.about")}</Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>ATB AgriTrace</Text>
          <Text style={styles.rowValue}>{t("settings.version")} 1.0.0</Text>
        </View>
      </View>

      {user && (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t("settings.logout")}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  profileCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  profileHeader: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 12 },
  badgeIcon: { fontSize: 36 },
  profileMeta: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: "700", color: colors.text },
  profileCompany: { fontSize: 12, color: colors.textSecondary },
  profileRole: { fontSize: 12, color: colors.primary, fontWeight: "600", marginTop: 2 },
  scoresInline: { flexDirection: "row", gap: 8 },
  miniScore: { flex: 1, backgroundColor: colors.surfaceAlt, padding: 8, borderRadius: 10, alignItems: "center" },
  miniScoreValue: { fontSize: 16, fontWeight: "800", color: colors.primary },
  miniScoreLabel: { fontSize: 9, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.3 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surface, padding: 16, borderRadius: 12 },
  rowText: { fontSize: 15, color: colors.text, fontWeight: "500" },
  rowValue: { fontSize: 14, color: colors.textSecondary },
  logoutBtn: { marginTop: 16, backgroundColor: colors.error, padding: 16, borderRadius: 14, alignItems: "center" },
  logoutText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});
