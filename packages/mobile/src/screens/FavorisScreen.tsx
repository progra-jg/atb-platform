import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { colors } from "../theme";
import { enqueueAction } from "../storage/offline";
import { useNetworkStatus } from "../utils/network";
import EmptyState from "../components/EmptyState";

interface LotFavori {
  id: string;
  produit: string;
  quantite: number;
  unite: string;
  prix: number;
  producteur: string;
  localisation: string;
  certification?: string;
  dateAjout: string;
  prixChange?: boolean;
  rupture?: boolean;
}

const MOCK_FAVORIS: LotFavori[] = [
  { id: "fav-001", produit: "Maïs blanc", quantite: 5000, unite: "kg", prix: 185, producteur: "Kossi Agué", localisation: "Covè", certification: "GlobalGAP", dateAjout: "2026-06-01" },
  { id: "fav-002", produit: "Cacao bio", quantite: 1500, unite: "kg", prix: 1550, producteur: "Benoît Zinsou", localisation: "Pobè", certification: "Bio", dateAjout: "2026-05-28", prixChange: true },
  { id: "fav-003", produit: "Soja", quantite: 3000, unite: "kg", prix: 245, producteur: "Fatima Diallo", localisation: "Malanville", dateAjout: "2026-05-20" },
  { id: "fav-004", produit: "Riz", quantite: 2000, unite: "kg", prix: 320, producteur: "Mariam Soro", localisation: "Parakou", dateAjout: "2026-06-05", rupture: true },
];

export default function FavorisScreen() {
  const isOnline = useNetworkStatus();
  const [favoris, setFavoris] = useState<LotFavori[]>(MOCK_FAVORIS);

  const handleRemove = (id: string) => {
    Alert.alert("Retirer des favoris", "Confirmer ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Retirer", onPress: () => {
        setFavoris(prev => prev.filter(f => f.id !== id));
        if (!isOnline) enqueueAction("favoris/remove", { lotId: id });
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={favoris}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>⭐ Lots sauvegardés</Text>
            <Text style={styles.sub}>{favoris.length} lots suivis</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Aucun favori" subtitle="Sauvegardez des lots depuis le catalogue" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => {}}>
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <Text style={styles.produit}>{item.produit}</Text>
                {item.certification && <Text style={styles.certif}>{item.certification}</Text>}
              </View>
              <TouchableOpacity onPress={() => handleRemove(item.id)}>
                <Text style={styles.star}>⭐</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.producteur}>🌾 {item.producteur} · 📍 {item.localisation}</Text>
            <Text style={styles.quantite}>{item.quantite.toLocaleString()} {item.unite}</Text>

            <View style={styles.prixRow}>
              <Text style={styles.prix}>{item.prix} FCFA/kg</Text>
              <Text style={styles.total}>{(item.prix * item.quantite).toLocaleString()} FCFA</Text>
            </View>

            {item.prixChange && <Text style={styles.alert}>📈 Prix modifié depuis votre dernière visite</Text>}
            {item.rupture && <Text style={styles.ruptureAlert}>⚠️ Plus disponible — contactez le producteur</Text>}

            <Text style={styles.date}>Sauvegardé le {item.dateAjout}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  produit: { fontSize: 16, fontWeight: "700", color: colors.text },
  certif: { fontSize: 10, backgroundColor: colors.success + "20", color: colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontWeight: "600" },
  star: { fontSize: 22 },
  producteur: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  quantite: { fontSize: 14, color: colors.text, marginTop: 4 },
  prixRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, backgroundColor: colors.surfaceAlt, padding: 8, borderRadius: 8 },
  prix: { fontSize: 16, fontWeight: "700", color: colors.primary },
  total: { fontSize: 14, fontWeight: "600", color: colors.text },
  alert: { fontSize: 12, color: colors.warning, marginTop: 6, fontWeight: "600" },
  ruptureAlert: { fontSize: 12, color: colors.error, marginTop: 6, fontWeight: "600" },
  date: { fontSize: 11, color: colors.textTertiary, marginTop: 6 },
});
