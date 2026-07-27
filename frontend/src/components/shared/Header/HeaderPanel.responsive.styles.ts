import { StyleSheet } from "react-native";

export const responsiveStyles = StyleSheet.create({
  searchArea: {
    position: "relative",
    zIndex: 300,
  },
  searchAreaDesktop: {
    flex: 1,
    minWidth: 240,
    height: 52,
    flexShrink: 0,
    marginVertical: 2,
  },
  searchAreaMobile: {
    width: "100%",
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
    marginVertical: 2,
  },
  searchBarDesktop: {
    width: "100%",
    minHeight: 52,
    height: 52,
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 20,
  },
  searchBarMobile: {
    width: "100%",
    minHeight: 48,
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 16,
  },
  suggestionsPanelMobile: {
    top: 56,
  },
  headerMobile: {
    minHeight: 0,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    flexDirection: "column",
    alignItems: "stretch",
  },
  mobileTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  logoMobile: {
    width: 76,
    height: 40,
  },
  headerActionsMobile: {
    marginLeft: "auto",
    gap: 7,
  },
  mobileHeaderAction: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  mobileNavigation: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
  },
  mobileNavigationItem: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE8F8",
    backgroundColor: "#F8FBFF",
  },
  mobileNavigationText: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "700",
  },
});
