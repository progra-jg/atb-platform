import { useRef, useCallback, useState } from "react";
import { Animated, Easing } from "react-native";

const OPEN_DURATION = 220;
const CLOSE_DURATION = 140;

type Phase = "idle" | "freezing" | "frozen" | "animating_in" | "live" | "animating_out";

/**
 * Freeze-and-Slide : technique d'illusion cinétique.
 *
 * 1. FREEZE : capture statique de l'état actuel (le composant devient non-interactif)
 * 2. SLIDE IN : animation GPU (translate3d) en 220ms ease-out → l'utilisateur voit
 *    un panneau glisser parfaitement fluide même sur un téléphone low-cost
 * 3. REPLACE : on injecte discrètement les données dynamiques
 * 4. SLIDE OUT : retour en 140ms ease-in pour une sensation de contrôle instantané
 * 5. UNFREEZE : on réactive l'état interactif
 *
 * useNativeDriver: true garantit 60 FPS (le thread JS est contourné).
 */
export function useFreezeAndSlide() {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [phase, setPhase] = useState<Phase>("idle");

  const frozen = phase === "freezing" || phase === "frozen" || phase === "animating_in";
  const isAnimating = phase === "animating_in" || phase === "animating_out";

  const open = useCallback(() => {
    setPhase("freezing");
    // Micro-tick pour figer le rendu avant l'animation
    requestAnimationFrame(() => {
      setPhase("frozen");
      requestAnimationFrame(() => {
        setPhase("animating_in");
        slideAnim.setValue(1); // Start from right
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: OPEN_DURATION,
          easing: Easing.out(Easing.ease), // ease-out : démarre vite, ralentit
          useNativeDriver: true,
        }).start(() => {
          setPhase("live");
        });
      });
    });
  }, [slideAnim]);

  const close = useCallback(() => {
    setPhase("animating_out");
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: CLOSE_DURATION,
      easing: Easing.in(Easing.ease), // ease-in : démarre lent, accélère → sensation de contrôle
      useNativeDriver: true,
    }).start(() => {
      setPhase("idle");
      slideAnim.setValue(0);
    });
  }, [slideAnim]);

  const slideStyle = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 320], // slide out to the right
        }),
      },
    ],
  };

  return { open, close, phase, frozen, isAnimating, slideAnim, slideStyle };
}
