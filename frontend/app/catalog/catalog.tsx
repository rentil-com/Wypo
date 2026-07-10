import { Tabs, useLocalSearchParams } from "expo-router";
import { View ,Text, FlatList,Image, StyleSheet,Pressable,TextInput} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack } from 'expo-router';
import { ThemedText } from "@/components/themed-text";
import  dane from "../dane.json"
import { useState } from "react";
import { router } from "expo-router";

export default function TabsLayout() {
    const [tab,setTab] = useState(dane)
    const {query} = useLocalSearchParams();
    const [searchText,setsearchText] = useState("")
    const searchQuery = String(query ?? "").toLowerCase();
    const tab_filtered = tab.filter((item)=> item.nazwa.toLowerCase().includes(searchQuery))
    
    const suggestions = dane.filter((item)=> item.nazwa.toLowerCase().includes(searchText.trim().toLowerCase()))

    const handleSearchSubmit =()=> {
        const query = searchText.trim()

        router.push({pathname : "../catalog/catalog", params : {query : searchText} })
    }


  
  return (
    <View style={styles.page}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerName}>
            <Pressable onPress={()=>router.push("/(tabs)/user")}>  
         <Image source={{uri : "https://wypozyczalnia.calantris.com/logo.svg"}} style={styles.logo} />
         </Pressable>
        </View>

        {/*SEARCH BAR */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color="#8A96A8" />

          <TextInput
            value={searchText}
            onChangeText={(val) => setsearchText(val)}
            style={styles.searchText}
            returnKeyType="search"
           onSubmitEditing={handleSearchSubmit}
            placeholder="Wyszukaj produktów, marek i kategorii"
            placeholderTextColor="#9AA4B2"
          />
        </View>
        {suggestions.length > 0 && searchText.trim().length > 0 &&
                <View style={styles.suggestionsPanel}>
                {/*SUGGESTIONS PANEL */}
                {suggestions.map((item)=>(
                <Pressable key={item.id} onPress={()=> router.push(`../products/${item.id}`)} style={styles.suggestionItem}>
                    <Image source={{uri : item.zdjecie_url}} style={styles.suggestionImage} />
                    <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName} numberOfLines={1}>
                {item.nazwa}
                </Text>

        <Text style={styles.suggestionPrice}>
          {item.cena} zł
        </Text>
      </View>
          </Pressable>
        ))}
        </View>
}
        {/*KONTROLKI -> KATEGORIE, KONTAKT, DLA FIRM , JAK TO DZIALA */}
         <View style={styles.headerSideActions}>
                <Pressable style={styles.headerInfo} >
                  <Text style={styles.headerInfoText}>Kategorie</Text>
                </Pressable>
             </View>
      
      
              
              <View style={styles.headerSideActions}>
                <Pressable style={styles.headerInfo} >
                  <Text style={styles.headerInfoText}>Jak to działa?</Text>
                </Pressable>
             </View>
      
              <View style={styles.headerSideActions}>
                <Pressable style={styles.headerInfo} >
                  <Text style={styles.headerInfoText}>Dla firm</Text>
                </Pressable>
             </View>
      
              <View style={styles.headerSideActions}>
                <Pressable style={styles.headerInfo} >
                  <Text style={styles.headerInfoText}>Kontakt</Text>
                </Pressable>
             </View>
      
        {/*CONTROLS */}
        {/*Przenoszenie do odpowiednich widokow */}
        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} onPress={()=> router.replace("/(tabs)/wishlist")}>
            <MaterialIcons name="favorite-border" size={24} color="#111827"/>
            <Text style={styles.headerActionText}>Ulubione</Text>
          </Pressable>

          <Pressable style={styles.headerAction}  onPress={()=> router.replace("/(tabs)/basket")}>
            <MaterialIcons name="shopping-cart" size={24} color="#111827" />
            <Text style={styles.headerActionText}>Koszyk</Text>
          </Pressable>

          <Pressable style={styles.headerAction} onPress={()=> router.replace("/(tabs)/account")}>
            <MaterialIcons name="person-outline" size={25} color="#111827" />
            <Text style={styles.headerActionText}>Konto</Text>
          </Pressable>
        </View>
      </View>


      {/*PASEK FILTRÓW */}
      <ThemedText> WSZYSTKO </ThemedText>
      <FlatList data={tab_filtered} keyExtractor={(elem)=> elem.id.toString()} numColumns={4} renderItem={({item})=> (


        <View>
            <ThemedText>{item.nazwa}</ThemedText>
            <ThemedText>{item.cena}</ThemedText>
            <ThemedText>{item.cena_po_promocji}</ThemedText>
        </View>
      )}


>

</FlatList>
    </View>

  );
}

const styles = StyleSheet.create({
    productImage : {
    width: "100%",
    height: "100%",
    },
    page: {
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
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

  logoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 210,
  },

  logo: {
  width: 52,
  height: 52,
  zIndex: 1,

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
  fontWeight: "700",
},
})