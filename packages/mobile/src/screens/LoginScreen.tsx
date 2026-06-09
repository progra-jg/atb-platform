import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";
import Button from "../components/Button";

interface Props {
  onSwitchToRegister: () => void;
}

export default function LoginScreen({ onSwitchToRegister }: Props) {
  const { t } = useTranslation();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      const { login } = await import("../services/auth");
      const res = await login(email, password);
      await setAuth(res.user, res.token);
    } catch {
      Alert.alert("Erreur", "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Text style={styles.logo}>🌾</Text>
        <Text style={styles.title}>ATB AgriTrace</Text>
        <Text style={styles.subtitle}>Connectez-vous à votre espace</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.com"
          placeholderTextColor={colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.textTertiary}
          secureTextEntry
        />

        <Button title="Se connecter" onPress={handleLogin} loading={loading} size="lg" style={styles.button} />

        <TouchableOpacity onPress={onSwitchToRegister} style={styles.linkContainer}>
          <Text style={styles.link}>Pas encore de compte ? <Text style={styles.linkBold}>Créer un compte</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  form: { paddingHorizontal: 24 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 16, height: 48, fontSize: 15, color: colors.text,
  },
  button: { marginTop: 28 },
  linkContainer: { alignItems: "center", marginTop: 20 },
  link: { fontSize: 14, color: colors.textSecondary },
  linkBold: { color: colors.primary, fontWeight: "600" },
});
