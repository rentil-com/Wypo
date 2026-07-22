import type { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";

type LoadingButtonProps = {
  icon: ReactNode;
  label: string;
  loading: boolean;
  loadingText: string;
  onPress: NonNullable<TouchableOpacityProps["onPress"]>;
};

export default function LoadingButton({
  icon,
  label,
  loading,
  loadingText,
  onPress,
}: LoadingButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.sendButton,
        loading && styles.sendButtonDisabled,
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.sendButtonText}>{loadingText}</Text>
        </>
      ) : (
        <>
          {icon}
          <Text style={styles.sendButtonText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sendButton: {
    width: "100%",
    height: 62,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#2563EB",
    marginTop: 20,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 11,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
});
