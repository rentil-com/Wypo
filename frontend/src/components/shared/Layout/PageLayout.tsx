import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import HeaderPanel from "../Header/HeaderPanel";

type PageLayoutProps = {
  children: ReactNode;
  wide?: boolean;
  scrollToTopKey?: number;
};

export default function PageLayout({
  children,
  wide = false,
  scrollToTopKey = 0,
}: PageLayoutProps) {
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollToTopKey > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [scrollToTopKey]);

  return (
    <View
      style={[
        styles.screen,
        wide && styles.screenWide,
      ]}
    >
      <ScrollView
        ref={scrollRef}
        style={[
          styles.scroll,
          wide && styles.scrollWide,
        ]}
        contentContainerStyle={[
          styles.scrollContent,
          wide && styles.scrollContentWide,
          mobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.page,
            wide && styles.pageWide,
            mobile && styles.pageMobile,
            wide && mobile && styles.pageWideMobile,
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

  scrollContentMobile: {
    paddingTop: 12,
    paddingBottom: 36,
  },

  pageMobile: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  pageWideMobile: {
    paddingTop: 0,
    paddingHorizontal: 14,
  },
});
