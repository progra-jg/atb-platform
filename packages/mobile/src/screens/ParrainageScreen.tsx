import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Linking, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import EmptyState from "../components/EmptyState";
import { useAuthStore } from "../store/authStore";
import { enqueueAction } from "../storage/offline";
import { useNetworkStatus } from "../utils/network";

interface Invitation {
  id: string;
  telephone: string;
  nom?: string;
  canal: "sms" | "whatsapp";
  statut: "envoyée" | "inscrit" | "expirée";
  date: string;
}

const MOCK_INVITES: Invitation[] = [
  { id: "inv-001", telephone: "+229 97 11 22 33", nom: "Komi Dossa", canal: "sms", statut: "inscrit", date: "2026-06-01" },
  { id: "inv-002", telephone: "+229 61 11 22 33", nom: "Awa Traoré", canal: "whatsapp", statut: "inscrit", date: "2026-05-28" },
  { id: "inv-003", telephone: "+229 54 11 22 33", canal: "sms", statut: "envoyée", date: "2026-06-07" },
  { id: "inv-004", telephone: "+229 97 44 55 66", canal: "whatsapp", statut: "envoyée", date: "2026-06-08" },
];

export default function ParrainageScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isOnline = useNetworkStatus();
  const [telephone, setTelephone] = useState("");
  const [nom, setNom] = useState("");
  const [canal, setCanal] = useState<"sms" | "whatsapp">("whatsapp");
  const [invitations, setInvitations] = useState<Invitation[]>(MOCK_INVITES);

  const lienInvite = `https://agritrace.bj/rejoindre?ref=${user?.id?.slice(0, 8) || "AGRI"}`;
  const messageInvite = `🌾 Rejoins AgriTrace ! Achète/vends directement aux producteurs, paiement Mobile Money, traçabilité NFC. Télécharge : ${lienInvite}`;

  const handleEnvoyer = () => {
    if (!telephone || telephone.length < 8) { Alert.alert("Numéro invalide"); return; }
    const numero = telephone.startsWith("+") ? telephone : `+229 ${telephone}`;
    const url = canal === "whatsapp"
      ? `https://wa.me/${numero.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(messageInvite)}`
      : `sms:${numero}?body=${encodeURIComponent(messageInvite)}`;

    const nouvelInvite: Invitation = {
      id: `inv-${Date.now()}`, telephone: numero, nom: nom || undefined,
      canal, statut: "envoyée", date: new Date().toISOString().slice(0, 10),
    };

    Linking.openURL(url).catch(() => Alert.alert("Erreur", "Impossible d'ouvrir l'application"));
    setInvitations([nouvelInvite, ...invitations]);
    setTelephone("");
    setNom("");
    if (!isOnline) enqueueAction("parrainage/invite", { telephone: numero, nom, canal });
  };

  const stats = {
    total: invitations.length,
    inscrits: invitations.filter(i => i.statut === "inscrit").length,
    recompenses: invitations.filter(i => i.statut === "inscrit").length * 500,
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={invitations}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>👥 Parrainage</Text>
              <Text style={styles.sub}>Invitez d'autres acteurs agricoles</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}><Text style={styles.statNumber}>{stats.total}</Text><Text style={styles.statLabel}>Invités</Text></View>
              <View style={styles.statCard}><Text style={[styles.statNumber, { color: colors.success }]}>{stats.inscrits}</Text><Text style={styles.statLabel}>Inscrits ✓</Text></View>
              <View style={styles.statCard}><Text style={[styles.statNumber, { color: colors.warning }]}>{stats.recompenses.toLocaleString()} F</Text><Text style={styles.statLabel}>Gains</Text></View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>🎁 Gagnez 500 FCFA par filleul</Text>
              <Text style={styles.infoText}>Pour chaque nouveau producteur ou acheteur qui s'inscrit via votre lien et réalise sa première transaction, vous recevez 500 FCFA sur votre compte Mobile Money.</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.formTitle}>📲 Inviter quelqu'un</Text>
              <TextInput style={styles.input} placeholder="Numéro téléphone" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" placeholderTextColor={colors.textTertiary} />
              <TextInput style={styles.input} placeholder="Nom (optionnel)" value={nom} onChangeText={setNom} placeholderTextColor={colors.textTertiary} />

              <View style={styles.canalRow}>
                <TouchableOpacity style={[styles.canalBtn, canal === "whatsapp" && styles.canalActive]} onPress={() => setCanal("whatsapp")}>
                  <Text style={[styles.canalText, canal === "whatsapp" && styles.canalTextActive]}>💬 WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.canalBtn, canal === "sms" && styles.canalActive]} onPress={() => setCanal("sms")}>
                  <Text style={[styles.canalText, canal === "sms" && styles.canalTextActive]}>✉️ SMS</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.sendBtn} onPress={handleEnvoyer}>
                <Text style={styles.sendText}>📤 Envoyer l'invitation</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.lienBox}>
              <Text style={styles.lienLabel}>Votre lien de parrainage</Text>
              <Text style={styles.lien}>{lienInvite}</Text>
              <Text style={styles.lienHint}>Partagez ce lien directement</Text>
            </View>

            <View style={{ marginTop: 16, marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>📋 Historique des invitations</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState title={t("parrainage.noInvitations")} />}
        renderItem={({ item }) => (
          <View style={styles.inviteCard}>
            <View style={styles.inviteRow}>
              <Text style={styles.inviteTel}>{item.telephone}</Text>
              <View style={[styles.inviteBadge, { backgroundColor: item.statut === "inscrit" ? colors.success + "20" : item.statut === "envoyée" ? colors.warning + "20" : colors.textTertiary + "20" }]}>
                <Text style={[styles.inviteBadgeText, { color: item.statut === "inscrit" ? colors.success : item.statut === "envoyée" ? colors.warning : colors.textTertiary }]}>
                  {item.statut === "inscrit" ? "✅ Inscrit" : item.statut === "envoyée" ? "⏳ Envoyée" : "⌛ Expirée"}
                </Text>
              </View>
            </View>
            {item.nom && <Text style={styles.inviteNom}>{item.nom}</Text>}
            <View style={styles.inviteMeta}>
              <Text style={styles.meta}>{item.canal === "whatsapp" ? "💬 WhatsApp" : "✉️ SMS"}</Text>
              <Text style={styles.meta}>{item.date}</Text>
              {item.statut === "inscrit" && <Text style={[styles.meta, { color: colors.warning, fontWeight: "700" }]}>🎁 +500 FCFA</Text>}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  infoBox: { backgroundColor: colors.primary + "12", borderRadius: 12, padding: 12, marginBottom: 16 },
  infoTitle: { fontSize: 14, fontWeight: "700", color: colors.primary },
  infoText: { fontSize: 12, color: colors.text, marginTop: 4, lineHeight: 17 },
  form: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 12 },
  formTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12, fontSize: 14, color: colors.text, marginBottom: 8 },
  canalRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  canalBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: "center" },
  canalActive: { backgroundColor: colors.primary + "25", borderWidth: 1.5, borderColor: colors.primary },
  canalText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  canalTextActive: { color: colors.primary },
  sendBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center" },
  sendText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  lienBox: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 8 },
  lienLabel: { fontSize: 11, color: colors.textTertiary, textTransform: "uppercase", marginBottom: 4 },
  lien: { fontSize: 12, color: colors.primary, fontWeight: "600" },
  lienHint: { fontSize: 10, color: colors.textTertiary, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  empty: { textAlign: "center", color: colors.textTertiary, marginTop: 20 },
  inviteCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8 },
  inviteRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  inviteTel: { fontSize: 15, fontWeight: "600", color: colors.text },
  inviteBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  inviteBadgeText: { fontSize: 10, fontWeight: "600" },
  inviteNom: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  inviteMeta: { flexDirection: "row", gap: 12, marginTop: 6 },
  meta: { fontSize: 11, color: colors.textTertiary },
});
