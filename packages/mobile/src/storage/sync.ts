import { dequeueActions, removeAction, cacheSet } from "./offline";
import api from "../services/api";

export const processPendingActions = async (): Promise<void> => {
  const actions = await dequeueActions();
  for (const a of actions) {
    try {
      await api.post(`/sync/${a.action}`, a.payload);
      await removeAction(a.id);
    } catch {
      break;
    }
  }
};

export const startPeriodicSync = (intervalMs = 1800000): (() => void) => {
  const id = setInterval(() => { processPendingActions(); }, intervalMs);
  return () => clearInterval(id);
};
