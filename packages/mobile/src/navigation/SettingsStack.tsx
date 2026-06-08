import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme";
import SettingsScreen from "../screens/SettingsScreen";
import ComponentCatalogScreen from "../screens/ComponentCatalogScreen";

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: "700", fontSize: 17, color: colors.text },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ComponentCatalog" component={ComponentCatalogScreen} options={{ title: "🧩 Composants" }} />
    </Stack.Navigator>
  );
}
