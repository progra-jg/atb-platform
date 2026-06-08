import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme";
import { radii } from "../theme/tokens";

interface USSDMenuItemProps {
  index: number;
  title: string;
  subtitle?: string;
  icon?: string;
  onPress: () => void;
  style?: ViewStyle;
}

/**
 * Composant de menu vertical à alignement cognitif USSD.
 * Chaque option est associée mentalement à un index numérique
 * (comme un menu USSD *512#), facilitant la transition
 * feature phone → smartphone.
 *
 * Design : colonne unique, index large à gauche, pas de grille.
 */
export default function USSDMenuItem({ index, title, subtitle, icon, onPress, style }: USSDMenuItemProps) {
  return (
    <TouchableOpacity style={[styles.item, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.indexCol}>
        <Text style={styles.index}>{index}</Text>
      </View>
      <View style={styles.contentCol}>
        <Text style={styles.title}>{icon ? `${icon}  ` : ""}{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  indexCol: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  index: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  contentCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    fontSize: 22,
    color: colors.textTertiary,
    marginLeft: 8,
  },
});

/**
 * Ancre les options de l'application à des index numériques
 * cohérents entre l'USSD Feature Phone et l'application smartphone.
 *
 * Exemple : si l'étape 1 sur l'USSD est "Enregistrer une récolte",
 * l'écran doit présenter cette option comme premier bloc vertical.
 */
export function useUSSDAnchoring() {
  return {
    /** Retourne l'index USSD (1-indexed) pour une action donnée */
    getIndex: (action: string, order: string[]) => {
      const idx = order.indexOf(action);
      return idx >= 0 ? idx + 1 : null;
    },
  };
}
