import { useState, useEffect, useRef } from "react";
import { fetchNotifications } from "../services/notifications";

export function useNotificationCount(pollInterval = 15000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const load = async () => {
      try {
        const items = await fetchNotifications();
        if (mountedRef.current) {
          setUnreadCount(items.filter((n) => n.unread).length);
        }
      } catch { /* silent */ }
    };
    load();
    const id = setInterval(load, pollInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [pollInterval]);

  return unreadCount;
}
