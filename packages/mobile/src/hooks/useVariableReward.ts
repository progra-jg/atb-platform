import { useState, useCallback, useRef } from "react";

/**
 * Micro-alertes à récompense variable (Variable Reward Engine).
 *
 * Simule une "recherche de trésor" : l'utilisateur ne sait jamais
 * quelle alerte va apparaître au prochain Pull-to-Refresh.
 * Crée un pic de dopamine → réflexe matinal d'ouverture de l'app.
 */
const ALERTS = [
  "📈 Tendance hausse détectée dans la commune voisine d'Aklampa",
  "🌾 Nouveau lot de maïs blanc disponible à 180 FCFA/kg",
  "🚛 Un transporteur cherche du fret sur l'axe Cotonou–Parakou",
  "💰 Prime de fidélité : +2% sur votre prochaine transaction séquestre",
  "📊 Le spread du cacao bio a baissé de 3% cette semaine",
  "🔒 3 nouveaux acheteurs certifiés dans votre région",
  "🌤️ Conditions météo favorables pour la récolte dans le Zou",
  "🏆 Votre score de réputation a augmenté — Félicitations !",
];

export function useVariableReward() {
  const [alert, setAlert] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const lastIndex = useRef(-1);

  const maybeReward = useCallback(() => {
    // 40% de chance d'afficher une alerte exclusive
    if (Math.random() > 0.4) {
      setShowReward(false);
      return;
    }

    // Évite la répétition consécutive
    let idx = lastIndex.current;
    while (idx === lastIndex.current) {
      idx = Math.floor(Math.random() * ALERTS.length);
    }
    lastIndex.current = idx;
    setAlert(ALERTS[idx]);
    setShowReward(true);

    // Auto-clear après 6s
    setTimeout(() => setShowReward(false), 6000);
  }, []);

  return { alert, showReward, maybeReward };
}
