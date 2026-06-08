import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";
import { enqueueAction } from "../storage/offline";
import { useNetworkStatus } from "../utils/network";
import EmptyState from "../components/EmptyState";

interface Message {
  id: string;
  conversationId: string;
  from: string;
  fromNom: string;
  texte: string;
  date: string;
  lu: boolean;
}

interface Conversation {
  id: string;
  avec: string;
  avecNom: string;
  role: string;
  dernierMessage: string;
  date: string;
  nonLu: number;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "conv-001", avec: "user-002", avecNom: "Koffi Agbéko", role: "acheteur", dernierMessage: "Ok pour 180 FCFA/kg, je prends 2.5T", date: "2026-06-08T10:30", nonLu: 2 },
  { id: "conv-002", avec: "user-003", avecNom: "Olam Agri", role: "acheteur", dernierMessage: "Pouvez-vous livrer avant le 15 ?", date: "2026-06-07T14:15", nonLu: 0 },
  { id: "conv-003", avec: "user-004", avecNom: "Mamadou Koné", role: "transporteur", dernierMessage: "Je passe demain pour le chargement", date: "2026-06-06T09:45", nonLu: 1 },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "conv-001": [
    { id: "msg-001", conversationId: "conv-001", from: "user-002", fromNom: "Koffi Agbéko", texte: "Bonjour, je suis intéressé par votre lot de maïs blanc", date: "2026-06-07T08:00", lu: true },
    { id: "msg-002", conversationId: "conv-001", from: "current", fromNom: "Vous", texte: "Bonjour Koffi, oui disponible. Combien vous voulez ?", date: "2026-06-07T09:15", lu: true },
    { id: "msg-003", conversationId: "conv-001", from: "user-002", fromNom: "Koffi Agbéko", texte: "2.5 tonnes à 175 FCFA/kg ça vous va ?", date: "2026-06-08T08:30", lu: true },
    { id: "msg-004", conversationId: "conv-001", from: "current", fromNom: "Vous", texte: "Je peux faire 185 max, qualité supérieure", date: "2026-06-08T09:00", lu: true },
    { id: "msg-005", conversationId: "conv-001", from: "user-002", fromNom: "Koffi Agbéko", texte: "Ok pour 180 FCFA/kg, je prends 2.5T", date: "2026-06-08T10:30", lu: false },
    { id: "msg-006", conversationId: "conv-001", from: "user-002", fromNom: "Koffi Agbéko", texte: "On peut lancer la commande ?", date: "2026-06-08T10:31", lu: false },
  ],
  "conv-002": [
    { id: "msg-007", conversationId: "conv-002", from: "user-003", fromNom: "Olam Agri", texte: "Lot de soja disponible pour AO-2025-02 ?", date: "2026-06-05T11:00", lu: true },
    { id: "msg-008", conversationId: "conv-002", from: "current", fromNom: "Vous", texte: "Oui, 3 tonnes disponibles à 250 FCFA/kg", date: "2026-06-05T14:00", lu: true },
    { id: "msg-009", conversationId: "conv-002", from: "user-003", fromNom: "Olam Agri", texte: "Pouvez-vous livrer avant le 15 ?", date: "2026-06-07T14:15", lu: true },
  ],
  "conv-003": [
    { id: "msg-010", conversationId: "conv-003", from: "user-004", fromNom: "Mamadou Koné", texte: "Mission TR-2025-08 confirmée", date: "2026-06-05T07:00", lu: true },
    { id: "msg-011", conversationId: "conv-003", from: "current", fromNom: "Vous", texte: "Parfait, le lot est prêt à Covè", date: "2026-06-05T08:00", lu: true },
    { id: "msg-012", conversationId: "conv-003", from: "user-004", fromNom: "Mamadou Koné", texte: "Je passe demain pour le chargement", date: "2026-06-06T09:45", lu: false },
  ],
};

export default function InboxScreen() {
  const { user } = useAuthStore();
  const isOnline = useNetworkStatus();
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [newMsg, setNewMsg] = useState("");

  const activeMessages = activeConv ? messages[activeConv] || [] : [];
  const activeConvData = conversations.find(c => c.id === activeConv);

  const handleSend = () => {
    if (!newMsg.trim() || !activeConv || !user) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: activeConv,
      from: "current",
      fromNom: "Vous",
      texte: newMsg.trim(),
      date: new Date().toISOString(),
      lu: true,
    };
    setMessages(prev => ({ ...prev, [activeConv]: [...(prev[activeConv] || []), msg] }));
    setConversations(prev => prev.map(c => c.id === activeConv ? { ...c, dernierMessage: msg.texte, date: msg.date } : c));
    setNewMsg("");
    if (!isOnline) enqueueAction("inbox/send", { conversationId: activeConv, texte: msg.texte });
  };

  const handleOpenConv = (id: string) => {
    setActiveConv(id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, nonLu: 0 } : c));
    setMessages(prev => ({
      ...prev,
      [id]: (prev[id] || []).map(m => m.conversationId === id ? { ...m, lu: true } : m),
    }));
  };

  if (activeConv && activeConvData) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <View style={styles.convHeader}>
          <TouchableOpacity onPress={() => setActiveConv(null)}><Text style={styles.backBtn}>← Retour</Text></TouchableOpacity>
          <View>
            <Text style={styles.convNom}>{activeConvData.avecNom}</Text>
            <Text style={styles.convRole}>{activeConvData.role}</Text>
          </View>
        </View>

        <FlatList
          data={activeMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.from === "current" ? styles.bubbleMine : styles.bubbleOther]}>
              {item.from !== "current" && <Text style={styles.bubbleFrom}>{item.fromNom}</Text>}
              <Text style={styles.bubbleText}>{item.texte}</Text>
              <Text style={styles.bubbleTime}>{new Date(item.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</Text>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={newMsg} onChangeText={setNewMsg} placeholder="Votre message..." placeholderTextColor={colors.textTertiary} multiline />
          <TouchableOpacity style={[styles.sendBtn, !newMsg.trim() && { opacity: 0.4 }]} onPress={handleSend} disabled={!newMsg.trim()}>
            <Text style={styles.sendText}>📤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>📨 Messages</Text>
            <Text style={styles.sub}>{conversations.reduce((s, c) => s + c.nonLu, 0)} non lu(s)</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Aucune conversation" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.convCard} onPress={() => handleOpenConv(item.id)}>
            <View style={styles.convAvatar}>
              <Text style={styles.avatarText}>{item.avecNom.charAt(0)}</Text>
            </View>
            <View style={styles.convContent}>
              <View style={styles.convTop}>
                <Text style={styles.convName}>{item.avecNom}</Text>
                <Text style={styles.convDate}>{new Date(item.date).toLocaleDateString("fr-FR")}</Text>
              </View>
              <Text style={styles.convRoleLabel}>{item.role}</Text>
              <Text style={[styles.convLastMsg, item.nonLu > 0 && styles.convUnread]} numberOfLines={1}>{item.dernierMessage}</Text>
            </View>
            {item.nonLu > 0 && (
              <View style={styles.badgeLu}>
                <Text style={styles.badgeLuText}>{item.nonLu}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  convCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 12, borderRadius: 14, marginBottom: 8, gap: 10 },
  convAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + "30", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "700", color: colors.primary },
  convContent: { flex: 1 },
  convTop: { flexDirection: "row", justifyContent: "space-between" },
  convName: { fontSize: 15, fontWeight: "600", color: colors.text },
  convDate: { fontSize: 11, color: colors.textTertiary },
  convRoleLabel: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
  convLastMsg: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  convUnread: { fontWeight: "700", color: colors.text },
  badgeLu: { backgroundColor: colors.primary, borderRadius: 12, width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  badgeLuText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  convHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { fontSize: 15, fontWeight: "600", color: colors.primary },
  convNom: { fontSize: 16, fontWeight: "700", color: colors.text },
  convRole: { fontSize: 12, color: colors.textTertiary },
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 14, marginBottom: 6 },
  bubbleMine: { backgroundColor: colors.primary + "20", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.surfaceAlt, alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleFrom: { fontSize: 11, fontWeight: "600", color: colors.primary, marginBottom: 2 },
  bubbleText: { fontSize: 14, color: colors.text, lineHeight: 19 },
  bubbleTime: { fontSize: 10, color: colors.textTertiary, textAlign: "right", marginTop: 4 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, padding: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text, maxHeight: 80 },
  sendBtn: { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sendText: { fontSize: 18 },
});
