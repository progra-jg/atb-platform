import { useState, useRef, useCallback } from "react";
import { Audio } from "expo-av";

interface VoiceRecordingResult {
  uri: string;
  durationMs: number;
  timestamp: string;
}

export function useVoiceRecording() {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [lastRecording, setLastRecording] = useState<VoiceRecordingResult | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { return "permission_denied"; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = rec;
      setRecording(true);
      return "started";
    } catch { return "error"; }
  }, []);

  const stopRecording = useCallback(async (): Promise<VoiceRecordingResult | null> => {
    if (!recordingRef.current) return null;
    try {
      const rec = recordingRef.current;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI() || "";
      const durationMs = (await rec.getStatusAsync()).durationMillis || 0;
      const result = { uri, durationMs, timestamp: new Date().toISOString() };
      setLastRecording(result);
      setRecording(false);
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      return result;
    } catch { setRecording(false); return null; }
  }, []);

  const playRecording = useCallback(async (uri: string) => {
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); }
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying) { setPlaying(false); }
      });
      await sound.playAsync();
    } catch { setPlaying(false); }
  }, []);

  const stopPlayback = useCallback(async () => {
    if (soundRef.current) { await soundRef.current.stopAsync(); setPlaying(false); }
  }, []);

  return { recording, playing, lastRecording, startRecording, stopRecording, playRecording, stopPlayback };
}
