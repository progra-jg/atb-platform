import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet, Easing } from "react-native";

const ALERT_COLORS = {
  /** Orange Fluorescent Sémantique — visible daltoniens, résiste à la réfraction solaire */
  orange: "#FF5722",
  /** Jaune Soufre — cible les photorécepteurs périphériques */
  yellow: "#CCFF00",
} as const;

interface CriticalAlertBannerProps {
  visible: boolean;
  message: string;
  submessage?: string;
  variant?: "orange" | "yellow";
  onPress?: () => void;
}

/**
 * Chroma-Keying d'Attention.
 *
 * Utilise des couleurs spectralement optimisées pour la vision périphérique
 * et la résistance à la réfraction solaire.
 *
 * L'alerte pulse avec un rythme ASYNCHRONE (irrégulier) :
 * le cerveau humain repère immédiatement l'asymétrie et le mouvement
 * irrégulier, forçant l'attention même en environnement distrayant.
 */
export default function CriticalAlertBanner({
  visible,
  message,
  submessage,
  variant = "orange",
  onPress,
}: CriticalAlertBannerProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [pulseDuration, setPulseDuration] = useState(600);

  // Pulsation asynchrone : durée irrégulière entre 400-1200ms
  useEffect(() => {
    if (!visible) {
      pulse.setValue(0);
      return;
    }

    const animate = () => {
      const dur = 400 + Math.random() * 800; // 400-1200ms irrégulier
      setPulseDuration(dur);
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: dur * 0.4,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: dur * 0.6,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (visible) animate();
      });
    };

    animate();
    return () => pulse.stopAnimation();
  }, [visible]);

  if (!visible) return null;

  const bgColor = variant === "orange" ? ALERT_COLORS.orange : ALERT_COLORS.yellow;
  const textColor = variant === "orange" ? "#ffffff" : "#000000";

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: bgColor,
          opacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.85, 1],
          }),
          transform: [
            {
              scale: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={[styles.icon, { color: textColor }]}>
        {variant === "orange" ? "🚨" : "⚠️"}
      </Text>
      <View style={styles.textCol}>
        <Text style={[styles.message, { color: textColor }]}>{message}</Text>
        {submessage && (
          <Text style={[styles.submessage, { color: textColor, opacity: 0.85 }]}>
            {submessage}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

export { ALERT_COLORS };

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: { fontSize: 20 },
  textCol: { flex: 1 },
  message: { fontSize: 14, fontWeight: "700", lineHeight: 18 },
  submessage: { fontSize: 12, fontWeight: "500", marginTop: 2, lineHeight: 16 },
});
