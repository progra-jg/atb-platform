import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Animated, StyleSheet, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import PriceText from "../components/PriceText";
import ProgressiveLayout from "../components/ProgressiveLayout";
import StaleDataWrapper from "../components/StaleDataWrapper";
import MicroAlertBanner from "../components/MicroAlertBanner";
import { useAuthStore } from "../store/authStore";
import { useFreezeAndSlide } from "../hooks/useFreezeAndSlide";
import { useVariableReward } from "../hooks/useVariableReward";

interface Corridor {
  produit: string; region: string; qualite: string;
  prixProducteur: number; prixAcheteur: number; spread: number; spreadPercent: number;
  tendance: "hausse" | "baisse" | "stable"; confiance: number; volume: number;
}

const CORRIDORS: Corridor[] = [
  { produit: "Maïs blanc", region: "Donga", qualite: "Grade A", prixProducteur: 180, prixAcheteur: 204, spread: 24, spreadPercent: 13.3, tendance: "stable", confiance: 85, volume: 15000 },
  { produit: "Cacao bio", region: "Couffo", qualite: "Certifié bio", prixProducteur: 1500, prixAcheteur: 1660, spread: 160, spreadPercent: 10.7, tendance: "hausse", confiance: 78, volume: 4500 },
  { produit: "Soja", region: "Alibori", qualite: "Non-OGM", prixProducteur: 250, prixAcheteur: 280, spread: 30, spreadPercent: 12.0, tendance: "hausse", confiance: 82, volume: 22000 },
  { produit: "Riz paddy", region: "Ouémé", qualite: "Long grain", prixProducteur: 210, prixAcheteur: 238, spread: 28, spreadPercent: 13.3, tendance: "baisse", confiance: 72, volume: 18000 },
  { produit: "Huile palme", region: "Plateau", qualite: "Brute", prixProducteur: 450, prixAcheteur: 500, spread: 50, spreadPercent: 11.1, tendance: "stable", confiance: 80, volume: 8000 },
  { produit: "Anacarde", region: "Borgou", qualite: "Noix brute", prixProducteur: 650, prixAcheteur: 720, spread: 70, spreadPercent: 10.8, tendance: "hausse", confiance: 75, volume: 12000 },
  { produit: "Manioc", region: "Zou", qualite: "Frais", prixProducteur: 120, prixAcheteur: 140, spread: 20, spreadPercent: 16.7, tendance: "stable", confiance: 88, volume: 30000 },
];

interface Prevision {
  produit: string; region: string; prixPrediction: number; volumePrediction: number;
  intervalleConfiance: [number, number]; saison: string; spreadEstime: number;
}

const PREVISIONS: Prevision[] = [
  { produit: "Maïs blanc", region: "Donga", prixPrediction: 215, volumePrediction: 16500, intervalleConfiance: [190, 240], saison: "Récolte principale juil-sept", spreadEstime: 28 },
  { produit: "Cacao bio", region: "Couffo", prixPrediction: 1720, volumePrediction: 5200, intervalleConfiance: [1580, 1860], saison: "Campagne intermédiaire", spreadEstime: 185 },
  { produit: "Soja", region: "Alibori", prixPrediction: 275, volumePrediction: 25000, intervalleConfiance: [255, 295], saison: "Récolte oct-dec", spreadEstime: 35 },
];

function getTendance(t: string) {
  if (t === "hausse") return "📈"; if (t === "baisse") return "📉"; return "➡️";
}

export default function MarketScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"corridor" | "previsions">("corridor");
  const [selected, setSelected] = useState<Corridor | null>(null);
  const [refreshingCalc, setRefreshingCalc] = useState(false);
  const role = user?.role || "producteur";
  const { open: fsOpen, close: fsClose, phase, frozen, slideStyle } = useFreezeAndSlide();
  const { alert, showReward, maybeReward } = useVariableReward();
  const refreshAnim = useRef(new Animated.Value(0)).current;

  const totalVolume = useMemo(() => CORRIDORS.reduce((s, c) => s + c.volume, 0), []);
  const totalSpread = useMemo(() => CORRIDORS.reduce((s, c) => s + c.spread * c.volume, 0), []);

  // Animation "Calcul des cours…" pendant le Pull-to-Refresh asymétrique
  const handleRefresh = useCallback(() => {
    setRefreshingCalc(true);
    // Animation de 1.5s même si le cache est frais → dopamine
    Animated.sequence([
      Animated.timing(refreshAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(refreshAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start(() => {
      setRefreshingCalc(false);
      maybeReward(); // Récompense variable : alerte surprise 40% du temps
    });
  }, [refreshAnim, maybeReward]);

  const handleSelect = useCallback((item: Corridor) => {
    setSelected(item);
    fsOpen();
  }, [fsOpen]);

  const handleClose = useCallback(() => {
    fsClose();
    setTimeout(() => setSelected(null), 140);
  }, [fsClose]);

  const renderCard = (item: Corridor) => (
    <StaleDataWrapper lastUpdated={new Date().toISOString()} ttlMinutes={5}>
    <TouchableOpacity activeOpacity={0.7} onPress={() => handleSelect(item)}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.produit}>{item.produit}</Text>
          <Text style={styles.tendance}>{getTendance(item.tendance)}</Text>
        </View>
        <Text style={styles.region}>{item.region} — {item.qualite}</Text>

        <View style={styles.priceBox}>
          <View style={styles.priceCol}>
            <Text style={styles.priceLabel}>Producteur</Text>
            <PriceText value={item.prixProducteur} size="lg" style={{ textAlign: "center", marginTop: 2 }} />
            <Text style={styles.priceUnit}>FCFA/kg</Text>
          </View>
          <View style={styles.spreadCol}>
            <Text style={styles.spreadValue}>+{item.spread}</Text>
            <Text style={styles.spreadPercent}>{item.spreadPercent}%</Text>
            <Text style={styles.spreadLabel}>Spread</Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={styles.priceLabel}>Acheteur</Text>
            <PriceText value={item.prixAcheteur} size="lg" style={{ textAlign: "center", marginTop: 2 }} />
            <Text style={[styles.priceUnit, { color: colors.secondary }]}>FCFA/kg</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.confiance}>🔒 Confiance: {item.confiance}%</Text>
          <Text style={styles.volume}>📦 {item.volume.toLocaleString()} t</Text>
        </View>
      </View>
    </TouchableOpacity>
    </StaleDataWrapper>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === "corridor" && styles.tabActive]} onPress={() => setTab("corridor")}>
          <Text style={[styles.tabText, tab === "corridor" && styles.tabTextActive]}>{t("market.corridor")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "previsions" && styles.tabActive]} onPress={() => setTab("previsions")}>
          <Text style={[styles.tabText, tab === "previsions" && styles.tabTextActive]}>{t("market.previsions")}</Text>
        </TouchableOpacity>
      </View>

      {/* Récompense variable : micro-alerte surprise après refresh */}
      <MicroAlertBanner visible={showReward} message={alert} />

      {/* Animation "Calcul des cours…" pendant le Pull-to-Refresh */}
      {refreshingCalc && (
        <View style={styles.calcOverlay}>
          <Animated.Text style={[styles.calcText, { opacity: refreshAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }]}>
            🧮 Calcul des cours en cours…
          </Animated.Text>
        </View>
      )}

      <FlatList
        data={(tab === "corridor" ? CORRIDORS : PREVISIONS) as any[]}
        keyExtractor={(_, i) => `${tab}_${i}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshingCalc}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          tab === "corridor" ? (
            <StaleDataWrapper lastUpdated={new Date().toISOString()} ttlMinutes={5}>
              <View>
              <ProgressiveLayout
                items={[{
                  key: "voice-guide",
                  static: (
                    <View style={styles.voiceHint}>
                      <Text style={styles.voiceHintText}>🎧 Guide vocal disponible</Text>
                    </View>
                  ),
                  interactive: (
                    <TouchableOpacity style={styles.voiceBtn} onPress={() => {}}>
                      <Text style={styles.voiceBtnText}>🎤 Écouter le résumé du marché</Text>
                    </TouchableOpacity>
                  ),
                  delay: 200,
                }]}
              />
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>📊 {t("market.bulletin")} {new Date().toLocaleDateString()}</Text>
                <Text style={styles.bannerMeta}>{totalVolume.toLocaleString()} tonnes couvertes</Text>
                <Text style={styles.bannerMeta}>Spread total marché : {totalSpread.toLocaleString()} FCFA</Text>
                <Text style={styles.bannerNote}>Producteur voit prix net • Acheteur voit prix tout compris</Text>
              </View>
              {role === "acheteur" && (
                <View style={styles.roleHint}>
                  <Text style={styles.roleHintText}>👤 Vous voyez les prix acheteur (frais de séquestre inclus)</Text>
                </View>
              )}
              {role === "producteur" && (
                <View style={styles.roleHint}>
                  <Text style={styles.roleHintText}>👤 Vous voyez votre prix net (aucune commission déduite)</Text>
                </View>
              )}
            </View>
            </StaleDataWrapper>
          ) : (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>🤖 {t("market.previsions")} IA</Text>
              <Text style={styles.bannerMeta}>Satellite + Calendrier + Machine Learning</Text>
            </View>
          )
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        renderItem={({ item }: any) =>
          tab === "corridor" ? renderCard(item) : (
            <View style={styles.card}>
              <Text style={styles.produit}>{item.produit}</Text>
              <Text style={styles.region}>{item.region} — {item.saison}</Text>
              <View style={styles.predRow}>
                <View>
                  <Text style={styles.predLabel}>{t("market.prixPrediction")}</Text>
                  <Text style={styles.predValue}>{item.prixPrediction.toLocaleString()} FCFA</Text>
                </View>
                <View>
                  <Text style={styles.predLabel}>{t("market.volumePrediction")}</Text>
                  <Text style={styles.predValue}>{item.volumePrediction.toLocaleString()} t</Text>
                </View>
              </View>
              <Text style={styles.intervalle}>{t("market.confiance")}: [{item.intervalleConfiance[0]} — {item.intervalleConfiance[1]}] FCFA</Text>
              {role === "producteur" && (
                <Text style={styles.spreadEstime}>📊 Spread estimé: {item.spreadEstime} FCFA/kg</Text>
              )}
            </View>
          )
        }
      />

      {/* Freeze-and-Slide : overlay GPU-accéléré pour les détails du corridor */}
      {selected && (frozen || phase === "live") && (
        <View style={StyleSheet.absoluteFill} pointerEvents={phase === "live" ? "auto" : "none"}>
          {/* Calque figé : copie statique non-interactive de l'arrière-plan */}
          {frozen && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} pointerEvents="none" />
          )}

          {/* Panneau coulissant (GPU : transform translateX) */}
          <Animated.View style={[styles.detailPanel, slideStyle]}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeBtnText}>✕ Retour</Text>
            </TouchableOpacity>

            {phase === "live" && (
              <View>
                <Text style={styles.detailTitle}>{selected.produit}</Text>
                <Text style={styles.detailRegion}>{selected.region} — {selected.qualite}</Text>

                <View style={styles.detailPriceBox}>
                  <View style={styles.detailPriceRow}>
                    <Text style={styles.detailPriceLabel}>Producteur</Text>
                    <PriceText value={selected.prixProducteur} size="lg" />
                  </View>
                  <View style={styles.detailSpread}>
                    <Text style={styles.detailSpreadValue}>+{selected.spread} FCFA</Text>
                    <Text style={styles.detailSpreadPercent}>{selected.spreadPercent}%</Text>
                  </View>
                  <View style={styles.detailPriceRow}>
                    <Text style={styles.detailPriceLabel}>Acheteur</Text>
                    <PriceText value={selected.prixAcheteur} size="lg" />
                  </View>
                </View>

                <View style={styles.detailInfo}>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailInfoLabel}>📊 Tendance</Text>
                    <Text style={styles.detailInfoValue}>{selected.tendance} {getTendance(selected.tendance)}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailInfoLabel}>🔒 Confiance marché</Text>
                    <Text style={styles.detailInfoValue}>{selected.confiance}%</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailInfoLabel}>📦 Volume disponible</Text>
                    <Text style={styles.detailInfoValue}>{selected.volume.toLocaleString()} t</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailInfoLabel}>📋 Qualité</Text>
                    <Text style={styles.detailInfoValue}>{selected.qualite}</Text>
                  </View>
                </View>

                {(role === "producteur" || role === "intermediaire") && (
                  <View style={styles.detailRoleBanner}>
                    <Text style={styles.detailRoleText}>
                      💰 Votre prix net : <PriceText value={selected.prixProducteur} size="sm" />/kg
                    </Text>
                  </View>
                )}
                {role === "acheteur" && (
                  <View style={styles.detailRoleBanner}>
                    <Text style={styles.detailRoleText}>
                      💳 Prix tout compris : <PriceText value={selected.prixAcheteur} size="sm" />/kg
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: "row", backgroundColor: colors.surfaceAlt, margin: 16, marginBottom: 0, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
  tabTextActive: { color: colors.white, fontWeight: "700" },
  banner: { backgroundColor: colors.primary + "10", padding: 14, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.primary + "20" },
  bannerTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 2 },
  bannerMeta: { fontSize: 12, color: colors.textSecondary },
  bannerNote: { fontSize: 10, color: colors.textTertiary, marginTop: 4, fontStyle: "italic" },
  voiceHint: { backgroundColor: colors.primary + "10", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8, alignSelf: "flex-start" },
  voiceHintText: { fontSize: 11, color: colors.primary, fontWeight: "500" },
  voiceBtn: { backgroundColor: colors.primary + "15", padding: 10, borderRadius: 10, marginBottom: 12, alignItems: "center" },
  voiceBtnText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  roleHint: { backgroundColor: colors.accent + "15", padding: 10, borderRadius: 10, marginBottom: 12 },
  roleHintText: { fontSize: 12, color: colors.accent, fontWeight: "500" },
  card: { backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  produit: { fontSize: 15, fontWeight: "700", color: colors.text },
  tendance: { fontSize: 18 },
  region: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  priceBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 8 },
  priceCol: { flex: 1, alignItems: "center" },
  priceLabel: { fontSize: 10, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
  priceUnit: { fontSize: 10, color: colors.textTertiary },
  spreadCol: { alignItems: "center", paddingHorizontal: 8 },
  spreadValue: { fontSize: 16, fontWeight: "700", color: colors.accent },
  spreadPercent: { fontSize: 11, color: colors.accent },
  spreadLabel: { fontSize: 9, color: colors.textTertiary, textTransform: "uppercase" },
  footer: { flexDirection: "row", justifyContent: "space-between" },
  confiance: { fontSize: 11, color: colors.textTertiary },
  volume: { fontSize: 11, color: colors.textSecondary },
  predRow: { flexDirection: "row", justifyContent: "space-around", marginVertical: 8 },
  predLabel: { fontSize: 11, color: colors.textTertiary, textAlign: "center" },
  predValue: { fontSize: 18, fontWeight: "700", color: colors.secondary, textAlign: "center" },
  intervalle: { fontSize: 11, color: colors.textTertiary, textAlign: "center" },
  spreadEstime: { fontSize: 12, color: colors.accent, fontWeight: "500", textAlign: "center", marginTop: 4 },
  detailPanel: {
    position: "absolute",
    top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 60,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  closeBtn: { alignSelf: "flex-start", marginBottom: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  closeBtnText: { fontSize: 14, fontWeight: "600", color: colors.text },
  detailTitle: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 2 },
  detailRegion: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
  detailPriceBox: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  detailPriceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  detailPriceLabel: { fontSize: 13, color: colors.textTertiary, fontWeight: "500" },
  detailSpread: { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, marginVertical: 4 },
  detailSpreadValue: { fontSize: 16, fontWeight: "700", color: colors.accent },
  detailSpreadPercent: { fontSize: 13, color: colors.accent, opacity: 0.7 },
  detailInfo: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16 },
  detailInfoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  detailInfoLabel: { fontSize: 13, color: colors.textTertiary },
  detailInfoValue: { fontSize: 14, fontWeight: "600", color: colors.text },
  detailRoleBanner: { backgroundColor: colors.accent + "15", padding: 14, borderRadius: 12 },
  detailRoleText: { fontSize: 14, fontWeight: "600", color: colors.text, textAlign: "center" },

  calcOverlay: { position: "absolute", top: 60, left: 0, right: 0, alignItems: "center", zIndex: 50 },
  calcText: { fontSize: 13, fontWeight: "600", color: colors.primary, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
});
