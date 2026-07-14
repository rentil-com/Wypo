import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 12,

    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 8,

    overflow: "hidden",
  },

  itemGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,

    flexShrink: 1,
    minWidth: 0,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,

    flexShrink: 1,
  },

  text: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },

  lastText: {
    fontSize: 14,
    color: "#176BDE",
    fontWeight: "700",
  },
});

