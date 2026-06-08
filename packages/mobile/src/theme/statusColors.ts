import { useTheme } from "../theme";

/**
 * Retourne des couleurs de statut désaturées pour le mode sombre,
 * et vives pour le mode clair, assurant la lisibilité en extérieur.
 */
export function useStatusColor() {
  const { isDark } = useTheme();

  const statusColors: Record<string, string> = {
    disponible: isDark ? "#3DA07C" : "#059669",
    reserve: isDark ? "#C9A34A" : "#d97706",
    vendu: isDark ? "#4FAF6A" : "#16a34a",
    negociation: isDark ? "#4A7BC4" : "#2563eb",
    en_livraison: isDark ? "#C9A34A" : "#ea580c",
    livree: isDark ? "#4FAF6A" : "#16a34a",
    conteste: isDark ? "#D47474" : "#dc2626",
    remboursee: isDark ? "#7A7F85" : "#64748b",
  };

  return {
    getColor: (statut: string) => statusColors[statut] || (isDark ? "#7A7F85" : "#94a3b8"),
    isDark,
  };
}

/** Version directe sans hook (pour styles statiques) */
export function getStatusColorForTheme(statut: string, isDark: boolean): string {
  const map: Record<string, [string, string]> = {
    disponible: ["#059669", "#3DA07C"],
    reserve: ["#d97706", "#C9A34A"],
    vendu: ["#16a34a", "#4FAF6A"],
    negociation: ["#2563eb", "#4A7BC4"],
    en_livraison: ["#ea580c", "#C9A34A"],
    livree: ["#16a34a", "#4FAF6A"],
    conteste: ["#dc2626", "#D47474"],
    remboursee: ["#64748b", "#7A7F85"],
  };
  const pair = map[statut];
  return pair ? (isDark ? pair[1] : pair[0]) : (isDark ? "#7A7F85" : "#94a3b8");
}
