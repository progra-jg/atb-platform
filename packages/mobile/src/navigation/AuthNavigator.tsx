import { useState } from "react";
import { View, StyleSheet } from "react-native";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { colors } from "../theme";

export default function AuthNavigator() {
  const [screen, setScreen] = useState<"login" | "register">("login");

  return (
    <View style={styles.container}>
      {screen === "login" ? (
        <LoginScreen onSwitchToRegister={() => setScreen("register")} />
      ) : (
        <RegisterScreen onSwitchToLogin={() => setScreen("login")} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
