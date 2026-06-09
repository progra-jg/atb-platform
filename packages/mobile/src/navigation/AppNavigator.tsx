import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import VoiceFAB from "../components/VoiceFAB";
import { useAuthStore } from "../store/authStore";
import { useNetworkStatus } from "../utils/network";
import type { UserRole } from "../types";

import DashboardScreen from "../screens/DashboardScreen";
import AgentDashboardScreen from "../screens/AgentDashboardScreen";
import InboxScreen from "../screens/InboxScreen";
import OrdersScreen from "../screens/OrdersScreen";
import OffersScreen from "../screens/OffersScreen";
import ContractsScreen from "../screens/ContractsScreen";
import MarketScreen from "../screens/MarketScreen";
import LotsScreen from "../screens/LotsScreen";
import TransportScreen from "../screens/TransportScreen";
import GroupageScreen from "../screens/GroupageScreen";
import TalkieScreen from "../screens/TalkieScreen";
import EscrowScreen from "../screens/EscrowScreen";
import FavorisScreen from "../screens/FavorisScreen";
import DemandSignalsScreen from "../screens/DemandSignalsScreen";
import ImpactScreen from "../screens/ImpactScreen";
import TrustScreen from "../screens/TrustScreen";
import KycScreen from "../screens/KycScreen";
import CommerceActScreen from "../screens/CommerceActScreen";
import ScanScreen from "../screens/ScanScreen";
import LogisticsTrackingScreen from "../screens/LogisticsTrackingScreen";
import PriceAlertsScreen from "../screens/PriceAlertsScreen";
import CertificatesScreen from "../screens/CertificatesScreen";
import SettingsStack from "./SettingsStack";

import NegotiationScreen from "../screens/NegotiationScreen";
import PaymentConfirmationScreen from "../screens/PaymentConfirmationScreen";
import PayoutScreen from "../screens/PayoutScreen";
import FinancingScreen from "../screens/FinancingScreen";
import QualityAssuranceScreen from "../screens/QualityAssuranceScreen";
import AlertMeteoScreen from "../screens/AlertMeteoScreen";
import AnnuaireProducteursScreen from "../screens/AnnuaireProducteursScreen";
import ParrainageScreen from "../screens/ParrainageScreen";
import MarcheSoirScreen from "../screens/MarcheSoirScreen";

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    lots: "🌾", orders: "📋", offers: "📋", market: "📊", commerce: "⚖️",
    transport: "🚛", groupage: "📦", talkie: "🎤", escrow: "🔒", kyc: "🪪",
    settings: "⚙️", dashboard: "📊", trust: "🕸️", inbox: "📨", certificates: "📜",
    contracts: "📝", priceAlerts: "🔔", logistics: "🚚", favoris: "⭐",
    demand: "📢", impact: "🌍", scan: "📷", agent: "👤", payout: "💸",
    financing: "🌱", quality: "🔬", meteo: "🌤️", annuaire: "🌾",
    parrainage: "👥", negotiation: "💬", payments: "✅", marches: "📰",
  };
  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>{icons[label] || "•"}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 20, opacity: 0.5 },
  iconFocused: { opacity: 1 },
});

interface TabConfig {
  name: string;
  component: React.ComponentType;
  labelKey: string;
}

const ROLE_TABS: Record<UserRole, TabConfig[]> = {
  producteur: [
    { name: "Dashboard", component: DashboardScreen, labelKey: "nav.dashboard" },
    { name: "Inbox", component: InboxScreen, labelKey: "nav.inbox" },
    { name: "Orders", component: OrdersScreen, labelKey: "nav.orders" },
    { name: "Lots", component: LotsScreen, labelKey: "nav.lots" },
    { name: "Contracts", component: ContractsScreen, labelKey: "nav.contracts" },
    { name: "Certificates", component: CertificatesScreen, labelKey: "nav.certificates" },
    { name: "Market", component: MarketScreen, labelKey: "nav.market" },
    { name: "Talkie", component: TalkieScreen, labelKey: "nav.talkie" },
    { name: "PriceAlerts", component: PriceAlertsScreen, labelKey: "nav.priceAlerts" },
    { name: "Settings", component: SettingsStack, labelKey: "nav.settings" },
  ],
  acheteur: [
    { name: "Dashboard", component: DashboardScreen, labelKey: "nav.dashboard" },
    { name: "Inbox", component: InboxScreen, labelKey: "nav.inbox" },
    { name: "Offers", component: OffersScreen, labelKey: "nav.offers" },
    { name: "Orders", component: OrdersScreen, labelKey: "nav.orders" },
    { name: "Contracts", component: ContractsScreen, labelKey: "nav.contracts" },
    { name: "Demand", component: DemandSignalsScreen, labelKey: "nav.demand" },
    { name: "Favoris", component: FavorisScreen, labelKey: "nav.favoris" },
    { name: "Certificates", component: CertificatesScreen, labelKey: "nav.certificates" },
    { name: "Escrow", component: EscrowScreen, labelKey: "nav.escrow" },
    { name: "Impact", component: ImpactScreen, labelKey: "nav.impact" },
    { name: "Market", component: MarketScreen, labelKey: "nav.market" },
    { name: "Settings", component: SettingsStack, labelKey: "nav.settings" },
  ],
  transporteur: [
    { name: "Dashboard", component: DashboardScreen, labelKey: "nav.dashboard" },
    { name: "Inbox", component: InboxScreen, labelKey: "nav.inbox" },
    { name: "Transport", component: TransportScreen, labelKey: "nav.transport" },
    { name: "Logistics", component: LogisticsTrackingScreen, labelKey: "nav.logistics" },
    { name: "Groupage", component: GroupageScreen, labelKey: "nav.groupage" },
    { name: "Market", component: MarketScreen, labelKey: "nav.market" },
    { name: "Talkie", component: TalkieScreen, labelKey: "nav.talkie" },
    { name: "Settings", component: SettingsStack, labelKey: "nav.settings" },
  ],
  intermediaire: [
    { name: "Dashboard", component: DashboardScreen, labelKey: "nav.dashboard" },
    { name: "Inbox", component: InboxScreen, labelKey: "nav.inbox" },
    { name: "Lots", component: LotsScreen, labelKey: "nav.lots" },
    { name: "Orders", component: OrdersScreen, labelKey: "nav.orders" },
    { name: "Contracts", component: ContractsScreen, labelKey: "nav.contracts" },
    { name: "Demand", component: DemandSignalsScreen, labelKey: "nav.demand" },
    { name: "Favoris", component: FavorisScreen, labelKey: "nav.favoris" },
    { name: "Certificates", component: CertificatesScreen, labelKey: "nav.certificates" },
    { name: "Impact", component: ImpactScreen, labelKey: "nav.impact" },
    { name: "Market", component: MarketScreen, labelKey: "nav.market" },
    { name: "Trust", component: TrustScreen, labelKey: "nav.trust" },
    { name: "Settings", component: SettingsStack, labelKey: "nav.settings" },
  ],
  agent: [
    { name: "AgentDashboard", component: AgentDashboardScreen, labelKey: "nav.agent" },
    { name: "Kyc", component: KycScreen, labelKey: "nav.kyc" },
    { name: "CommerceAct", component: CommerceActScreen, labelKey: "nav.commerce" },
    { name: "Scan", component: ScanScreen, labelKey: "nav.scan" },
    { name: "Inbox", component: InboxScreen, labelKey: "nav.inbox" },
    { name: "Offers", component: OffersScreen, labelKey: "nav.offers" },
    { name: "Settings", component: SettingsStack, labelKey: "nav.settings" },
  ],
};

const stackHeaderOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { fontWeight: "700", fontSize: 17, color: colors.text } as const,
  headerTintColor: colors.primary,
};

const DETAIL_SCREENS: Record<string, { component: React.ComponentType; title: string; roles: UserRole[] }> = {
  Negotiation: { component: NegotiationScreen, title: "Négociation", roles: ["producteur", "acheteur", "intermediaire"] },
  PaymentConfirmation: { component: PaymentConfirmationScreen, title: "Confirmation Paiement", roles: ["acheteur", "transporteur", "producteur", "intermediaire"] },
  Payout: { component: PayoutScreen, title: "Décaissement", roles: ["producteur", "agent"] },
  Financing: { component: FinancingScreen, title: "Financement", roles: ["producteur", "intermediaire"] },
  QualityAssurance: { component: QualityAssuranceScreen, title: "Contrôle Qualité", roles: ["producteur", "acheteur", "agent"] },
  AlertMeteo: { component: AlertMeteoScreen, title: "Alertes Météo", roles: ["producteur", "transporteur"] },
  AnnuaireProducteurs: { component: AnnuaireProducteursScreen, title: "Annuaire Producteurs", roles: ["acheteur", "intermediaire", "agent"] },
  Parrainage: { component: ParrainageScreen, title: "Parrainage", roles: ["producteur", "acheteur", "transporteur", "intermediaire", "agent"] },
  MarcheSoir: { component: MarcheSoirScreen, title: "Marché du Soir", roles: ["producteur", "acheteur", "transporteur", "intermediaire"] },
};

function MainTabs() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const role: UserRole = user?.role || "producteur";
  const tabs = ROLE_TABS[role] || ROLE_TABS.producteur;
  const isOnline = useNetworkStatus();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { fontWeight: "700", fontSize: 17, color: colors.text },
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: 4, height: 56 },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        }}
      >
        {tabs.map((tab) => (
          <Tab.Screen key={tab.name} name={tab.name} component={tab.component}
            options={{
              tabBarLabel: t(tab.labelKey),
              tabBarIcon: ({ focused }) => <TabIcon label={tab.name.toLowerCase()} focused={focused} />,
              title: t(tab.labelKey.charAt(0).toUpperCase() + tab.labelKey.slice(1)),
              headerShown: tab.component !== SettingsStack,
              headerRight: () => (
                <View style={{ flexDirection: "row", gap: 4, marginRight: 12, alignItems: "center" }}>
                  <Text style={{ fontSize: 10 }}>{isOnline ? "🟢" : "🔴"}</Text>
                  <TouchableOpacity onPress={() => {}} style={navStyles.roleBadge}>
                    <Text style={navStyles.roleText}>{t(`role.${role}`)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {}}>
                    <Text style={{ fontSize: 20 }}>🔔</Text>
                  </TouchableOpacity>
                </View>
              ),
            }}
          />
        ))}
      </Tab.Navigator>
      <VoiceFAB />
    </SafeAreaView>
  );
}

export default function AppNavigator() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const role: UserRole = user?.role || "producteur";

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={stackHeaderOptions}>
        <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        {(Object.entries(DETAIL_SCREENS))
          .filter(([_, s]) => s.roles.includes(role))
          .map(([name, screen]) => (
            <RootStack.Screen
              key={name}
              name={name}
              component={screen.component}
              options={{ title: screen.title, headerShown: true }}
            />
          ))}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const navStyles = StyleSheet.create({
  roleBadge: {
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { fontSize: 11, fontWeight: "600", color: colors.primary },
});
