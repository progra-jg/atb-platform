import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import EmptyState from "../components/EmptyState";
import { useVoiceRecording } from "../hooks/useVoiceRecording";

export default function TalkieScreen() {
  const { t } = useTranslation();
  const voice = useVoiceRecording();
  const [messages, setMessages] = useState<any[]>([]);

  const toggleRecord = async () => {
    if (voice.recording) {
      const result = await voice.stopRecording();
      if (result) {
        const newMsg = { id: `m_${Date.now()}`, fromId: "me", uri: result.uri, durationSec: Math.round(result.durationMs / 1000), sentAt: new Date().toISOString(), lu: false };
        setMessages([newMsg, ...messages]);
      }
    } else {
      const status = await voice.startRecording();
      if (status === "permission_denied") Alert.alert("Permission", "Autorisez le microphone dans Paramètres");
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title={t("talkie.noMessages")} />}
        contentContainerStyle={messages.length === 0 ? { flex: 1, padding: 16 } : { padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.msgCard}>
            <Text style={styles.msgIcon}>🎤</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.msgDuration}>{item.durationSec}s</Text>
              <Text style={styles.msgTime}>{new Date(item.sentAt).toLocaleTimeString()}</Text>
            </View>
            <TouchableOpacity style={styles.playBtn} onPress={() => voice.playRecording(item.uri)}>
              <Text style={styles.playText}>▶</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.recordBtn, voice.recording && { backgroundColor: colors.error }]} onPress={toggleRecord}>
          <Text style={styles.recordBtnText}>{voice.recording ? "⬛" : "🎤"}</Text>
        </TouchableOpacity>
        <Text style={styles.recordHint}>{voice.recording ? t("talkie.stop") : t("talkie.holdToRecord")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  msgCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 14, borderRadius: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  msgIcon: { fontSize: 24, marginRight: 10 },
  msgDuration: { fontSize: 14, fontWeight: "600", color: colors.text },
  msgTime: { fontSize: 11, color: colors.textTertiary },
  playBtn: { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  playText: { color: colors.white, fontSize: 16 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  recordBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  recordBtnText: { fontSize: 24 },
  recordHint: { fontSize: 13, color: colors.textSecondary, flex: 1 },
});
