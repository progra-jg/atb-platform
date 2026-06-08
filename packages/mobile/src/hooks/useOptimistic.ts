import { useState, useCallback, useRef } from "react";

type PendingAction<T> = {
  id: string;
  item: T;
  rollback: () => void;
  createdAt: number;
};

/**
 * useOptimistic hook
 *
 * Permet de mettre à jour l'UI instantanément (avant confirmation serveur)
 * et de rollback silencieusement en cas d'échec.
 *
 * Principe "Like Facebook" : l'utilisateur voit le résultat tout de suite.
 * Si la synchro échoue, l'interface revient en arrière sans perturbation.
 */
export function useOptimistic<T extends { id: string }>(initial: T[] = []) {
  const [items, setItems] = useState<T[]>(initial);
  const pendingRef = useRef<PendingAction<T>[]>([]);

  /**
   * Ajoute un élément à la liste immédiatement.
   * Retourne une fonction de rollback à appeler si l'opération échoue.
   */
  const add = useCallback((item: T, syncAction?: () => Promise<void>): (() => void) => {
    setItems((prev) => [item, ...prev]);

    const rollback = () => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      pendingRef.current = pendingRef.current.filter((p) => p.id !== item.id);
    };

    const pending: PendingAction<T> = {
      id: item.id,
      item,
      rollback,
      createdAt: Date.now(),
    };

    pendingRef.current.push(pending);

    if (syncAction) {
      syncAction().catch(() => {
        rollback();
      });
    }

    return rollback;
  }, []);

  /**
   * Met à jour un élément immédiatement.
   * Rollback restore l'état précédent.
   */
  const update = useCallback((id: string, updater: (prev: T) => T, syncAction?: () => Promise<void>): (() => void) => {
    let previous: T | undefined;

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      previous = prev[idx];
      const next = [...prev];
      next[idx] = updater(prev[idx]);
      return next;
    });

    const rollback = () => {
      if (previous) {
        setItems((prev) => prev.map((i) => (i.id === id ? previous! : i)));
      }
    };

    if (syncAction) {
      syncAction().catch(() => {
        rollback();
      });
    }

    return rollback;
  }, []);

  /**
   * Supprime un élément immédiatement.
   * Rollback le réinsère à sa position.
   */
  const remove = useCallback((id: string, syncAction?: () => Promise<void>): (() => void) => {
    let removed: T | undefined;
    let removedIndex = -1;

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      removed = prev[idx];
      removedIndex = idx;
      return prev.filter((i) => i.id !== id);
    });

    const rollback = () => {
      if (removed) {
        setItems((prev) => {
          const next = [...prev];
          next.splice(removedIndex, 0, removed!);
          return next;
        });
      }
    };

    if (syncAction) {
      syncAction().catch(() => {
        rollback();
      });
    }

    return rollback;
  }, []);

  /** Remplace toute la liste (pour sync initial) */
  const replaceAll = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  return { items, add, update, remove, replaceAll, pending: pendingRef.current };
}
