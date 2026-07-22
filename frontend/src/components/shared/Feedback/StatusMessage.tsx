import { Ionicons } from "@expo/vector-icons";
import {
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

type StatusMessageProps = {
  containerStyle?: StyleProp<ViewStyle>;
  message?: string | null;
  showIcon?: boolean;
  textStyle?: StyleProp<TextStyle>;
};

export default function StatusMessage({
  containerStyle,
  message,
  showIcon = false,
  textStyle,
}: StatusMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <View style={containerStyle}>
      {showIcon && (
        <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
      )}
      <Text style={textStyle}>{message}</Text>
    </View>
  );
}
