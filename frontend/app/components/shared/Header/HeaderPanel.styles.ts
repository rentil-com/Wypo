import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    header: {
    width: "100%",
    minHeight: 72,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    zIndex : 200,
    position : "relative",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  searchBar: {
    position : "relative",
    flex: 1,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex : 100,
  },
   searchText: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#111827",
    outlineStyle: "none" as any,
  },
  suggestionsPanel: {
  position: "absolute",
  top: 68,
  left: 0,
  right: 0,
  zIndex: 300,

  backgroundColor: "#F8FBFF",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#D7E8F7",
  paddingVertical: 6,

  shadowColor: "#176B87",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 8,
  elevation: 12,
  overflow: "hidden",
},
suggestionItem: {
  flexDirection: "row",
  alignItems: "center",
  minHeight: 64,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderBottomWidth: 1,
  borderBottomColor: "#E4EFF7",
},

suggestionImage: {
  width: 46,
  height: 46,
  borderRadius: 8,
  marginRight: 12,
  backgroundColor: "#EAF2F7",
},

suggestionInfo: {
  flex: 1,
},

suggestionName: {
  color: "#163A4A",
  fontSize: 14,
  fontWeight: "600",
},

suggestionPrice: {
  marginTop: 4,
  color: "#16849B",
  fontSize: 13,
  fontWeight : "700"
},
categoryContainer: {
  position: "relative",
  zIndex: 5000,
  overflow: "visible",
},

categoryWrapper: {
  position: "relative",
  zIndex: 5000,
  overflow: "visible",
},
categoryPanelPositioner: {
  position: "absolute",
  top: "100%",
  left: -220,
  paddingTop: 12,
  zIndex: 9999,
  elevation: 30,
},
categoryPanel: {
  width: 760,
  backgroundColor: "#FFFFFF",

  borderRadius: 18,
  borderWidth: 1,
  borderColor: "#DFE8F5",

  padding: 20,

  shadowColor: "#0F172A",
  shadowOffset: {
    width: 0,
    height: 12,
  },
  shadowOpacity: 0.14,
  shadowRadius: 28,

  elevation: 25,
  zIndex: 9999,
  overflow: "hidden",
},
categoryGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  columnGap: 12,
  rowGap: 12,
},

panelCategoryItem: {
  width: "32%",
  minHeight: 76,

  flexDirection: "row",
  alignItems: "center",

  paddingVertical: 13,
  paddingHorizontal: 14,

  backgroundColor: "#F8FAFE",

  borderRadius: 13,
  borderWidth: 1,
  borderColor: "#E7EDF6",
},
panelCategoryItemActive: {
  backgroundColor: "#FFFFFF",
},
panelCategoryIcon: {
  width: 42,
  height: 42,

  borderRadius: 12,
  backgroundColor: "#EAF2FF",

  alignItems: "center",
  justifyContent: "center",

  marginRight: 12,
},

panelCategoryIconActive: {
  backgroundColor: "#FFFFFF",
},
categoryTextContainer: {
  flex: 1,
  minWidth: 0,
},
panelCategoryName: {
  color: "#172033",
  fontSize: 14,
  fontWeight: "800",
  lineHeight: 19,
},

panelCategoryNameActive: {
  color: "#176BDE",
},

categoryDescription: {
  color: "#8190A5",
  fontSize: 11,
  fontWeight: "500",
  lineHeight: 16,
  marginTop: 3,
},
 headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
  },

  headerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },


  headerActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  
  logo: {
  width: 52,
  height: 52,
  zIndex: 1,

  },
  headerSideActions : {
    display : "flex",
    alignItems : "center",
    gap : 5,
    marginLeft : "auto",
  },
  headerInfo : {
    display : "flex",
    flexDirection : "column",
    gap : 5,
    minWidth : 0,
  },
  headerInfoText : {
    margin : 0,
    color : "#1f2937",
    fontSize : 17,
    lineHeight : 1.4,
  }
})