import { useState, useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";

interface ProgressiveItem {
  key: string;
  /** Composant statique affiché immédiatement (informatif) */
  static: React.ReactNode;
  /** Composant interactif hydraté après délai */
  interactive: React.ReactNode;
  /** Délai avant hydratation (défaut 200ms) */
  delay?: number;
}

interface ProgressiveLayoutProps {
  items: ProgressiveItem[];
  style?: ViewStyle;
}

/**
 * Progressive Interactive Design.
 * Affiche d'abord le rendu statique (léger), puis hydrate
 * les éléments interactifs (Talkie, voice guide) après 200ms.
 * L'utilisateur perçoit une interface instantanée, pas de saccades.
 */
export default function ProgressiveLayout({ items, style }: ProgressiveLayoutProps) {
  const [hydrated, setHydrated] = useState<Set<string>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    items.forEach((item) => {
      const timer = setTimeout(() => {
        setHydrated((prev) => new Set(prev).add(item.key));
      }, item.delay ?? 200);
      timers.current.push(timer);
    });
    return () => timers.current.forEach(clearTimeout);
  }, [items]);

  return (
    <View style={style}>
      {items.map((item) => (
        <View key={item.key}>
          {item.static}
          {hydrated.has(item.key) && item.interactive}
        </View>
      ))}
    </View>
  );
}
