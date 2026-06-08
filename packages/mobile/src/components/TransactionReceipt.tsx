import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { colors } from "../theme";
import { useChromaticEntrainment } from "../hooks/useChromaticEntrainment";

interface TransactionReceiptProps {
  visible: boolean;
  montant: number;
  reference: string;
  produit?: string;
  date?: string;
  onDone?: () => void;
}

/**
 * Animation de confirmation transaction :
 * 1. Flash vert désaturé en arrière-plan
 * 2. La carte de transaction se transforme visuellement en reçu
 * 3. Micro-texte de confirmation
 * Durée totale ~1.2s
 */
export default function TransactionReceipt({
  visible,
  montant,
  reference,
  produit,
  date,
  onDone,
}: TransactionReceiptProps) {
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const [showReceipt, setShowReceipt] = useState(false);
  const scale = useRef(new Animated.Value(0.95)).current;
  const chroma = useChromaticEntrainment(visible && showReceipt);

  useEffect(() => {
    if (!visible) {
      setShowReceipt(false);
      flashOpacity.setValue(0);
      scale.setValue(0.95);
      return;
    }

    // Étape 1 : flash vert (150ms)
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.12, duration: 80, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    // Étape 2 : apparition du reçu (300ms après)
    setTimeout(() => {
      setShowReceipt(true);
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }, 300);

    // Étape 3 : callback fin
    const timer = setTimeout(() => onDone?.(), 1800);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Flash vert */}
      <Animated.View style={[styles.flash, { opacity: flashOpacity }]} />

      {/* Reçu */}
      {showReceipt && (
        <Animated.View style={[styles.receipt, { transform: [{ scale }], opacity: chroma.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] }) }]}>
          <Text style={styles.checkmark}>✅</Text>
          <Text style={styles.title}>Transaction confirmée</Text>
          <Text style={styles.ref}>Réf. {reference}</Text>
          {produit && <Text style={styles.produit}>{produit}</Text>}
          <View style={styles.divider} />
          <Text style={styles.amount}>{montant.toLocaleString()} FCFA</Text>
          {date && <Text style={styles.date}>{date}</Text>}
          <Text style={styles.bceao}>🔒 Séquestre contractuel</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.success,
  },
  receipt: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    marginHorizontal: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.success + "40",
    minWidth: 260,
  },
  checkmark: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 },
  ref: { fontSize: 12, color: colors.textTertiary, fontFamily: "monospace", marginBottom: 8 },
  produit: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  divider: { width: "100%", height: 1, backgroundColor: colors.border, marginVertical: 12 },
  amount: { fontSize: 24, fontWeight: "800", color: colors.primary },
  date: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
  bceao: { fontSize: 10, color: colors.textTertiary, marginTop: 12, letterSpacing: 0.5, textTransform: "uppercase" },
});
