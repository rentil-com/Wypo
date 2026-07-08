import React from 'react';
import { View, Text, FlatList,ScrollView,StyleSheet, Pressable,TextInput,Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from "expo-router";
import dane from  "../dane.json"
import { ThemedText } from '@/components/themed-text';
import { useState } from 'react';

export default function ProductDetailedView () {
    const [searchText,setsearchText] = useState("")
    const { id } = useLocalSearchParams();
    const [indexaktualneZdjecie,setindexaktualneZdjecie] = useState(0)
   
    {/* Produkt o danym id */}
    const product = dane.find((item)=> item.id.toString() === id)


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
           <ThemedText style={styles.headerText} onPress={()=> router.push("/(tabs)/user")}>Wypożyczalnia</ThemedText>
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
    <Pressable style={styles.breadcrumbItem} onPress={() => {}}>
      <MaterialIcons name="home" size={20} color="#176BDE" />
    </Pressable>

    {/* Separator */}
    <MaterialIcons name="chevron-right" size={18} color="#176BDE" />

       {/*przenoszenie do odpowiedniej kategorii-> Elektronika np. */}
    <Pressable style={styles.breadcrumbItem} onPress={() => {}}>
      <Text style={styles.breadcrumbText}>Elektronika</Text>
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
    <Pressable style={styles.breadcrumbItem} onPress={() => {}}>
      <Text style={styles.breadcrumbLast}>Laptop Dell Latitude 5420</Text>
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
            <Text style={styles.statusText}>
                  {product.status}
            </Text>

        {/* opinie */}
        <MaterialIcons name="star" size={18} color="#F59E0B" />
                <Text style={styles.ratingText}>4.8 (124 opinie)</Text>
              
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
    minHeight: 76,
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

})