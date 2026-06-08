import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";
import { colors } from "../theme";

export default function ScanScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission, requestPermission]);

  const handleScan = (data: string) => {
    Alert.alert(t("scan.result"), data);
  };

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Autorisation caméra requise</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={(e) => handleScan(e.data)}>
        <View style={styles.overlay}>
          <View style={styles.frame} />
          <Text style={styles.instruction}>{t("scan.instruction")}</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  frame: { width: 240, height: 240, borderWidth: 2, borderColor: colors.primary, borderRadius: 16, opacity: 0.8 },
  instruction: { color: colors.white, fontSize: 14, marginTop: 24, textAlign: "center", opacity: 0.8 },
  permissionText: { color: colors.text, fontSize: 16, textAlign: "center", padding: 24 },
});
