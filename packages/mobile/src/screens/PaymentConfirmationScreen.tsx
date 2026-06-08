import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { colors } from "../theme";
import { enqueueAction } from "../storage/offline";
import { useNetworkStatus } from "../utils/network";
import EmptyState from "../components/EmptyState";

interface Paiement {
  id: string;
  orderId: string;
  produit: string;
  montant: number;
  mobileMoney: string;
  telephone: string;
  statut: "pending" | "confirmed" | "failed";
  date: string;
  reference?: string;
}

const MOCK_PAIEMENTS: Paiement[] = [
  { id: "pay-001", orderId: "CMD-001", produit: "Maïs blanc (2.5T)", montant: 525000, mobileMoney: "MTN MoMo", telephone: "+229 97 00 00 01", statut: "pending", date: "2026-06-08", reference: "REF-8972" },
  { id: "pay-002", orderId: "CMD-002", produit: "Soja (3T)", montant: 720000, mobileMoney: "Moov Money", telephone: "+229 61 00 00 01", statut: "pending", date: "2026-06-07" },
  { id: "pay-003", orderId: "CMD-003", produit: "Cacao bio (1.5T)", montant: 2250000, mobileMoney: "Orange Money", telephone: "+229 54 00 00 01", statut: "confirmed", date: "2026-06-06", reference: "CONF-6541" },
];

const OPERATEURS = {
  "MTN MoMo": { code: "*155#", color: "#FFCC00" },
  "Moov Money": { code: "*155*3#", color: "#00A3E0" },
  "Orange Money": { code: "#144#", color: "#FF7900" },
};

export default function PaymentConfirmationScreen() {
  const isOnline = useNetworkStatus();
  const [paiements, setPaiements] = useState<Paiement[]>(MOCK_PAIEMENTS);

  const handleConfirm = (item: Paiement) => {
    Alert.alert("Confirmer le paiement ?", `Avez-vous bien reçu ${item.montant.toLocaleString()} FCFA via ${item.mobileMoney} ?`, [
      { text: "Non", style: "cancel" },
      { text: "Oui, confirmer", onPress: async () => {
        const updated = paiements.map(p => p.id === item.id ? { ...p, statut: "confirmed" as const, reference: `CONF-${Date.now()}` } : p);
        setPaiements(updated);
        if (!isOnline) await enqueueAction("payment/confirm", { paymentId: item.id });
        Alert.alert("✅ Paiement confirmé", `${item.montant.toLocaleString()} FCFA — ${item.mobileMoney}`);
      }},
    ]);
  };

  const handleSaisirCode = (item: Paiement) => {
    const op = OPERATEURS[item.mobileMoney as keyof typeof OPERATEURS];
    Alert.alert(
      `📲 ${item.mobileMoney}`,
      `Composez ${op?.code || "*155#"} sur votre téléphone.\n\nMontant : ${item.montant.toLocaleString()} FCFA\nDestinataire : ${item.telephone}\n\nConfirmez ici après réception.`,
      [{ text: "OK" }]
    );
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>💸 Paiements Mobile Money</Text>
      <Text style={styles.sub}>{paiements.filter(p => p.statut === "pending").length} en attente de confirmation</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={paiements}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title="Aucun paiement en cours" />}
        renderItem={({ item }) => (
          <View style={[styles.card, item.statut === "confirmed" && styles.cardDimmed]}>
            <View style={styles.row}>
              <Text style={styles.produit}>{item.produit}</Text>
              <View style={[styles.badge, { backgroundColor: item.statut === "confirmed" ? colors.success + "20" : colors.warning + "20" }]}>
                <Text style={[styles.badgeText, { color: item.statut === "confirmed" ? colors.success : colors.warning }]}>
                  {item.statut === "confirmed" ? "✅ Confirmé" : "⏳ En attente"}
                </Text>
              </View>
            </View>

            <Text style={styles.orderId}>Commande : {item.orderId}</Text>
            <Text style={styles.date}>{item.date}</Text>

            <View style={styles.montantBox}>
              <Text style={styles.montant}>{item.montant.toLocaleString()} FCFA</Text>
            </View>

            <View style={styles.operateurBox}>
              <Text style={styles.operateurLabel}>Opérateur</Text>
              <Text style={styles.operateur}>{item.mobileMoney}</Text>
              <Text style={styles.telephone}>{item.telephone}</Text>
              {item.reference && <Text style={styles.ref}>Réf : {item.reference}</Text>}
            </View>

            {item.statut === "pending" && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.codeBtn} onPress={() => handleSaisirCode(item)}>
                  <Text style={styles.codeText}>📲 Composer le code</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(item)}>
                  <Text style={styles.confirmText}>✅ Confirmer réception</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardDimmed: { opacity: 0.6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  produit: { fontSize: 15, fontWeight: "700", color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  orderId: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
  date: { fontSize: 12, color: colors.textTertiary },
  montantBox: { backgroundColor: colors.primary + "15", padding: 10, borderRadius: 10, marginTop: 8, alignItems: "center" },
  montant: { fontSize: 20, fontWeight: "800", color: colors.primary },
  operateurBox: { backgroundColor: colors.surfaceAlt, padding: 10, borderRadius: 10, marginTop: 8 },
  operateurLabel: { fontSize: 10, color: colors.textTertiary, textTransform: "uppercase" },
  operateur: { fontSize: 14, fontWeight: "600", color: colors.text },
  telephone: { fontSize: 13, color: colors.textSecondary },
  ref: { fontSize: 11, color: colors.success, marginTop: 2 },
  actions: { flexDirection: "row", gap: 6, marginTop: 10 },
  codeBtn: { flex: 1, backgroundColor: colors.surfaceAlt, padding: 12, borderRadius: 10, alignItems: "center" },
  codeText: { fontSize: 12, fontWeight: "600", color: colors.text },
  confirmBtn: { flex: 1, backgroundColor: colors.success, padding: 12, borderRadius: 10, alignItems: "center" },
  confirmText: { fontSize: 12, fontWeight: "700", color: colors.white },
});
