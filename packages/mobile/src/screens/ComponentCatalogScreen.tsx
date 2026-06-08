import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Switch } from "react-native";
import { colors, typography, useTheme } from "../theme";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import { SkeletonCard } from "../components/Skeleton";
import Divider from "../components/Divider";
import Spacer from "../components/Spacer";
import EmptyState from "../components/EmptyState";
import ThumbButton from "../components/ThumbButton";

const SECTIONS: { title: string; component: React.ReactNode }[] = [];

export default function ComponentCatalogScreen() {
  const { isDark, toggleTheme } = useTheme();
  const [btnLoading, setBtnLoading] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Theme Toggle */}
      <Card style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Theme</Text>
        <View style={styles.themeRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Dark Mode</Text>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>
      </Card>

      {/* Typography */}
      <Card style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Typography</Text>
        <Text style={[typography.h1, { color: colors.text }]}>H1 — Titre principal</Text>
        <Text style={[typography.h2, { color: colors.text }]}>H2 — Section</Text>
        <Text style={[typography.h3, { color: colors.text }]}>H3 — Sous-section</Text>
        <Text style={[typography.body, { color: colors.text }]}>Body — Lorem ipsum dolor sit amet</Text>
        <Text style={[typography.bodyBold, { color: colors.text }]}>Body Bold — Important</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Caption — Notes secondaires</Text>
        <Text style={[typography.micro, { color: colors.textTertiary }]}>Micro — Timestamps, tags</Text>
        <Text style={[typography.price, { color: colors.primary }]}>Price — 1 500 CFA</Text>
        <Divider />
        <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 4 }]}>Label prédéfini (preset=)</Text>
        <Text style={[{ fontSize: typography.body.fontSize, fontWeight: "400", lineHeight: 22, color: colors.text }]} />
      </Card>

      {/* Button variants */}
      <Card style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Button</Text>
        <Button title="Primary" onPress={() => {}} />
        <Spacer size={8} />
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
        <Spacer size={8} />
        <Button title="Outline" variant="outline" onPress={() => {}} />
        <Spacer size={8} />
        <Button title="Ghost" variant="ghost" onPress={() => {}} />
        <Spacer size={8} />
        <Button title="Danger" variant="danger" onPress={() => {}} />
        <Spacer size={8} />
        <Button title="Loading" loading={btnLoading} onPress={() => { setBtnLoading(true); setTimeout(() => setBtnLoading(false), 1500); }} />
        <Spacer size={8} />
        <Button title="Small" size="sm" onPress={() => {}} />
      </Card>

      {/* Badge */}
      <Card style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Badge</Text>
        <View style={styles.badgeRow}>
          <Badge label="Disponible" color={colors.success} />
          <Badge label="En cours" color={colors.warning} />
          <Badge label="Terminé" color={colors.primary} />
          <Badge label="Erreur" color={colors.error} />
        </View>
        <Spacer size={8} />
        <Badge label="Avec icône 🏆" color={colors.accent} />
      </Card>

      {/* Card */}
      <Card style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Card</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Ceci est une Card. Elle a des coins arrondis, une ombre standardisée, et s'adapte au thème.
        </Text>
      </Card>

      {/* Card with onPress */}
      <Card onPress={() => {}} style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Card cliquable</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Appuyez pour voir l'effet</Text>
      </Card>

      {/* ThumbButton */}
      <Card style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>ThumbButton</Text>
        <ThumbButton title="Primary (90%)" onPress={() => {}} />
        <Spacer size={8} />
        <ThumbButton title="Secondary" variant="secondary" onPress={() => {}} />
        <Spacer size={8} />
        <ThumbButton title="Danger" variant="danger" onPress={() => {}} />
      </Card>

      {/* Skeleton */}
      <Card style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Skeleton</Text>
        <SkeletonCard />
      </Card>

      {/* EmptyState */}
      <Card style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>EmptyState</Text>
        <EmptyState icon="📭" title="Aucun élément" subtitle="Il n'y a rien à afficher ici." />
      </Card>

      {/* Divider + Spacer */}
      <Card style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Divider / Spacer</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Au-dessus du divider</Text>
        <Divider />
        <Text style={[typography.caption, { color: colors.textSecondary }]}>En-dessous</Text>
      </Card>

      {/* Colors swatch */}
      <Card style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Color Tokens</Text>
        {[
          ["primary", colors.primary],
          ["secondary", colors.secondary],
          ["accent", colors.accent],
          ["error", colors.error],
          ["success", colors.success],
          ["warning", colors.warning],
          ["background", colors.background],
          ["surface", colors.surface],
          ["surfaceAlt", colors.surfaceAlt],
          ["text", colors.text],
          ["textSecondary", colors.textSecondary],
          ["border", colors.border],
        ].map(([name, color]) => (
          <View key={name} style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: color as string }]} />
            <Text style={[typography.caption, { color: colors.text, flex: 1 }]}>{name}</Text>
            <Text style={[typography.micro, { color: colors.textTertiary }]}>{color}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 12 },
  section: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "500" },
  themeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  swatchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  swatch: { width: 20, height: 20, borderRadius: 4, borderWidth: 0.5, borderColor: colors.border },
});
