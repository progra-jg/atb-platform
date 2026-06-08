import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, Alert, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";
import { useNetworkStatus } from "../utils/network";
import { enqueueAction } from "../storage/offline";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { useVoiceRecording } from "../hooks/useVoiceRecording";

interface PendingTask {
  id: string;
  type: "kyc" | "confirmation" | "qr" | "collecte";
  producteur: string;
  produit?: string;
  montant?: number;
  urgence: "haute" | "moyenne" | "basse";
  createdAt: string;
}

interface FarmerRecord {
  id: string;
  nom: string;
  phone: string;
  village: string;
  kycLevel: number;
  dateInscription: string;
}

const MOCK_TASKS: PendingTask[] = [
  { id: "t1", type: "kyc", producteur: "Koffi Agbéko", urgence: "haute", createdAt: "2026-06-08" },
  { id: "t2", type: "confirmation", producteur: "Mariam Diallo", produit: "Maïs blanc", montant: 180000, urgence: "haute", createdAt: "2026-06-08" },
  { id: "t3", type: "qr", producteur: "Benoît Adéoti", urgence: "moyenne", createdAt: "2026-06-07" },
  { id: "t4", type: "collecte", producteur: "Sébastien Kpogomé", produit: "Soja", montant: 50000, urgence: "basse", createdAt: "2026-06-06" },
];

const MOCK_FARMERS: FarmerRecord[] = [
  { id: "f1", nom: "Koffi Agbéko", phone: "+229 61 23 45 67", village: "Donga", kycLevel: 2, dateInscription: "2026-06-01" },
  { id: "f2", nom: "Mariam Diallo", phone: "+229 97 12 34 56", village: "Couffo", kycLevel: 1, dateInscription: "2026-06-03" },
  { id: "f3", nom: "Benoît Adéoti", phone: "+229 94 56 78 90", village: "Donga", kycLevel: 0, dateInscription: "2026-06-05" },
  { id: "f4", nom: "Sébastien Kpogomé", phone: "+229 61 98 76 54", village: "Alibori", kycLevel: 3, dateInscription: "2026-05-28" },
  { id: "f5", nom: "Adeline Yévi", phone: "+229 97 65 43 21", village: "Couffo", kycLevel: 1, dateInscription: "2026-06-07" },
  { id: "f6", nom: "Gaston Houéto", phone: "+229 61 11 22 33", village: "Donga", kycLevel: 0, dateInscription: "2026-06-08" },
];

const WEEKLY_ACTIVITY = [
  { day: "Lun", value: 4 }, { day: "Mar", value: 7 }, { day: "Mer", value: 2 },
  { day: "Jeu", value: 5 }, { day: "Ven", value: 8 }, { day: "Sam", value: 3 }, { day: "Dim", value: 1 },
];

function BarChart({ data, color, height = 120 }: { data: { day: string; value: number }[]; color: string; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={chartStyles.container}>
      {data.map((d, i) => (
        <View key={i} style={chartStyles.col}>
          <View style={[chartStyles.bar, { height: (d.value / max) * height, backgroundColor: color, opacity: 0.7 + (d.value / max) * 0.3 }]} />
          <Text style={chartStyles.label}>{d.day}</Text>
          <Text style={chartStyles.value}>{d.value}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: 160, paddingTop: 8 },
  col: { alignItems: "center", flex: 1 },
  bar: { width: "60%", borderRadius: 6, minHeight: 4 },
  label: { fontSize: 10, color: colors.textTertiary, marginTop: 4 },
  value: { fontSize: 10, color: colors.textSecondary, fontWeight: "600" },
});

export default function AgentDashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const nav = useNavigation<any>();
  const isOnline = useNetworkStatus();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [farmers, setFarmers] = useState<FarmerRecord[]>([]);
  const [voiceModal, setVoiceModal] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<PendingTask | null>(null);
  const [onglet, setOnglet] = useState<"tasks" | "analytics">("tasks");
  const voice = useVoiceRecording();

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data } = await import("../services/api").then(m => m.default.get("/agent/tasks"));
      setTasks(data);
    } catch { setTasks(MOCK_TASKS); }
    try {
      const { data } = await import("../services/api").then(m => m.default.get("/agent/farmers"));
      setFarmers(data);
    } catch { setFarmers(MOCK_FARMERS); }
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = {
    inscriptions: tasks.filter(t => t.type === "kyc").length,
    confirmations: tasks.filter(t => t.type === "confirmation").length,
    today: tasks.filter(t => t.createdAt === new Date().toISOString().slice(0, 10)).length,
  };

  const analytics = {
    totalFarmers: farmers.length,
    kyc3: farmers.filter(f => f.kycLevel >= 2).length,
    kyc0: farmers.filter(f => f.kycLevel === 0).length,
    villages: [...new Set(farmers.map(f => f.village))].length,
    avgKyc: farmers.length ? (farmers.reduce((s, f) => s + f.kycLevel, 0) / farmers.length).toFixed(1) : "0",
  };

  const byVillage = farmers.reduce((acc, f) => {
    if (!acc[f.village]) acc[f.village] = [];
    acc[f.village].push(f);
    return acc;
  }, {} as Record<string, FarmerRecord[]>);

  const handleKyc = (task: PendingTask) => {
    Alert.alert("Inscription producteur", `Lancer le KYC pour ${task.producteur} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Oui", onPress: () => nav.navigate("Kyc", { mode: "agent", producteurNom: task.producteur }) },
    ]);
  };

  const handleVoiceConfirm = (task: PendingTask) => {
    setConfirmTarget(task);
    setVoiceModal(true);
  };

  const toggleRecord = async () => {
    if (voice.recording) {
      const result = await voice.stopRecording();
      if (result) {
        Alert.alert("✅ Confirmation vocale", `Transaction confirmée pour ${confirmTarget?.producteur}\n${(result.durationMs / 1000).toFixed(1)}s`);
        setVoiceModal(false);
        setConfirmTarget(null);
        setTasks(prev => prev.filter(t => t.id !== confirmTarget?.id));
        if (!isOnline) enqueueAction("agent/voice-confirm", { taskId: confirmTarget?.id, uri: result.uri, durationMs: result.durationMs, timestamp: result.timestamp });
      }
    } else {
      const status = await voice.startRecording();
      if (status === "permission_denied") Alert.alert("Permission", "Autorisez l'accès au microphone dans Paramètres");
    }
  };

  const handleQr = (task: PendingTask) => {
    Alert.alert("QR Code", `Générer un QR de traçabilité pour ${task.producteur} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Générer", onPress: () => {
        Alert.alert("✅ QR généré", `ATR-${Date.now()}\nTransmis à ${task.producteur}`);
        setTasks(prev => prev.filter(t => t.id !== task.id));
      }},
    ]);
  };

  const typeConfig: Record<string, { icon: string; label: string; color: string; action: (t: PendingTask) => void }> = {
    kyc: { icon: "🆔", label: "KYC producteur", color: colors.primary, action: handleKyc },
    confirmation: { icon: "🎤", label: "Confirmation vocale", color: colors.success, action: handleVoiceConfirm },
    qr: { icon: "📱", label: "Générer QR", color: colors.accent, action: handleQr },
    collecte: { icon: "💰", label: "Collecte paiement", color: colors.secondary, action: (t) => Alert.alert("Collecte", `Encaisser ${t.montant?.toLocaleString()} FCFA auprès de ${t.producteur}`) },
  };

  const urgenceColor = (u: string) => u === "haute" ? colors.error : u === "moyenne" ? colors.warning : colors.textTertiary;

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}>
      <View style={[styles.netBanner, { backgroundColor: isOnline ? colors.success + "15" : colors.warning + "15" }]}>
        <Text style={[styles.netText, { color: isOnline ? colors.success : colors.warning }]}>
          {isOnline ? "🟢 En ligne" : "🟡 Mode terrain (hors-ligne)"}
        </Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>🌾 Agent de terrain</Text>
        <Text style={styles.sub}>{user?.company || "Agent"} · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</Text>
      </View>

      <View style={styles.tabRow}>
        {(["tasks", "analytics"] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, onglet === tab && styles.tabActive]} onPress={() => setOnglet(tab)}>
            <Text style={[styles.tabText, onglet === tab && styles.tabTextActive]}>{tab === "tasks" ? "📋 Tâches" : "📊 Analytics"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {onglet === "tasks" ? (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.today}</Text><Text style={styles.statLabel}>Aujourd'hui</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.inscriptions}</Text><Text style={styles.statLabel}>KYC en attente</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.confirmations}</Text><Text style={styles.statLabel}>Confirmations</Text></View>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => nav.navigate("Kyc", { mode: "agent" })}>
              <Text style={styles.quickIcon}>🆕</Text><Text style={styles.quickLabel}>Nouveau producteur</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => setVoiceModal(true)}>
              <Text style={styles.quickIcon}>🎤</Text><Text style={styles.quickLabel}>Confirmer transaction</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => nav.navigate("Scan")}>
              <Text style={styles.quickIcon}>📷</Text><Text style={styles.quickLabel}>Scanner QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => nav.navigate("CommerceAct")}>
              <Text style={styles.quickIcon}>⚖️</Text><Text style={styles.quickLabel}>Commerce Act</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>📋 Tâches du jour</Text>
          {tasks.length === 0 ? <EmptyState title="Aucune tâche en attente" /> : tasks.map((task) => {
            const cfg = typeConfig[task.type] || { icon: "📄", label: task.type, color: colors.text, action: () => {} };
            return (
              <TouchableOpacity key={task.id} style={styles.taskCard} onPress={() => cfg.action(task)}>
                <View style={[styles.taskIcon, { backgroundColor: cfg.color + "15" }]}><Text style={styles.taskIconText}>{cfg.icon}</Text></View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskType}>{cfg.label}</Text>
                  <Text style={styles.taskProducteur}>{task.producteur}</Text>
                  {task.produit && <Text style={styles.taskMeta}>{task.produit}{task.montant ? ` · ${task.montant.toLocaleString()} FCFA` : ""}</Text>}
                </View>
                <View style={[styles.urgenceDot, { backgroundColor: urgenceColor(task.urgence) }]} />
              </TouchableOpacity>
            );
          })}
        </>
      ) : (
        <>
          <View style={styles.analyticsHeader}>
            <Text style={styles.sectionLabel}>📊 Performance agent</Text>
            <Text style={styles.analyticsSub}>Mise à jour en temps réel</Text>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}><Text style={styles.kpiValue}>{analytics.totalFarmers}</Text><Text style={styles.kpiLabel}>Producteurs inscrits</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiValue}>{analytics.kyc3}</Text><Text style={styles.kpiLabel}>KYC niveau 2+</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiValue}>{analytics.kyc0}</Text><Text style={styles.kpiLabel}>KYC à faire</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiValue}>{analytics.villages}</Text><Text style={styles.kpiLabel}>Villages couverts</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiValue}>{analytics.avgKyc}</Text><Text style={styles.kpiLabel}>KYC moyen</Text></View>
            <View style={styles.kpiCard}><Text style={styles.kpiValue}>{farmers.filter(f => f.kycLevel >= 2).length}/{analytics.totalFarmers}</Text><Text style={styles.kpiLabel}>Taux complétion</Text></View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Activité hebdomadaire</Text>
            <BarChart data={WEEKLY_ACTIVITY} color={colors.primary} />
          </View>

          <Text style={styles.sectionLabel}>🌍 Producteurs par village</Text>
          {Object.entries(byVillage).map(([village, liste]) => (
            <View key={village} style={styles.villageCard}>
              <View style={styles.villageHeader}>
                <Text style={styles.villageName}>📍 {village}</Text>
                <Text style={styles.villageCount}>{liste.length} producteur(s)</Text>
              </View>
              {liste.map(f => (
                <TouchableOpacity key={f.id} style={styles.farmerRow}>
                  <View style={[styles.kycDot, { backgroundColor: f.kycLevel >= 2 ? colors.success : f.kycLevel === 0 ? colors.warning : colors.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.farmerName}>{f.nom}</Text>
                    <Text style={styles.farmerPhone}>{f.phone} · KYC {f.kycLevel}/3</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </>
      )}

      <VoiceModal visible={voiceModal} recording={voice.recording} onToggleRecord={toggleRecord} onClose={() => { setVoiceModal(false); voice.stopPlayback(); voice.stopRecording(); setConfirmTarget(null); }} target={confirmTarget} lastRecording={voice.lastRecording} onPlay={() => voice.lastRecording && voice.playRecording(voice.lastRecording.uri)} playing={voice.playing} />
    </ScrollView>
  );
}

function VoiceModal({ visible, recording, onToggleRecord, onClose, target, lastRecording, onPlay, playing }: {
  visible: boolean; recording: boolean; onToggleRecord: () => void; onClose: () => void; target: PendingTask | null;
  lastRecording: { uri: string; durationMs: number } | null; onPlay: () => void; playing: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={voiceStyles.overlay}>
        <View style={voiceStyles.modal}>
          <Text style={voiceStyles.title}>🎤 Confirmation vocale</Text>
          {target && <Text style={voiceStyles.target}>Transaction : {target.producteur}{target.produit ? ` — ${target.produit}` : ""}</Text>}
          {lastRecording && !recording ? (
            <TouchableOpacity style={voiceStyles.playBtn} onPress={onPlay}>
              <Text style={voiceStyles.playText}>{playing ? "⏹ Arrêter" : "▶ Écouter"} ({Math.round(lastRecording.durationMs / 1000)}s)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[voiceStyles.recordBtn, recording && { backgroundColor: colors.error }]} onPress={onToggleRecord}>
              <Text style={voiceStyles.recordText}>{recording ? "⬛ Arrêter" : "🎤 Enregistrer"}</Text>
            </TouchableOpacity>
          )}
          {recording && <Text style={voiceStyles.hint}>Parlez pour confirmer la transaction...</Text>}
          {lastRecording && !recording && (
            <TouchableOpacity style={voiceStyles.confirmBtn} onPress={() => { Alert.alert("✅ Confirmé", `Transaction ${target?.producteur} confirmée par message vocal`); onClose(); }}>
              <Text style={voiceStyles.confirmText}>✅ Confirmer la transaction</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={voiceStyles.cancelBtn} onPress={onClose}><Text style={voiceStyles.cancelText}>Annuler</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  netBanner: { paddingVertical: 6, paddingHorizontal: 16 },
  netText: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  sub: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.primary + "15" },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: colors.primary },
  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.primary },
  statLabel: { fontSize: 9, color: colors.textTertiary, marginTop: 2, textAlign: "center" },
  quickRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 16, flexWrap: "wrap" },
  quickBtn: { width: "48%", backgroundColor: colors.surface, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  quickIcon: { fontSize: 24, marginBottom: 4 },
  quickLabel: { fontSize: 11, fontWeight: "600", color: colors.text, textAlign: "center" },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: colors.text, paddingHorizontal: 16, marginBottom: 8 },
  taskCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 6, padding: 12, borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  taskIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 10 },
  taskIconText: { fontSize: 20 },
  taskContent: { flex: 1 },
  taskType: { fontSize: 12, fontWeight: "700", color: colors.text },
  taskProducteur: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: 1 },
  taskMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  urgenceDot: { width: 8, height: 8, borderRadius: 4 },
  analyticsHeader: { paddingHorizontal: 16, marginBottom: 4 },
  analyticsSub: { fontSize: 11, color: colors.textTertiary, marginTop: -4, marginBottom: 8, paddingHorizontal: 16 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  kpiCard: { width: "30.5%", backgroundColor: colors.surface, borderRadius: 12, padding: 10, alignItems: "center" },
  kpiValue: { fontSize: 18, fontWeight: "800", color: colors.primary },
  kpiLabel: { fontSize: 9, color: colors.textTertiary, marginTop: 2, textAlign: "center" },
  chartCard: { backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16 },
  chartTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 4 },
  villageCard: { backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14 },
  villageHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  villageName: { fontSize: 14, fontWeight: "700", color: colors.text },
  villageCount: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  farmerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  kycDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  farmerName: { fontSize: 13, fontWeight: "600", color: colors.text },
  farmerPhone: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
});

const voiceStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 },
  target: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
  recordBtn: { backgroundColor: colors.primary, width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  recordText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  playBtn: { backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginBottom: 12 },
  playText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  confirmBtn: { backgroundColor: colors.success, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginBottom: 8 },
  confirmText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  hint: { fontSize: 12, color: colors.warning, fontStyle: "italic", marginBottom: 12 },
  cancelBtn: { padding: 12 },
  cancelText: { color: colors.textSecondary, fontSize: 14 },
});
