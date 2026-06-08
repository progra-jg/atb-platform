import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet, Easing } from "react-native";
import { colors } from "../theme";
import { useChromaticEntrainment } from "../hooks/useChromaticEntrainment";
import ChromaticLoader from "./ChromaticLoader";

interface CalculationOverlayProps {
  visible: boolean;
  label?: string;
  sublabel?: string;
  onComplete?: () => void;
  duration?: number;
}

export default function CalculationOverlay({
  visible,
  label = "Calcul en cours…",
  sublabel = "Génération du sceau cryptographique",
  onComplete,
  duration = 1200,
}: CalculationOverlayProps) {
  const scanPos = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.3)).current;
  const chroma = useChromaticEntrainment(visible);

  useEffect(() => {
    if (!visible) {
      scanPos.setValue(0);
      pulse.setValue(0.3);
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanPos, {
          toValue: 1,
          duration: duration * 0.8,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanPos, {
          toValue: 0,
          duration: duration * 0.4,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { iterations: 2 }
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(() => onComplete?.(), duration * 1.2);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.card, { opacity: chroma.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }]}>
        <View style={styles.iconRow}>
          <Animated.View style={[styles.dot, { opacity: pulse }]} />
          <Text style={styles.icon}>🔐</Text>
          <Animated.View style={[styles.dot, { opacity: Animated.subtract(1, pulse) }]} />
        </View>

        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sublabel}>{sublabel}</Text>

        <View style={styles.scanBar}>
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanPos.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-40, 40],
                    }),
                  },
                ],
              },
            ]}
          />
          <Text style={styles.hashText}>
            {visible ? Array.from({ length: 8 }, () => Math.random().toString(16)[2]).join("") : ""}
          </Text>
        </View>

        <ChromaticLoader active={visible} size={16} style={{ marginBottom: 8 }} />
        <Text style={styles.footer}>SHA-256 • Contrat traçable • Horodatage</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    marginHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  icon: { fontSize: 32 },
  label: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  sublabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  scanBar: {
    width: "100%",
    height: 48,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  scanLine: {
    position: "absolute",
    width: "100%",
    height: 3,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  hashText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: colors.primary,
    letterSpacing: 2,
  },
  footer: {
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
