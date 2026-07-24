import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type FormScreenLayoutProps = PropsWithChildren<{
  contentContainerStyle: ScrollViewProps["contentContainerStyle"];
}>;

export default function FormScreenLayout({
  children,
  contentContainerStyle,
}: FormScreenLayoutProps) {
  return (
    <SafeAreaProvider style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },
});
