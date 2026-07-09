import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import dane from "../dane.json";
export default function ProductDetailedView () {
  {/*STATUSY */}
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


    const [searchText,setsearchText] = useState("")
    const { id } = useLocalSearchParams();
    const [indexaktualneZdjecie,setindexaktualneZdjecie] = useState(0)
   
    {/* Produkt o danym id */}
    const product = dane.find((item)=> item.id.toString() === id)
      const kategorieMap = new Map();
    kategorieMap.set(1,"Buty")
    kategorieMap.set(2,"Elektronika")
    kategorieMap.set(3,"Narzedzia")
    kategorieMap.set(4,"Sport i rekreacja")


    {/* tymczasowa galeria zdjec, narazie mam jedno zdjecie (potem bedzie wiele) */}
    const temp_photos_gallery = [
        product?.zdjecie_url, 
        product?.zdjecie_url,
        product?.zdjecie_url,
        product?.zdjecie_url,
        product?.zdjecie_url,
        product?.zdjecie_url
    ]

    if (!product) {
        return (
        <View style={styles.screen}>
            <Text style={styles.errorText}>Nie znaleziono produktu.</Text>
        </View>
        );
  }

  const przejdzDoNastepnegoZdjecia =()=> {
    let nowy_index = indexaktualneZdjecie +1;
    if(nowy_index >= temp_photos_gallery.length ){
    
        nowy_index = 0
    }
    setindexaktualneZdjecie(nowy_index)
  }

  const przejdzDoPoprzedniegoZdjecia =()=>{
     let nowy_index = indexaktualneZdjecie -1;
       if(nowy_index < 0){
        nowy_index = 5
    }
    setindexaktualneZdjecie(nowy_index)
  }


  return (
   
    <View style={screen}>
       <ScrollView
            style={styles.scroll}
         contentContainerStyle={styles.scrollContent}
         showsVerticalScrollIndicator={false} >
       
   
       <View style={styles.page}>
       <View style={styles.header}>
       <View style={styles.headerName}>
          <Pressable onPress={()=> router.push("../(tabs)/user")}>
            <Image source={require("../../assets/logos/rentil.png")} style={styles.logo} />
            </Pressable>
       </View>
   

    {/*WIDOK SEARCHBARU*/}
       <View style={styles.searchBar}>
           <MaterialIcons name="search" size={22} color="#8A96A8" />
             <TextInput
            value={searchText}
            onChangeText={(val) => setsearchText(val)}
            style={styles.searchText}
            placeholder="Wyszukaj produktów, marek i kategorii"
            placeholderTextColor="#9AA4B2"
          />
       </View>
        {/*KONTROLKI -> KATEGORIE, KONTAKT, DLA FIRM , JAK TO DZIALA */}

        <View style={styles.sideheaderActions}>
          <Pressable style={styles.sideheaderAction} >
            <Text style={styles.sideheaderText}>Kategorie</Text>
          </Pressable>
       </View>


        
        <View style={styles.sideheaderActions}>
          <Pressable style={styles.sideheaderAction} >
            <Text style={styles.sideheaderText}>Jak to działa?</Text>
          </Pressable>
       </View>

        <View style={styles.sideheaderActions}>
          <Pressable style={styles.sideheaderAction} >
            <Text style={styles.sideheaderText}>Dla firm</Text>
          </Pressable>
       </View>

        <View style={styles.sideheaderActions}>
          <Pressable style={styles.sideheaderAction} >
            <Text style={styles.sideheaderText}>Kontakt</Text>
          </Pressable>
       </View>



        {/*CONTROLS */}
        {/*Przenoszenie do odpowiednich widokow */}
        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} onPress={()=> router.replace("/(tabs)/wishlist")}>
            <MaterialIcons name="favorite-border" size={24} color="#111827"/>
            <Text style={styles.headerActionText}>Ulubione</Text>
          </Pressable>
       </View>

            <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} onPress={()=> router.replace("/(tabs)/basket")}>
            <MaterialIcons name="shopping-cart" size={24} color="#111827"/>
            <Text style={styles.headerActionText}>Koszyk</Text>
          </Pressable>
       </View>


          <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} onPress={()=> router.replace("/(tabs)/basket")}>
            <MaterialIcons name="person-outline" size={24} color="#111827"/>
            <Text style={styles.headerActionText}>Konto</Text>
          </Pressable>
       </View>
   
       </View>

    <View>
        <View style={styles.category_path}>
            {/*przenoszenie do odpowiedniej kategorii */}
    <Pressable style={styles.breadcrumbItem} onPress={() => {router.push("/(tabs)/user")}}>
      <MaterialIcons name="home" size={20} color="#176BDE" />
    </Pressable>

    {/* Separator */}
    <MaterialIcons name="chevron-right" size={18} color="#176BDE" />

       {/*przenoszenie do odpowiedniej kategorii-> Elektronika np. */}
    <Pressable style={styles.breadcrumbItem} onPress={() => {router.push(`../category/${product.kategoria_id}`)}}>
      <Text style={styles.breadcrumbText}>{kategorieMap.get(product.kategoria_id)}</Text>
    </Pressable>

    {/* Separator */}
    <MaterialIcons name="chevron-right" size={18} color="#176BDE" />

    {/* Kategoria podrzedna */}
    <Pressable style={styles.breadcrumbItem} onPress={() => {}}>
      <Text style={styles.breadcrumbText}>Laptopy</Text>
    </Pressable>

    {/* Separator */}
    <MaterialIcons name="chevron-right" size={18} color="#176BDE" />

    {/* Ostatnie aktywny element */}
    <Pressable style={styles.breadcrumbItem} onPress={() => {router.push(`../products/${product.id}`)}}>
      <Text style={styles.breadcrumbLast}>{product.nazwa}</Text>
    </Pressable>
</View>
     
    </View>

    <View style={styles.productSection}>
       <View style={styles.galleryCard}>
        <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
                {/* ilosc zdjec na ile */}
                 {indexaktualneZdjecie + 1} / {temp_photos_gallery.length}
            </Text>
        </View>

        {/* COFNIECIE ZDJECIA*/}
        <Pressable onPress={()=> przejdzDoPoprzedniegoZdjecia()}  style={[styles.galleryArrow, styles.galleryArrowLeft]}>
      <MaterialIcons name="chevron-left" size={28} color="#0F172A" />
</Pressable>

    <View style={styles.mainImageBox}>
      <Image
        source={{ uri: temp_photos_gallery[indexaktualneZdjecie] }}
        style={styles.mainProductImage}
        resizeMode="contain"
      />
    </View>

   
           {/* KOLEJNE ZDJECIE*/}
       <Pressable onPress={()=> przejdzDoNastepnegoZdjecia()}  style={[styles.galleryArrow, styles.galleryArrowRight]}>
      <MaterialIcons name="chevron-right" size={28} color="#0F172A" />
    </Pressable>

    <View style={styles.thumbnailRow}>
                {temp_photos_gallery.map((image, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.thumbnailBox,
                      indexaktualneZdjecie === index && styles.thumbnailBoxActive,
                    ]}
                    onPress={() => setindexaktualneZdjecie(index)}
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.thumbnailImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                ))}
              </View>
       </View>
    {/* PRAWA STRONA - SZCZEGOLY */}
    <View style={styles.detailsCard}>

        <Text style={styles.productTitle}>{product.nazwa}</Text>
          <View style={styles.statusRow}>
                <View style={styles.statusDot} />
            
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
            

        {/* opinie do zobaczenia po klikneciue */}
         <View style={styles.ratingRow}>
        <MaterialIcons name="star" size={18} color="#F59E0B" />
                <Text style={styles.ratingText}>4.8 (124 opinie)</Text>
         </View>
        {/*Cena produktu */}

        <View style={styles.priceRow}>
      <Text style={styles.price}>129,99 zł</Text>
      <Text style={styles.pricePeriod}>/ za okres</Text>
    </View>

    <View style={styles.oldPriceRow}>
      <Text style={styles.oldPrice}>179,99 zł</Text>
      <View style={styles.discountBadge}>
        <Text style={styles.discountText}>-28%</Text>
      </View>
      </View>


      <Text style={styles.description}>
      {product.opis}
    </Text>
                          

      {/*SPECYFIKACJE */}    

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
        <Text style={styles.specValue}>14" Full HD</Text>
      </View>

      <View style={styles.specRow}>
        <View style={styles.specLeft}>
          <Text style={styles.specLabel}>System</Text>
        </View>
        <Text style={styles.specValue}>Windows 11 Pro</Text>
      </View>
    </View>

    <View style={styles.divider} />


        <View style={styles.periodHeader}>
      <Text style={styles.periodTitle}>Wybierz okres wynajmu</Text>


    {/* przekierowanie*/}
      <Pressable style={styles.howItWorksButton}>
        <MaterialIcons name="info-outline" size={16} color="#2563EB" />
        <Text style={styles.howItWorksText}>Jak to działa?</Text>
      </Pressable>
    </View>

     <View style={styles.periodOptions}>
      <Pressable style={[styles.periodOption, styles.periodOptionActive]}>
        <Text style={styles.periodOptionTitleActive}>1 dzień</Text>
        <Text style={styles.periodOptionPriceActive}>129,99 zł</Text>
      </Pressable>
        </View>



      {/* przyciski interaktywne */}
        <Pressable style={styles.primaryButton}>
      <MaterialIcons name="flash-on" size={22} color="#FFFFFF" />
      <Text style={styles.primaryButtonText}>Wypożycz teraz</Text>
    </Pressable>

    <Pressable style={styles.secondaryButton}>
      <MaterialIcons name="shopping-cart" size={22} color="#2563EB" />
      <Text style={styles.secondaryButtonText}>Dodaj do koszyka</Text>
    </Pressable>

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

          </View>
    </View>

    </View>
       </ScrollView>
       </View>
   
  );
};




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

  errorText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#EF4444",
    padding: 32,
  },

  /* HEADER */

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

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },

  headerName: {
    minWidth: 170,
  },

  headerText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#07163D",
  },

  searchBar: {
    flex: 1,
    maxWidth: 440,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchText: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#111827",
    outlineStyle: "none" as any,
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

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
  },

  headerAction: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  headerActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
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
  logo: {
  width: 92,
  height: 72,
  zIndex: 2,
  },
})