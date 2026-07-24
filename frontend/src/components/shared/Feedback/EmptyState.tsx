import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type EmptyStateProps = {
  cardStyle?: StyleProp<ViewStyle>;
  description?: ReactNode;
  descriptionStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  iconContainerStyle?: StyleProp<ViewStyle>;
  iconName: ComponentProps<typeof Ionicons>["name"];
  iconSize?: number;
  screenStyle?: StyleProp<ViewStyle>;
  title: ReactNode;
  titleStyle?: StyleProp<TextStyle>;
};

export default function EmptyState({
  cardStyle,
  description,
  descriptionStyle,
  iconColor = "#2563EB",
  iconContainerStyle,
  iconName,
  iconSize = 30,
  screenStyle,
  title,
  titleStyle,
}: EmptyStateProps) {
  return (
    <SafeAreaView style={screenStyle}>
      <View style={cardStyle}>
        <View style={iconContainerStyle}>
          <Ionicons name={iconName} size={iconSize} color={iconColor} />
        </View>
        <Text style={titleStyle}>{title}</Text>
        {description && (
          <Text style={descriptionStyle}>{description}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
