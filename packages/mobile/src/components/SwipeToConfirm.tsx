import { useState, useRef, useCallback } from "react";
import { View, Text, Animated, PanResponder, StyleSheet, GestureResponderEvent, PanResponderGestureState } from "react-native";
import { colors } from "../theme";
import { radii } from "../theme/tokens";

interface SwipeToConfirmProps {
  /** Texte affiché dans la barre */
  label: string;
  /** Seuil de confirmation en px (défaut: 180) */
  threshold?: number;
  /** Appelé quand le seuil est atteint */
  onConfirm: () => void;
  /** Largeur totale du composant */
  width?: number;
}

/**
 * SwipeToConfirm — geste complexe pour annuler/confirmer (Poka-Yoke).
 * Au lieu d'un bouton "Annuler" visible, l'utilisateur doit
 * glisser (swipe right) pour débloquer l'action négative.
 * L'option de refus est cachée visuellement → pas d'hésitation.
 */
export default function SwipeToConfirm({
  label,
  threshold = 180,
  onConfirm,
  width = 320,
}: SwipeToConfirmProps) {
  const [confirmed, setConfirmed] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const trackWidth = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
        if (gs.dx < 0) return; // only swipe right
        slideAnim.setValue(Math.min(gs.dx, threshold + 40));
      },
      onPanResponderRelease: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
        if (gs.dx >= threshold) {
          setConfirmed(true);
          onConfirm();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const slideWidth = slideAnim.interpolate({
    inputRange: [0, threshold + 40],
    outputRange: [50, threshold + 40],
    extrapolate: "clamp",
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, threshold],
    outputRange: [0.4, 1],
    extrapolate: "clamp",
  });

  if (confirmed) return null;

  return (
    <View
      style={[styles.track, { width }]}
      onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
    >
      <Text style={styles.trackLabel}>{label}</Text>
      <Animated.View
        style={[styles.thumb, { width: slideWidth, opacity }]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.thumbIcon}>⎯⎯⎯☞</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 52,
    backgroundColor: colors.error + "20",
    borderRadius: radii.lg,
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.error + "30",
  },
  trackLabel: {
    position: "absolute",
    alignSelf: "center",
    fontSize: 13,
    color: colors.error,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  thumb: {
    height: 50,
    backgroundColor: colors.error,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  thumbIcon: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "700",
  },
});
