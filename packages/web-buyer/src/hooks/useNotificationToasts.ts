import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications } from "../services/notifications";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL = 15000;

export function useNotificationToasts() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const knownIdsRef = useRef<Set<string | number>>(new Set());
  const mountedRef = useRef(true);

  const poll = useCallback(async () => {
    if (!user) return;
    try {
      const items = await fetchNotifications();
      if (!mountedRef.current) return;

      const currentIds = new Set(items.map((n) => n.id));

      for (const n of items) {
        if (n.unread && !knownIdsRef.current.has(n.id)) {
          const lotMatch = n.desc.match(/([A-Za-z]{3}[-][\dA-Za-z-]+)/);
          toast.info(n.title, n.desc, lotMatch
            ? { label: "Voir le lot", onClick: () => navigate(`/lots/${lotMatch[1]}`) }
            : undefined,
          );
        }
      }

      knownIdsRef.current = currentIds;
    } catch { /* silent */ }
  }, [user, toast, navigate]);

  useEffect(() => {
    if (!user) {
      knownIdsRef.current.clear();
      return;
    }
    mountedRef.current = true;
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [poll, user]);
}
