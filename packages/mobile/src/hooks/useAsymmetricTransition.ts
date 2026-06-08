import { useRef, useCallback, useEffect } from "react";
import { Animated, Easing, ViewStyle } from "react-native";

interface AsymmetricTransitionOptions {
  openDuration?: number;
  closeDuration?: number;
}

/**
 * AnimatedPanel gère l'asymétrie temporelle des transitions :
 *
 * - OUVERTURE : 220ms, ease-out → fluidité, contrôle perçu
 * - FERMETURE : 140ms, ease-in → réactivité instantanée, "reprise de contrôle"
 *
 * L'utilisateur perçoit une interface légère, même si le device rame.
 */
export function useAsymmetricTransition(opts?: AsymmetricTransitionOptions) {
  const openDur = opts?.openDuration ?? 220;
  const closeDur = opts?.closeDuration ?? 140;
  const anim = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const open = useCallback(() => {
    if (isOpen.current) return;
    isOpen.current = true;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: openDur,
      easing: Easing.out(Easing.ease), // ease-out : départ rapide, fin lente
      useNativeDriver: true,
    }).start();
  }, [anim, openDur]);

  const close = useCallback(() => {
    if (!isOpen.current) return;
    isOpen.current = false;
    Animated.timing(anim, {
      toValue: 0,
      duration: closeDur,
      easing: Easing.in(Easing.ease), // ease-in : départ lent, fin rapide
      useNativeDriver: true,
    }).start();
  }, [anim, closeDur]);

  const toggle = useCallback(() => {
    if (isOpen.current) close();
    else open();
  }, [open, close]);

  return {
    anim,
    isOpen,
    open,
    close,
    toggle,
    /** Style à appliquer sur le conteneur animé */
    getStyle: (fromScale = 0.95): Animated.WithAnimatedObject<ViewStyle> => ({
      opacity: anim,
      transform: [
        { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [fromScale, 1] }) },
      ],
    }),
  };
}
