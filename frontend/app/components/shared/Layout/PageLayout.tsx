import type { ReactNode } from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import HeaderPanel from "../Header/HeaderPanel";

type PageLayoutProps = {
  children: ReactNode;
  wide?: boolean;
};

export default function PageLayout({
  children,
  wide = false,
}: PageLayoutProps) {
  return (
    <View
      style={[
        styles.screen,
        wide && styles.screenWide,
      ]}
    >
      <ScrollView
        style={[
          styles.scroll,
          wide && styles.scrollWide,
        ]}
        contentContainerStyle={[
          styles.scrollContent,
          wide && styles.scrollContentWide,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.page,
            wide && styles.pageWide,
          ]}
        >
          <HeaderPanel />

          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 24,
    paddingBottom: 60,
  },

  page: {
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },

  screenWide: {
    backgroundColor: "#F4F7FC",
  },

  scrollWide: {
    backgroundColor: "#F4F7FC",
  },

  scrollContentWide: {
    paddingTop: 0,
    paddingBottom: 34,
  },

  pageWide: {
    maxWidth: 1920,
    paddingTop: 16,
    paddingHorizontal: 40,
    paddingBottom: 0,
  },
});