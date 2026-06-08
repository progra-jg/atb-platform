import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { colors, spacing, radii, shadows, typography, useTheme, getStatusColorForTheme } from "../theme";
import { useAuthStore } from "../store/authStore";
import { useNetworkStatus } from "../utils/network";
import { getOfflineLots, OfflineLot } from "../services/offlineLots";
import { getOrders, Order, getOrderStatusIcon } from "../services/orders";
import { getBadgeIcon, computeReputationFromOrders } from "../services/reputation";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { SkeletonList } from "../components/Skeleton";

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const nav = useNavigation<any>();
  const isOnline = useNetworkStatus();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lots, setLots] = useState<OfflineLot[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rep, setRep] = useState<{ badge: string; creditScore: number } | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const cachedLots = await getOfflineLots();
    const userLots = cachedLots.filter(l => l.producteurId === user?.id);
    setLots(userLots);
    const userOrders = await getOrders(user?.role, user?.id);
    setOrders(userOrders);
    const reputation = await computeReputationFromOrders(user?.id || "", user?.role, user?.kycLevel);
    setRep({ badge: reputation.badge?.niveau || "", creditScore: reputation.creditScore });
    setLoading(false); setRefreshing(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const lotsActifs = lots.filter(l => l.statut === "disponible").length;
  const lotsVendus = lots.filter(l => l.statut === "vendu").length;
  const unsynced = lots.filter(l => l.createdOffline && !l.synced).length;
  const ordresActifs = orders.filter(o => o.statut !== "livree" && o.statut !== "remboursee").length;
  const ordresLivrees = orders.filter(o => o.statut === "livree").length;
  const revenuTotal = orders.filter(o => o.statut === "livree" || o.statut === "en_livraison").reduce((s, o) => s + o.montantTotal, 0);
  const contested = orders.filter(o => o.statut === "conteste").length;
  const latestOrders = [...orders].sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()).slice(0, 3);

  const monthlyProd = useMemo(() => {
    const map = new Map<string, number>();
    lots.filter(l => l.statut === "vendu").forEach(l => {
      const m = new Date(l.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      map.set(m, (map.get(m) || 0) + (l.quantite || 0));
    });
    return Array.from(map.entries()).slice(-6);
  }, [lots]);

  const maxProd = monthlyProd.length ? Math.max(...monthlyProd.map(([, v]) => v)) : 1;

  const topProduits = useMemo(() => {
    const map = new Map<string, number>();
    lots.forEach(l => map.set(l.culture, (map.get(l.culture) || 0) + (l.quantite || 0)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [lots]);

  const completionRate = orders.length ? (ordresLivrees / orders.length * 100) : 0;
  const screenW = Dimensions.get("window").width;

  if (loading) return <SkeletonList count={4} />;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}>
      <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
        <View style={styles.greeting}>
          <Text style={styles.greetingIcon}>{getBadgeIcon((rep?.badge || user?.badge || "") as any)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingName}>{user?.company || user?.email || "Producteur"}</Text>
            <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: 4 }}>
              <Badge label={t(`role.${user?.role || "producteur"}`)} color={colors.primary} />
              <Badge label={`KYC ${user?.kycLevel || 0}`} color={colors.secondary} />
              <Badge label={`Score: ${rep?.creditScore || "—"}`} color={colors.accent} />
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard} padding="md">
          <Text style={[typography.h2, { color: colors.primary }]}>{lotsActifs}</Text>
          <Text style={styles.statLabel}>Lots actifs</Text>
        </Card>
        <Card style={styles.statCard} padding="md">
          <Text style={[typography.h2, { color: colors.secondary }]}>{ordresActifs}</Text>
          <Text style={styles.statLabel}>Commandes en cours</Text>
        </Card>
        <Card style={styles.statCard} padding="md">
          <Text style={[typography.h2, { color: colors.success }]}>{lotsVendus}</Text>
          <Text style={styles.statLabel}>Lots vendus</Text>
        </Card>
        <Card style={styles.statCard} padding="md">
          <Text style={[typography.h2, { color: colors.accent }]}>{revenuTotal.toLocaleString()} F</Text>
          <Text style={styles.statLabel}>Revenu total</Text>
        </Card>
      </View>

      <View style={[styles.netBanner, { backgroundColor: isOnline ? colors.success + "12" : colors.warning + "12" }]}>
        <Text style={[typography.captionBold, { color: isOnline ? colors.success : colors.warning }]}>
          {isOnline ? "🟢 En ligne" : `🟡 Hors-ligne${unsynced > 0 ? ` — ${unsynced} élément(s) à synchroniser` : ""}`}
        </Text>
      </View>

      {contested > 0 && (
        <Card style={{ marginHorizontal: spacing.lg, backgroundColor: colors.errorLight, marginBottom: spacing.xs }} padding="md">
          <Text style={[typography.captionBold, { color: colors.error }]}>⚠️ {contested} commande(s) contestée(s) — action requise</Text>
        </Card>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickGrid}>
          <QuickAction icon="🌾" label="Ajouter lot" onPress={() => (nav as any).navigate("Lots")} />
          <QuickAction icon="📷" label="Scanner QR" onPress={() => (nav as any).navigate("Scan")} />
          <QuickAction icon="📨" label="Messages" onPress={() => (nav as any).navigate("Inbox")} />
          <QuickAction icon="📜" label="Certificats" onPress={() => (nav as any).navigate("Certificates")} />
          <QuickAction icon="💬" label="Négocier" onPress={() => {}} />
          <QuickAction icon="✅" label="Paiements" onPress={() => {}} />
          <QuickAction icon="🌤️" label="Météo" onPress={() => {}} />
          <QuickAction icon="👥" label="Parrainage" onPress={() => {}} />
        </View>
      </View>

      {monthlyProd.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Production mensuelle</Text>
          <Card padding="lg">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.chartRow, { minWidth: Math.max(screenW - 64, monthlyProd.length * 60) }]}>
                {monthlyProd.map(([mois, qte]) => (
                  <View key={mois} style={styles.barCol}>
                    <Text style={styles.barVal}>{qte}</Text>
                    <View style={[styles.bar, { height: Math.max(4, (qte / maxProd) * 100) }]} />
                    <Text style={styles.barLabel}>{mois}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </Card>
        </View>
      )}

      {topProduits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top produits</Text>
          <Card padding="lg">
            {topProduits.map(([prod, qte], i) => (
              <View key={prod} style={styles.topProdRow}>
                <Text style={styles.topProdRank}>{i + 1}</Text>
                <Text style={styles.topProdName}>{prod}</Text>
                <View style={styles.topProdBarBg}>
                  <View style={[styles.topProdBar, { width: `${(qte / topProduits[0][1]) * 100}%` }]} />
                </View>
                <Text style={styles.topProdQte}>{qte}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Performance</Text>
        <View style={styles.perfGrid}>
          <Card style={styles.perfCard} padding="md">
            <Text style={[typography.h3, { color: colors.primary }]}>{completionRate.toFixed(0)}%</Text>
            <Text style={styles.perfLabel}>Taux complétion</Text>
          </Card>
          <Card style={styles.perfCard} padding="md">
            <Text style={[typography.h3, { color: colors.success }]}>{ordresLivrees}</Text>
            <Text style={styles.perfLabel}>Livraisons</Text>
          </Card>
          <Card style={styles.perfCard} padding="md">
            <Text style={[typography.h3, { color: colors.secondary }]}>{lots.length}</Text>
            <Text style={styles.perfLabel}>Lots créés</Text>
          </Card>
          <Card style={styles.perfCard} padding="md">
            <Text style={[typography.h3, { color: colors.accent }]}>{orders.length}</Text>
            <Text style={styles.perfLabel}>Commandes</Text>
          </Card>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dernières commandes</Text>
        {latestOrders.length === 0 ? (
          <Text style={styles.emptyText}>Aucune commande récente</Text>
        ) : (
          latestOrders.map(o => (
            <Card key={o.id} onPress={() => {}} padding="lg" style={{ marginBottom: spacing.sm }}>
              <View style={styles.orderHeader}>
                <Text style={[typography.captionBold]}>{o.id}</Text>
                <Text style={typography.small}>{new Date(o.dateCreation).toLocaleDateString("fr-FR")}</Text>
              </View>
              <Text style={styles.orderProduit}>{o.produit} — {o.quantite}{o.unite}</Text>
              <View style={styles.orderFooter}>
                <Text style={[typography.priceSmall]}>{o.montantTotal.toLocaleString()} FCFA</Text>
                <Badge
                  label={`${getOrderStatusIcon(o.statut)} ${o.statut.replace("_", " ")}`}
                  color={getStatusColorForTheme(o.statut, isDark)}
                />
              </View>
              <Text style={[typography.caption, { marginTop: 4 }]}>{o.acheteurNom}</Text>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  netBanner: { padding: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.xs, borderRadius: radii.sm, alignItems: "center" },
  greeting: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  greetingIcon: { fontSize: 36 },
  greetingName: { fontSize: 18, fontWeight: "800", color: colors.text },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  statCard: { flex: 1, minWidth: "45%" },
  statLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  quickAction: { flex: 1, minWidth: "30%", backgroundColor: colors.surface, padding: spacing.md, borderRadius: radii.lg, alignItems: "center", ...shadows.md },
  quickIcon: { fontSize: 24, marginBottom: spacing.xs },
  quickLabel: { fontSize: 11, color: colors.text, fontWeight: "500" },
  emptyText: { fontSize: 13, color: colors.textTertiary, textAlign: "center", paddingVertical: 20 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  orderProduit: { fontSize: 14, color: colors.text, marginBottom: spacing.sm },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  barCol: { alignItems: "center", flex: 1 },
  barVal: { fontSize: 10, color: colors.textSecondary, marginBottom: 2 },
  bar: { width: 24, backgroundColor: colors.primary, borderRadius: radii.sm, minHeight: 4 },
  barLabel: { fontSize: 9, color: colors.textTertiary, marginTop: 4, textTransform: "capitalize" },
  topProdRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  topProdRank: { fontSize: 12, fontWeight: "700", color: colors.textTertiary, width: 18 },
  topProdName: { fontSize: 13, color: colors.text, width: 90 },
  topProdBarBg: { flex: 1, height: 8, backgroundColor: colors.border + "40", borderRadius: radii.sm, overflow: "hidden" },
  topProdBar: { height: "100%", backgroundColor: colors.secondary || colors.primary, borderRadius: radii.sm },
  topProdQte: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, width: 40, textAlign: "right" },
  perfGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  perfCard: { flex: 1, minWidth: "45%", alignItems: "center" },
  perfLabel: { fontSize: 10, color: colors.textTertiary, marginTop: 2, textAlign: "center" },
});
