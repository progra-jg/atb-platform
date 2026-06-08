import { TextStyle } from "react-native";
import { colors } from "./colors";

type TextPresets = Record<string, TextStyle>;

export const typography: TextPresets = {
  h1: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: "700", color: colors.text, letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: "700", color: colors.text },
  body: { fontSize: 15, fontWeight: "400", color: colors.text },
  bodyBold: { fontSize: 15, fontWeight: "600", color: colors.text },
  caption: { fontSize: 13, fontWeight: "400", color: colors.textSecondary },
  captionBold: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  small: { fontSize: 11, fontWeight: "400", color: colors.textTertiary },
  smallBold: { fontSize: 11, fontWeight: "600", color: colors.textTertiary },
  micro: { fontSize: 9, fontWeight: "600", color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
  price: { fontSize: 20, fontWeight: "700", color: colors.primary },
  priceSmall: { fontSize: 15, fontWeight: "700", color: colors.primary },
};
