import { Text, TextStyle } from "react-native";
import { colors, typography, useTheme } from "../theme";

interface PriceTextProps {
  value: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  style?: TextStyle;
}

const sizeMap: Record<string, TextStyle> = {
  sm: { ...typography.priceSmall },
  md: { ...typography.price },
  lg: { fontSize: 28, fontWeight: "800", color: colors.primary },
};

/**
 * Affiche un montant avec une ombre portée interne (inner shadow)
 * pour éviter le phénomène d'irradiation en plein soleil.
 * La couleur de l'ombre correspond au fond (dark/light) pour
 * agir comme un masque de netteté physique.
 */
export default function PriceText({ value, currency = "FCFA", size = "md", style }: PriceTextProps) {
  const { isDark } = useTheme();
  const preset = sizeMap[size];

  return (
    <Text
      style={[
        preset,
        {
          color: colors.primary,
          textShadowColor: isDark ? "#0A0F0D" : "#ffffff",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: isDark ? 4 : 0,
        },
        style,
      ]}
    >
      {value.toLocaleString()} {currency}
    </Text>
  );
}
