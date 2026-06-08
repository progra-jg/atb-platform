import { create } from "zustand";
import { Alert } from "react-native";

interface SensorStore {
  sensorConsent: boolean;
  requestConsent: () => Promise<boolean>;
  revokeConsent: () => void;
}

export const useSensorStore = create<SensorStore>((set, get) => ({
  sensorConsent: false,

  requestConsent: async (): Promise<boolean> => {
    if (get().sensorConsent) return true;

    return new Promise((resolve) => {
      Alert.alert(
        "Données capteur",
        "AgriTrace utilise l'accéléromètre de votre appareil pour détecter l'angle de lecture et pré-charger les données (corridor de prix, graphiques).\n\n" +
        "Aucune donnée n'est transmise à nos serveurs. Vous pouvez révoquer cette autorisation à tout moment dans Paramètres.\n\n" +
        "Souhaitez-vous activer cette fonctionnalité ?",
        [
          { text: "Non", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Activer",
            onPress: () => {
              set({ sensorConsent: true });
              resolve(true);
            },
          },
        ]
      );
    });
  },

  revokeConsent: () => set({ sensorConsent: false }),
}));
