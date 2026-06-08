import { View, Text, Animated, StyleSheet } from "react-native";
import { colors, useTheme } from "../theme";
import { useEffect, useRef } from "react";

interface MicroAlertBannerProps {
  visible: boolean;
  message: string | null;
}

/**
 * Bannière d'alerte à récompense variable.
 * Apparaît de manière surprenante après un Pull-to-Refresh.
 * Animation : slide down + glow vert → dopamine visuelle.
 */
export default function MicroAlertBanner({ visible, message }: MicroAlertBannerProps) {
  const { colors: themeColors } = useTheme();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !message) {
      slideAnim.setValue(-80);
      glow.setValue(0);
      return;
    }

    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 5500);

    return () => clearTimeout(timer);
  }, [visible, message]);

  if (!visible || !message) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: themeColors.surface,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Animated.View style={[styles.glow, { opacity: glow }]} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    zIndex: 100,
    padding: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.primary + "20",
    overflow: "hidden",
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.06,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 18,
  },
});
