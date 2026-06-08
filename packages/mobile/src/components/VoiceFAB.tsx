import { useRef } from "react";
import { TouchableOpacity, Animated, Text, StyleSheet, View } from "react-native";
import { colors, radii, shadows } from "../theme";
import { useVoiceRecording } from "../hooks/useVoiceRecording";

interface VoiceFABProps {
  onResult?: (uri: string, durationMs: number) => void;
}

export default function VoiceFAB({ onResult }: VoiceFABProps) {
  const voice = useVoiceRecording();
  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => Animated.spring(scale, { toValue: 1.15, useNativeDriver: true }).start();
  const animateOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const handlePress = async () => {
    if (voice.recording) {
      const result = await voice.stopRecording();
      animateOut();
      if (result && onResult) onResult(result.uri, result.durationMs);
    } else {
      animateIn();
      await voice.startRecording();
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.fab, voice.recording && styles.fabRecording]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.inner, { transform: [{ scale }] }]}>
          <Text style={styles.icon}>{voice.recording ? "⬛" : "🎤"}</Text>
        </Animated.View>
      </TouchableOpacity>
      {voice.recording && (
        <View style={styles.pulse}>
          <Text style={styles.pulseText}>🔴 Enregistrement...</Text>
        </View>
      )}
    </View>
  );
}

const FAB_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80,
    right: 16,
    alignItems: "flex-end",
    zIndex: 999,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
  },
  fabRecording: {
    backgroundColor: colors.error,
  },
  inner: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 28,
  },
  pulse: {
    backgroundColor: colors.error + "E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  pulseText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
});
