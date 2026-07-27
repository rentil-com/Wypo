import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },
  errorText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#EF4444",
    padding: 32,
  },
  adminToolbar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  adminBadgeText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "900",
  },
  adminToolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editProductButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  editProductButtonText: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "800",
  },
  cancelEditButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 16,
  },
  cancelEditButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
  },
  saveProductButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: "#176BDE",
    paddingHorizontal: 16,
  },
  saveProductButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  adminErrorText: {
    width: "100%",
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 14,
  },


  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },

  sideheaderAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  sideheaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  headerDivider: {
    width: 1,
    height: 42,
    backgroundColor: "#E2E8F0",
  },

  /* SCIEZKA KATEGORII */

  category_path: {
    marginTop: 28,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    overflow: "hidden",
    gap: 8,
  },

  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    zIndex : 1,
    position : "relative",
  },

  breadcrumbText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },

  breadcrumbLast: {
    fontSize: 14,
    color: "#176BDE",
    fontWeight: "700",
  },

  /* MAIN PRODUCT SECTION */

  productSection: {
    width: "100%",
    flexDirection: "row",
    gap: 24,
    alignItems: "stretch",
    position : "relative",
    zIndex : 1,
  },

  /* LEFT GALLERY */

  galleryCard: {
    flex: 1.65,
    minHeight: 720,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 28,
    position: "relative",

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 5,
  },
  galleryEditActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 100,
  },
  addImageButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
  },
  addImageButtonText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "800",
  },
  deleteImageButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF7F7",
    paddingHorizontal: 14,
  },
  deleteImageButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "800",
  },

  imageCounter: {
    position: "absolute",
    top: 26,
    right: 28,
    zIndex: 10,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  imageCounterText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748B",
  },

  mainImageBox: {
    flex: 1,
    minHeight: 540,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 60,
    paddingTop: 35,
    paddingBottom: 20,
  },

  mainProductImage: {
    width: "100%",
    height: "100%",
    maxHeight: 540,
  },
  emptyGalleryText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "700",
  },

  thumbnailRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 12,
  },

  thumbnailBox: {
    flex: 1,
    height: 96,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },

  thumbnailBoxActive: {
    borderWidth: 2,
    borderColor: "#176BDE",
    backgroundColor: "#F8FBFF",
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  newImagesSection: {
    marginTop: 18,
  },
  newImagesTitle: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
  },

  galleryArrow: {
    position: "absolute",
    top: "48%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  galleryArrowLeft: {
    left: 28,
  },

  galleryArrowRight: {
    right: 28,
  },

  /* PRAWA STRONA - SZCZEGOLY */

  productStatusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },

  productStatusText: {
    fontSize: 12,
    fontWeight: "800",
  },


  detailsCard: {
    flex: 1,
    minHeight: 720,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 30,

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 5,
    position : "relative",
    zIndex : 1,
  },
  editDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginBottom: 24,
  },
  specificationEditFields: {
    gap: 10,
  },
  emptySpecificationsText: {
    color: "#64748B",
    fontSize: 14,
    marginBottom: 16,
  },
  imagesToDeleteText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },

  productTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#07163D",
    marginBottom: 14,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 18,
  },

  availableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  availableDot: {
    width: 11,
    height: 11,
    borderRadius: 99,
    backgroundColor: "#10B981",
  },

  availableText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 4,
  },

  price: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "900",
    color: "#2563EB",
  },

  pricePeriod: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
  },

  oldPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 22,
  },

  oldPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#64748B",
    textDecorationLine: "line-through",
  },

  discountBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  discountText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#059669",
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    color: "#475569",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 24,
  },

  specList: {
    gap: 14,
  },

  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },

  specLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  specLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },

  specValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    textAlign: "right",
  },

  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  periodTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  howItWorksButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  howItWorksText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },

  periodOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  periodOption: {
    flex: 1,
    minHeight: 68,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
  },

  periodOptionActive: {
    borderWidth: 2,
    borderColor: "#2563EB",
    backgroundColor: "#F8FBFF",
  },

  periodOptionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },

  periodOptionTitleActive: {
    fontSize: 15,
    fontWeight: "900",
    color: "#2563EB",
    marginBottom: 6,
  },

  periodOptionPriceActive: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563EB",
  },

  periodPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  periodOldPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    textDecorationLine: "line-through",
  },

  periodDiscount: {
    fontSize: 12,
    fontWeight: "900",
    color: "#059669",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },

  primaryButton: {
    height: 56,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,

    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 5,
  },

  primaryButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  secondaryButton: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2563EB",
  },

  loanModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  loanModalCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 26,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 10,
  },

  loanModalIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  loanModalTitle: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
  },

  loanModalDescription: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 20,
  },

  loanModalField: {
    gap: 7,
    marginBottom: 14,
  },

  loanModalLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },

  loanModalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    fontSize: 16,
    paddingHorizontal: 14,
  },

  loanModalError: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 14,
  },

  loanModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },

  loanModalButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  loanModalCancelButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },

  loanModalSubmitButton: {
    backgroundColor: "#2563EB",
  },

  loanModalButtonDisabled: {
    opacity: 0.6,
  },

  loanModalCancelText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "800",
  },

  loanModalSubmitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  /* PASEK ZALET */

  benefitsBar: {
    marginTop: 24,
    minHeight: 88,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },

  benefitItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  benefitIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  benefitTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  benefitText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  benefitDivider: {
    width: 1,
    height: 42,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 20,
  },
  specEmoji: {
  width: 24,
  fontSize: 18,
  textAlign: "center",
},
  
});

