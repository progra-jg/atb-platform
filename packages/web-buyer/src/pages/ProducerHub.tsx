import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../hooks/useRole";
import ProducerDashboard from "./sections/ProducerDashboard";
import ProducerLotList from "./sections/ProducerLotList";
import ProducerLotForm from "./sections/ProducerLotForm";
import ProducerOrders from "./sections/ProducerOrders";
import ProducerLotDetail from "./sections/ProducerLotDetail";
import ProducerAnalytics from "./sections/ProducerAnalytics";
import ProducerContracts from "./sections/ProducerContracts";
import ProducerSettings from "./sections/ProducerSettings";

export default function ProducerHub() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const { isFarmer } = useRole();

  if (!isFarmer) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 48, color: colors.textMuted, marginBottom: 16 }}>&#128274;</div>
        <h2 style={{ color: colors.text, marginTop: 16, margin: 0, fontSize: 18 }}>
          {t("common.restricted")}
        </h2>
        <p style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>
          {t("producer.restrictedDesc")}
        </p>
      </div>
    );
  }

  const path = location.pathname;

  if (path.startsWith("/producer/lots/new")) {
    return <ProducerLotForm />;
  }
  if (path.startsWith("/producer/lots/") && path.endsWith("/edit")) {
    return <ProducerLotForm />;
  }
  if (path.startsWith("/producer/lots/") && !path.endsWith("/edit") && path !== "/producer/lots/new") {
    return <ProducerLotDetail />;
  }
  if (path.startsWith("/producer/lots")) {
    return <ProducerLotList />;
  }
  if (path.startsWith("/producer/orders")) {
    return <ProducerOrders />;
  }
  if (path.startsWith("/producer/analytics")) {
    return <ProducerAnalytics />;
  }
  if (path.startsWith("/producer/contracts")) {
    return <ProducerContracts />;
  }
  if (path.startsWith("/producer/settings")) {
    return <ProducerSettings />;
  }

  return <ProducerDashboard />;
}
