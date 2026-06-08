import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

const CHROMATIC_FREQ_MS = 2000; // 0.25Hz — pulsation lente décorative

/**
 * Pulsation lente décorative pour indiquer un état d'attente.
 * Simple indicateur visuel de chargement, sans effet physiologique.
 *
 * @param active - Déclenche/désactive la pulsation
 * @returns Animated.Value à interpoler sur opacity
 */
export function useChromaticEntrainment(active: boolean): Animated.Value {
  const chroma = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      chroma.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(chroma, {
          toValue: 0,
          duration: CHROMATIC_FREQ_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(chroma, {
          toValue: 1,
          duration: CHROMATIC_FREQ_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, chroma]);

  return chroma;
}
