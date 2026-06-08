import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

type NetworkCallback = (isConnected: boolean) => void;

let listeners: NetworkCallback[] = [];
let _isConnected = false;

function notifyAll(connected: boolean) {
  _isConnected = connected;
  for (const cb of listeners) cb(connected);
}

export function useNetworkStatus(): boolean {
  const [connected, setConnected] = useState(_isConnected);

  useEffect(() => {
    const cb: NetworkCallback = (c) => setConnected(c);
    listeners.push(cb);
    return () => { listeners = listeners.filter(l => l !== cb); };
  }, []);

  return connected;
}

export function setNetworkStatus(connected: boolean): void {
  notifyAll(connected);
}

export function isOnline(): boolean {
  return _isConnected;
}

export function useNetworkMonitor(): void {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const check = async () => {
      try {
        const resp = await fetch("https://clients3.google.com/generate_204", { method: "HEAD", cache: "no-store" });
        notifyAll(resp.ok);
      } catch {
        notifyAll(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === "active") check();
      appState.current = next;
    });
    return () => { clearInterval(interval); sub.remove(); };
  }, []);
}
