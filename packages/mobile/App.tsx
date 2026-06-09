import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./src/theme";
import { PerformanceProvider } from "./src/contexts/PerformanceContext";
import { PreRenderProvider } from "./src/contexts/PreRenderContext";
import "./src/i18n";
import AppNavigator from "./src/navigation/AppNavigator";
import { useAuthStore } from "./src/store/authStore";
import { startPeriodicSync, processPendingActions } from "./src/storage/sync";
import { registerForPushNotifications } from "./src/services/notifications";
import { useNetworkMonitor, useNetworkStatus } from "./src/utils/network";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 60000 } },
});

function SyncOnReconnect() {
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (isOnline) processPendingActions();
  }, [isOnline]);

  return null;
}

export default function App() {
  const { isLoading, hydrate } = useAuthStore();

  useNetworkMonitor();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    const stopSync = startPeriodicSync(1800000);
    registerForPushNotifications().catch(() => {});
    return stopSync;
  }, []);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PerformanceProvider>
          <PreRenderProvider>
            <QueryClientProvider client={queryClient}>
              <StatusBar style="auto" />
              <SyncOnReconnect />
              <AppNavigator />
            </QueryClientProvider>
          </PreRenderProvider>
        </PerformanceProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
