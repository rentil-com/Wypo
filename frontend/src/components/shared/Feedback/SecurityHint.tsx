import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

type SecurityHintProps = {
  containerStyle?: StyleProp<ViewStyle>;
  messages: ReactNode[];
  textStyle?: StyleProp<TextStyle>;
};

export default function SecurityHint({
  containerStyle,
  messages,
  textStyle,
}: SecurityHintProps) {
  return (
    <View style={containerStyle}>
      <Ionicons name="time-outline" size={16} color="#7B88A4" />
      {messages.map((message, index) => (
        <Text key={index} style={textStyle}>
          {message}
        </Text>
      ))}
    </View>
  );
}
