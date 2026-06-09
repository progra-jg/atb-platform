import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";
import { useAuthStore } from "../store/authStore";
import Button from "../components/Button";
import type { UserRole } from "../types";

const ROLES: { key: UserRole; icon: string }[] = [
  { key: "producteur", icon: "🌾" },
  { key: "acheteur", icon: "🏪" },
  { key: "transporteur", icon: "🚛" },
  { key: "intermediaire", icon: "🤝" },
  { key: "agent", icon: "👤" },
];

interface Props {
  onSwitchToLogin: () => void;
}

export default function RegisterScreen({ onSwitchToLogin }: Props) {
  const { t } = useTranslation();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<"role" | "form">("role");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setStep("form");
  };

  const handleRegister = async () => {
    if (!email || !password || !company || !country || !phone) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit faire au moins 6 caractères");
      return;
    }
    setLoading(true);
    try {
      const { register } = await import("../services/auth");
      const res = await register({ email, password, company, country, role: selectedRole! });
      await setAuth(res.user, res.token);
    } catch {
      Alert.alert("Erreur", "L'inscription a échoué. Vérifiez vos informations.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "role") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>🌾</Text>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Choisissez votre profil</Text>
        </View>
        <View style={styles.roleGrid}>
          {ROLES.map((r) => (
            <TouchableOpacity key={r.key} style={styles.roleCard} onPress={() => handleSelectRole(r.key)} activeOpacity={0.7}>
              <Text style={styles.roleIcon}>{r.icon}</Text>
              <Text style={styles.roleName}>{t(`role.${r.key}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={onSwitchToLogin} style={styles.linkContainer}>
          <Text style={styles.link}>Déjà un compte ? <Text style={styles.linkBold}>Se connecter</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>🌾</Text>
          <Text style={styles.title}>{t(`role.${selectedRole}`)}</Text>
          <Text style={styles.subtitle}>Complétez votre profil</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="votre@email.com" placeholderTextColor={colors.textTertiary} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={colors.textTertiary} secureTextEntry />

          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" placeholderTextColor={colors.textTertiary} secureTextEntry />

          <Text style={styles.label}>Entreprise / Organisation</Text>
          <TextInput style={styles.input} value={company} onChangeText={setCompany} placeholder="Nom de votre structure" placeholderTextColor={colors.textTertiary} />

          <Text style={styles.label}>Pays</Text>
          <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Bénin, Côte d'Ivoire, Togo..." placeholderTextColor={colors.textTertiary} />

          <Text style={styles.label}>Téléphone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+229 XX XX XX XX" placeholderTextColor={colors.textTertiary} keyboardType="phone-pad" />

          <Button title="Créer mon compte" onPress={handleRegister} loading={loading} size="lg" style={styles.button} />

          <TouchableOpacity onPress={() => setStep("role")} style={styles.linkContainer}>
            <Text style={styles.link}>Changer de rôle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingBottom: 40 },
  header: { alignItems: "center", marginTop: 40, marginBottom: 32 },
  logo: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, paddingHorizontal: 20 },
  roleCard: {
    width: "45%", backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    paddingVertical: 24, alignItems: "center", marginBottom: 8,
  },
  roleIcon: { fontSize: 40, marginBottom: 8 },
  roleName: { fontSize: 15, fontWeight: "600", color: colors.text },
  form: { paddingHorizontal: 24 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 16, height: 48, fontSize: 15, color: colors.text,
  },
  button: { marginTop: 24 },
  linkContainer: { alignItems: "center", marginTop: 16 },
  link: { fontSize: 14, color: colors.textSecondary },
  linkBold: { color: colors.primary, fontWeight: "600" },
});
