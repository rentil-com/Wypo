import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState,useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import dane from "../dane.json";
import { kategorieMap } from "@/constants/categories";
import Breadcrumbs from "@/components/shared/Breadcrumbs/Breadcrumbs";
import PageLayout from "@/components/shared/Layout/PageLayout";
import { pobierzPojedynczyProdukt } from "@/services/singleproduct.service";
import { SingleProductApiItem } from "@/types/singleproduct";
import { FlatList } from "react-native-reanimated/lib/typescript/Animated";
export default function ProductDetailedView() {
  {/* STATUSY SPRZETU */}
  type StatusSprzetu = "dostepny" | "wypozyczony" | "w_naprawie";

  type StatusStyle = {
    label: string;
    backgroundColor: string;
    textColor: string;
    icon: keyof typeof MaterialIcons.glyphMap;
  };

  const statusStyles: Record<StatusSprzetu, StatusStyle> = {
    dostepny: {
      label: "Dostępny",
      backgroundColor: "#DCFCE7",
      textColor: "#166534",
      icon: "check-circle",
    },
    wypozyczony: {
      label: "Wypożyczony",
      backgroundColor: "#DBEAFE",
      textColor: "#1E40AF",
      icon: "hourglass-empty",
    },
    w_naprawie: {
      label: "W naprawie",
      backgroundColor: "#FEF3C7",
      textColor: "#92400E",
      icon: "build",
    },
  };

  const [pojedynczyProdukt,setPojedynczyProdukt] = useState<SingleProductApiItem>();
  const [loading,setLoading] = useState(true)
  const [error,setEror] = useState<string | null>(null)
  {/* STANY I PARAMETRY */}
  const { id } = useLocalSearchParams();
  {/* index = aktualne zdjecie w galerii */}
  const [indexaktualneZdjecie, setindexaktualneZdjecie] = useState(0);
  const zdjecia = pojedynczyProdukt
  ? Object.values(pojedynczyProdukt.zdjecia_url)
  : [];
  {/* PRODUKT O DANYM ID */}
  const product = dane.find((item) => item.id.toString() === id);

  {/* SUGESTIE WYSZUKIWANIA */}
 
    useEffect (()=> {
      async function zaladujProdukty() {
        try {
          const response = await pobierzPojedynczyProdukt(Number(id))
  
          setPojedynczyProdukt(response);
        }
        catch(error){
          setEror(error instanceof Error ? error.message : "Nieznany bład")
        }
        finally {
          setLoading(false)
        }
        
      }
      void zaladujProdukty();
  
    },[]);
  

  {/* TYMCZASOWA GALERIA ZDJEC, NARAZIE MAM JEDNO ZDJECIE (POTEM BEDZIE WIELE) */}
  const temp_photos_gallery = [
    product?.zdjecie_url,
    product?.zdjecie_url,
    product?.zdjecie_url,
    product?.zdjecie_url,
    product?.zdjecie_url,
    product?.zdjecie_url,
  ];

  if (!product) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>Nie znaleziono produktu.</Text>
      </View>
    );
  }

  {/* FUNKCJE GALERII */}
  const przejdzDoNastepnegoZdjecia = () => {
    let nowy_index = indexaktualneZdjecie + 1;

    if (nowy_index >= temp_photos_gallery.length) {
      nowy_index = 0;
    }

    setindexaktualneZdjecie(nowy_index);
  };

  const przejdzDoPoprzedniegoZdjecia = () => {
    let nowy_index = indexaktualneZdjecie - 1;

    if (nowy_index < 0) {
      nowy_index = temp_photos_gallery.length - 1;
    }

    setindexaktualneZdjecie(nowy_index);

  };



  return (
   <PageLayout> 
         

          {/* SCIEZKA KATEGORII */}
          <Breadcrumbs
  items={[
      {
        label:
          kategorieMap.get(product.kategoria_id) ??
          "Kategoria",

        href: `/catalog/category/${product.kategoria_id}`,
      },
      {
        label: product.nazwa,
      },
    ]}
  />


          {/* SEKCJA PRODUKTU */}
          <View style={styles.productSection}>
            {/* GALERIA ZDJEC */}
            <View style={styles.galleryCard}>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {/* ILOSC ZDJEC NA ILE */}
                  {indexaktualneZdjecie +1} / {zdjecia.length}
                </Text>
              </View>

              {/* COFNIECIE ZDJECIA */}
              <Pressable
                onPress={() => przejdzDoPoprzedniegoZdjecia()}
                style={[styles.galleryArrow, styles.galleryArrowLeft]}
              >
                <MaterialIcons name="chevron-left" size={28} color="#0F172A" />
              </Pressable>

              {/* GLOWNE ZDJECIE PRODUKTU */}
              <View style={styles.mainImageBox}>
                <Image
                  source={{ uri: zdjecia[indexaktualneZdjecie] }}
                  style={styles.mainProductImage}
                  resizeMode="contain"
                />
              </View>

              {/* KOLEJNE ZDJECIE */}
              <Pressable
                onPress={() => przejdzDoNastepnegoZdjecia()}
                style={[styles.galleryArrow, styles.galleryArrowRight]}
              >
                <MaterialIcons name="chevron-right" size={28} color="#0F172A" />
              </Pressable>

                   <View style={styles.thumbnailRow}>
                  

                   </View>

              {/* MINIATURY ZDJEC */}
              <View style={styles.thumbnailRow}>
                {zdjecia.map((image,index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.thumbnailBox,
                      indexaktualneZdjecie === index && styles.thumbnailBoxActive,
                    ]}
                    onPress={() => setindexaktualneZdjecie(index)}
                  >
                    <Image source={{ uri: image }} style={styles.thumbnailImage} resizeMode="contain" />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* PRAWA STRONA - SZCZEGOLY */}
            <View style={styles.detailsCard}>
              {/* NAZWA PRODUKTU */}
              <Text style={styles.productTitle}>{pojedynczyProdukt?.nazwa}</Text>

              {/* STATUS PRODUKTU */}
              <View >
                <View  />

                <View
                  style={[
                    styles.productStatusBadge,
                    {
                      backgroundColor:
                        statusStyles[product.status as keyof typeof statusStyles].backgroundColor,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={statusStyles[product.status as keyof typeof statusStyles].icon}
                    size={14}
                    color={statusStyles[product.status as keyof typeof statusStyles].textColor}
                  />

                  <Text
                    style={[
                      styles.productStatusText,
                      {
                        color: statusStyles[product.status as keyof typeof statusStyles].textColor,
                      },
                    ]}
                  >
                    {statusStyles[product.status as keyof typeof statusStyles].label}
                  </Text>
                </View>

                {/* OPINIE DO ZOBACZENIA PO KLIKNIECIU */}
                <View style={styles.ratingRow}>
                  <MaterialIcons name="star" size={18} color="#F59E0B" />
                  <Text style={styles.ratingText}>4.8 (124 opinie)</Text>
                </View>

                {/* CENA PRODUKTU */}
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{pojedynczyProdukt?.cena}</Text>
                  <Text style={styles.pricePeriod}>/ za okres</Text>
                </View>
                
                {pojedynczyProdukt?.cena_po_promocji !=null && 
                <View style={styles.oldPriceRow}>
                  <Text style={styles.oldPrice}>{pojedynczyProdukt?.cena_po_promocji}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-28%</Text>
                  </View>
                </View>
                    }
                {/* OPIS PRODUKTU */}
                <Text style={styles.description}>{pojedynczyProdukt?.opis}</Text>

                {/* SPECYFIKACJE */}
                <View style={styles.specList}>
                  <View style={styles.specRow}>
                    <View style={styles.specLeft}>
                      <Text style={styles.specLabel}>Procesor</Text>
                    </View>
                    <Text style={styles.specValue}>Intel Core i5-1145G7</Text>
                  </View>

                  <View style={styles.specRow}>
                    <View style={styles.specLeft}>
                      <Text style={styles.specLabel}>Pamięć RAM</Text>
                    </View>
                    <Text style={styles.specValue}>16 GB DDR4</Text>
                  </View>

                  <View style={styles.specRow}>
                    <View style={styles.specLeft}>
                      <Text style={styles.specLabel}>Dysk</Text>
                    </View>
                    <Text style={styles.specValue}>512 GB SSD</Text>
                  </View>

                  <View style={styles.specRow}>
                    <View style={styles.specLeft}>
                      <Text style={styles.specLabel}>Ekran</Text>
                    </View>
                    <Text style={styles.specValue}>14&quot; Full HD</Text>
                  </View>

                  <View style={styles.specRow}>
                    <View style={styles.specLeft}>
                      <Text style={styles.specLabel}>System</Text>
                    </View>
                    <Text style={styles.specValue}>Windows 11 Pro</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* OKRES WYNAJMU */}
                <View style={styles.periodHeader}>
                  <Text style={styles.periodTitle}>Wybierz okres wynajmu</Text>

                  {/* PRZEKIEROWANIE */}
                  <Pressable style={styles.howItWorksButton}>
                    <MaterialIcons name="info-outline" size={16} color="#2563EB" />
                    <Text style={styles.howItWorksText} onPress={()=> router.push("/(tabs)/howItWorks")}>Jak to działa?</Text>
                  </Pressable>
                </View>

                <View style={styles.periodOptions}>
                  <Pressable style={[styles.periodOption, styles.periodOptionActive]}>
                    <Text style={styles.periodOptionTitleActive}>1 dzień</Text>
                    <Text style={styles.periodOptionPriceActive}>{pojedynczyProdukt?.cena}</Text>
                  </Pressable>
                </View>

                {/* PRZYCISKI INTERAKTYWNE */}
                <Pressable style={styles.primaryButton}>
                  <MaterialIcons name="flash-on" size={22} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Wypożycz teraz</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton}>
                  <MaterialIcons name="shopping-cart" size={22} color="#2563EB" />
                  <Text style={styles.secondaryButtonText}>Dodaj do koszyka</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* PASEK ZALET */}
          <View style={styles.benefitsBar}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <MaterialIcons name="local-shipping" size={24} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.benefitTitle}>Darmowa dostawa</Text>
                <Text style={styles.benefitText}>Na terenie całej Polski</Text>
              </View>
            </View>

            <View style={styles.benefitDivider} />

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <MaterialIcons name="sync" size={24} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.benefitTitle}>Elastyczny wynajem</Text>
                <Text style={styles.benefitText}>Krótko- i długoterminowy</Text>
              </View>
            </View>

            <View style={styles.benefitDivider} />

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <MaterialIcons name="shield" size={24} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.benefitTitle}>Bezpieczeństwo</Text>
                <Text style={styles.benefitText}>Sprzęt sprawdzony i gotowy</Text>
              </View>
            </View>

            <View style={styles.benefitDivider} />

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <MaterialIcons name="headset-mic" size={24} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.benefitTitle}>Wsparcie 24/7</Text>
                <Text style={styles.benefitText}>Jesteśmy dla Ciebie</Text>
              </View>
            </View>
          </View>
  </PageLayout>
  );
}

const styles = StyleSheet.create({
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
  
});
  