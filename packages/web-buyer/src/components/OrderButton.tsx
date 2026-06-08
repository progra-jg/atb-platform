import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingCart, CheckCircle } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../services/orders";
import { addNotification } from "../services/notifications";
import { usePermissions } from "../hooks/usePermissions";

interface OrderButtonProps {
  lotId: string;
  culture: string;
  quantite: string;
  prix: number;
  producteurId?: string;
}

export default function OrderButton({ lotId, culture, quantite, prix, producteurId }: OrderButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { can } = usePermissions();
  const [ordering, setOrdering] = useState(false);
  const [done, setDone] = useState(false);

  if (!can("order.create")) return null;

  const handleOrder = async () => {
    if (ordering || done) return;
    setOrdering(true);
    try {
      await createOrder({ lotId, culture, quantite, prix });
      if (producteurId && producteurId !== user?.id) {
        addNotification({
          title: t("notifications.newOrderTitle"),
          desc: t("notifications.newOrderMessage", { culture, quantite }),
        });
      }
      setDone(true);
    } catch {
      /* silent */
    } finally {
      setOrdering(false);
    }
  };

  if (done) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "12px 20px", borderRadius: 10,
        background: `${colors.success}14`, border: `1px solid ${colors.success}22`,
        color: colors.success, fontSize: 13, fontWeight: 600,
      }}>
        <CheckCircle size={18} weight="fill" />
        {t("orders.orderPlaced")}
      </div>
    );
  }

  return (
    <button onClick={handleOrder} disabled={ordering}
      style={{
        width: "100%", padding: "12px 20px", borderRadius: 10, border: "none",
        background: ordering ? colors.textMuted : colors.accent,
        color: "#fff", fontSize: 14, fontWeight: 700, cursor: ordering ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        opacity: ordering ? 0.7 : 1,
        transition: "opacity 0.2s",
      }}>
      <ShoppingCart size={18} weight="bold" />
      {ordering ? t("common.sending") : t("orders.placeOrder")}
    </button>
  );
}
