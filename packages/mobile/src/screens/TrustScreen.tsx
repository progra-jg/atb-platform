import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorView from "../components/ErrorView";
import { computeReputationFromOrders, MOCK_CONNECTIONS, getBadgeIcon, getBadgeColor, getScoreLabel, getScoreColor, BadgeInfo, TrustConnection, ReputationSummary } from "../services/reputation";

function ScoreGauge({ score, max, label, color }: { score: number; max: number; label: string; color: string }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  const angle = (pct / 100) * 180;
  return (
    <View style={gaugeStyles.container}>
      <View style={gaugeStyles.gaugeOuter}>
        <View style={[gaugeStyles.gaugeFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[gaugeStyles.score, { color }]}>{score}</Text>
      <Text style={gaugeStyles.label}>{label}</Text>
      <Text style={gaugeStyles.qual}>{getScoreLabel(score)}</Text>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 12 },
  gaugeOuter: { width: "100%", height: 10, backgroundColor: colors.surfaceAlt, borderRadius: 5, overflow: "hidden", marginBottom: 8 },
  gaugeFill: { height: "100%", borderRadius: 5 },
  score: { fontSize: 28, fontWeight: "800" },
  label: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  qual: { fontSize: 10, color: colors.textTertiary, marginTop: 1 },
});

interface FactorBarProps {
  label: string;
  value: number;
  max: number;
  weight: number;
  color: string;
  icon: string;
}

function FactorBar({ label, value, max, weight, color, icon }: FactorBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const contribution = Math.round(pct * (weight / 100));
  return (
    <View style={factorStyles.row}>
      <Text style={factorStyles.icon}>{icon}</Text>
      <View style={factorStyles.content}>
        <View style={factorStyles.header}>
          <Text style={factorStyles.label}>{label}</Text>
          <Text style={factorStyles.val}>{value}{typeof value === "number" && value > 1 && max > 10 ? "" : "%"}</Text>
        </View>
        <View style={factorStyles.barOuter}>
          <View style={[factorStyles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
        <Text style={factorStyles.weight}>Poids: {weight}% · Contribution: +{contribution} pts</Text>
      </View>
    </View>
  );
}

const factorStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginBottom: 6 },
  icon: { fontSize: 24, marginRight: 10 },
  content: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text },
  val: { fontSize: 13, fontWeight: "700", color: colors.primary },
  barOuter: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, overflow: "hidden", marginBottom: 3 },
  barFill: { height: "100%", borderRadius: 3 },
  weight: { fontSize: 10, color: colors.textTertiary },
});

function BadgeCard({ badge, progression, suivant }: { badge: BadgeInfo; progression: number; suivant: BadgeInfo | null }) {
  return (
    <View style={styles.badgeCard}>
      <Text style={styles.badgeIcon}>{badge.icone}</Text>
      <View style={styles.badgeInfo}>
        <Text style={styles.badgeTitle}>{badge.niveau.toUpperCase()}</Text>
        <Text style={styles.badgeDesc}>Seuil: {badge.seuilVentes} ventes, {badge.seuilConformite}% conformité</Text>
        {suivant && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progression}%`, backgroundColor: getBadgeColor(suivant.niveau) }]} />
            <Text style={styles.progressText}>{progression}% vers {suivant.icone} {suivant.niveau}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ConnectionCard({ conn }: { conn: TrustConnection }) {
  return (
    <View style={styles.connCard}>
      <Text style={styles.connIcon}>{getBadgeIcon(conn.badge)}</Text>
      <View style={styles.connInfo}>
        <Text style={styles.connName}>{conn.nom}</Text>
        <Text style={styles.connRole}>{conn.role} • {conn.transactionsReussies} transactions</Text>
        <Text style={styles.connSince}>Connexion depuis {conn.connexionDepuis}</Text>
      </View>
      <View style={styles.connScore}>
        <Text style={[styles.connScoreValue, { color: getScoreColor(conn.trustScore) }]}>{conn.trustScore}</Text>
        <Text style={styles.connScoreLabel}>confiance</Text>
      </View>
    </View>
  );
}

export default function TrustScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rep, setRep] = useState<ReputationSummary | null>(null);
  const [connections] = useState<TrustConnection[]>(MOCK_CONNECTIONS);
  const [sortedBy, setSortedBy] = useState<"score" | "recent">("score");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const data = await computeReputationFromOrders(user?.id || "", user?.role, user?.kycLevel);
      setRep(data);
    } catch {
      setError(t("common.error"));
    }
    setLoading(false); setRefreshing(false);
  }, [t, user]);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorView message={error} onRetry={() => load()} />;

  const sorted = sortedBy === "score"
    ? [...connections].sort((a, b) => b.trustScore - a.trustScore)
    : [...connections].sort((a, b) => b.connexionDepuis.localeCompare(a.connexionDepuis));

  if (loading || !rep) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.userId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <BadgeCard badge={rep.badge!} progression={rep.progressionSuivante} suivant={rep.niveauSuivant} />

            <View style={styles.scoresRow}>
              <ScoreGauge score={rep.creditScore} max={1000} label="Score crédit" color={getScoreColor(rep.creditScore)} />
              <ScoreGauge score={rep.trustScore} max={100} label="Score confiance" color={getScoreColor(rep.trustScore * 10)} />
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.stat}><Text style={styles.statValue}>{rep.transactionsReussies}</Text><Text style={styles.statLabel}>Transactions</Text></View>
              <View style={styles.stat}><Text style={styles.statValue}>{rep.tauxConformite}%</Text><Text style={styles.statLabel}>Conformité</Text></View>
              <View style={styles.stat}><Text style={styles.statValue}>{(rep.volumeTotal / 1000000).toFixed(1)}M</Text><Text style={styles.statLabel}>Volume (FCFA)</Text></View>
              <View style={styles.stat}><Text style={styles.statValue}>{rep.joursActif}</Text><Text style={styles.statLabel}>Jours actif</Text></View>
            </View>

            <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowBreakdown(!showBreakdown)}>
              <Text style={styles.toggleBtnText}>{showBreakdown ? "▲" : "▼"} Détail du calcul du score</Text>
            </TouchableOpacity>

            {showBreakdown && (
              <View style={styles.breakdownSection}>
                <FactorBar icon="🪪" label="Niveau KYC" value={user?.kycLevel || 0} max={3} weight={30} color={colors.primary} />
                <FactorBar icon="📋" label="Transactions réussies" value={rep.transactionsReussies} max={50} weight={25} color={colors.success} />
                <FactorBar icon="✅" label="Taux de conformité" value={rep.tauxConformite} max={100} weight={20} color={colors.accent} />
                <FactorBar icon="💰" label="Volume total (M FCFA)" value={Math.round(rep.volumeTotal / 1000000)} max={20} weight={15} color={colors.secondary} />
                <FactorBar icon="⚠️" label="Litiges perdus" value={Math.max(0, 3 - rep.disputesPerdues)} max={3} weight={10} color={colors.warning} />
                <View style={styles.formulaBox}>
                  <Text style={styles.formulaTitle}>📐 Formule de calcul</Text>
                  <Text style={styles.formulaText}>Score = 300 (base) + KYC×100 + Tx×4 + Conformité×3 + Volume/100k - Litiges×50</Text>
                </View>
              </View>
            )}

            <View style={styles.networkHeader}>
              <Text style={styles.networkTitle}>🕸️ Maillage de confiance ({rep.connexions})</Text>
              <View style={styles.sortRow}>
                <TouchableOpacity style={[styles.sortBtn, sortedBy === "score" && styles.sortBtnActive]} onPress={() => setSortedBy("score")}>
                  <Text style={[styles.sortText, sortedBy === "score" && styles.sortTextActive]}>Score</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sortBtn, sortedBy === "recent" && styles.sortBtnActive]} onPress={() => setSortedBy("recent")}>
                  <Text style={[styles.sortText, sortedBy === "recent" && styles.sortTextActive]}>Récent</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => <ConnectionCard conn={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  badgeCard: { flexDirection: "row", backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, alignItems: "center", gap: 14 },
  badgeIcon: { fontSize: 40 },
  badgeInfo: { flex: 1 },
  badgeTitle: { fontSize: 16, fontWeight: "800", color: colors.text, letterSpacing: 1 },
  badgeDesc: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  progressBar: { height: 18, backgroundColor: colors.surfaceAlt, borderRadius: 9, marginTop: 8, overflow: "hidden", position: "relative" },
  progressFill: { height: "100%", borderRadius: 9 },
  progressText: { position: "absolute", top: 0, bottom: 0, left: 8, right: 0, textAlignVertical: "center", fontSize: 10, fontWeight: "600", color: colors.white, lineHeight: 18 },
  scoresRow: { flexDirection: "row", gap: 10, marginBottom: 12, backgroundColor: colors.surface, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  stat: { flex: 1, minWidth: "45%", backgroundColor: colors.surface, padding: 12, borderRadius: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  toggleBtn: { padding: 12, alignItems: "center", marginBottom: 8 },
  toggleBtnText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  breakdownSection: { marginBottom: 16 },
  formulaBox: { backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 12, marginTop: 6 },
  formulaTitle: { fontSize: 12, fontWeight: "700", color: colors.text, marginBottom: 4 },
  formulaText: { fontSize: 10, color: colors.textSecondary, fontFamily: "monospace", lineHeight: 15 },
  networkHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 4 },
  networkTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  sortRow: { flexDirection: "row", gap: 4 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surfaceAlt },
  sortBtnActive: { backgroundColor: colors.primary },
  sortText: { fontSize: 11, color: colors.textSecondary, fontWeight: "500" },
  sortTextActive: { color: colors.white, fontWeight: "700" },
  connCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 12, borderRadius: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, gap: 10 },
  connIcon: { fontSize: 28 },
  connInfo: { flex: 1 },
  connName: { fontSize: 14, fontWeight: "700", color: colors.text },
  connRole: { fontSize: 11, color: colors.textSecondary },
  connSince: { fontSize: 10, color: colors.textTertiary, marginTop: 1 },
  connScore: { alignItems: "center" },
  connScoreValue: { fontSize: 20, fontWeight: "800" },
  connScoreLabel: { fontSize: 9, color: colors.textTertiary, textTransform: "uppercase" },
});
