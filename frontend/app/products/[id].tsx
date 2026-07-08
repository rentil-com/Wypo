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
    {/* Produkt o danym id */}
    const product = dane.find((item)=> item.id.toString() === id)
  return (
   
    <View style={screen}>
       <ScrollView
            style={styles.scroll}
         contentContainerStyle={styles.scrollContent}
         showsVerticalScrollIndicator={false} >
       
   
       <View style={styles.page}>
       <View style={styles.header}>
       <View style={styles.headerName}>
           <ThemedText style={styles.headerText}>Wypożyczalnia</ThemedText>
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

    <View style={styles.galleryCard}>
       <View style={styles.productLayout}>
        <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
                {/* ilosc zdjec na ile */}
                1 / 6
            </Text>
        </View>

        {/* COFNIECIE ZDJECIA*/}
        <Pressable>
      <MaterialIcons name="chevron-left" size={28} color="#0F172A" />


    <View style={styles.mainImageBox}>
      <Image
        source={{ uri: product?.zdjecie_url }}
        style={styles.mainProductImage}
        resizeMode="contain"
      />
    </View>

    </Pressable>
           {/* KOLEJNE ZDJECIE*/}
       <Pressable>
      <MaterialIcons name="chevron-right" size={28} color="#0F172A" />
    </Pressable>


       </View>
    </View>

    </View>
       </ScrollView>
       </View>
   
  );
};




const styles = StyleSheet.create({ 
    screen : {
        flex: 1,
        backgroundColor: "#F4F8FF",
        paddingTop: 24,     
    },
    page : {
        width: "100%",
        maxWidth: 1440,
        alignSelf: "center",
        paddingHorizontal: 32,
        paddingBottom: 40
    },
    header : { 
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
    headerText : {
        fontSize: 24,
        fontWeight: "900",
        color: "#111827",
    },
    searchBar : {
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
    },
    searchText : {
        flex: 1,
        height: "100%",
        fontSize: 15,
        color: "#111827",
        outlineStyle: "none" as any,
    },
    category_path: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'nowrap',           
        overflow: 'hidden',           
    },
    breadcrumbItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
    },
    breadcrumbText: {
        fontSize: 14,
        color: '#176BDE',
        fontWeight: '500',
        marginRight: 4,
    },
    breadcrumbLast: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
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
    scroll: {
        flex: 1,
    },

  scrollContent: {
    paddingBottom: 60,
  },
    galleryCard: {
    width: "100%",
    marginTop: 24,
    flexDirection: "row",
    gap: 24,
    },

    productLayout: {
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

    mainImageBox: {
    flex: 1,
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 56,
    paddingTop: 30,
    paddingBottom: 30,
    },

    mainProductImage: {
    width: "100%",
    height: "100%",
    maxHeight: 520,
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

})