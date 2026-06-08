import { View } from "react-native";

interface SpacerProps {
  size?: number;
  horizontal?: boolean;
}

export default function Spacer({ size = 16, horizontal }: SpacerProps) {
  return <View style={horizontal ? { width: size } : { height: size }} />;
}
