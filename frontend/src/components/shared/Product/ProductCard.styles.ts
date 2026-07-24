import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  productCard: {
    flex: 1,
    minHeight: 310,

    padding: 18,

    position: "relative",

    

    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.05,
    shadowRadius: 18,

    elevation: 4,
  },

  productLink: {
    flex: 1,
  },

  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 5,

    width: 36,
    height: 36,

    borderRadius: 18,
    backgroundColor: "#FFFFFF",

    alignItems: "center",
    justifyContent: "center",
  },

  adminActions: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  adminActionButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  editButton: {
    borderColor: "#BFDBFE",
  },

  deleteButton: {
    borderColor: "#FECACA",
    backgroundColor: "#FFF7F7",
  },

  productImageBox: {
    height: 150,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 14,
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    marginBottom: 4,

    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
  },

  productStatusBadge: {
    alignSelf: "flex-start",

    paddingHorizontal: 10,
    paddingVertical: 4,

    marginBottom: 8,

    borderRadius: 999,

    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  productStatusText: {
    fontSize: 12,
    fontWeight: "800",
  },

  productDescription: {
    minHeight: 36,

    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },

  productBottom: {
    marginTop: 16,

    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  productPrice: {
    marginBottom: 8,

    fontSize: 19,
    fontWeight: "900",
    color: "#111827",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  addButton: {
    width: 42,
    height: 42,

    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#176BDE",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",
  },
});
