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

        {/* GŁÓWNA ZAWARTOŚĆ */}
        <View>

          {/* BREADCRUMBS */}
          <View style={styles.category_path}>
              <Pressable
                style={styles.breadcrumbItem}
                onPress={() => {
                  router.push("/(tabs)/user");
                }}
              >
                <MaterialIcons name="home" size={20} color="#176BDE" />
              </Pressable>
              {/* SEPARATOR */}
              <MaterialIcons name="chevron-right" size={18} color="#176BDE" />

                <Pressable
                style={styles.breadcrumbItem}
                onPress={() => {
                  router.push(`../catalog/catalog/`);
                }}
              >
                <Text style={styles.breadcrumbLast}>Wszystkie</Text>
                 </Pressable>

                 {/*TU DALEJ JAKIEGOS KATEGORIE W BREADCRUMBIE */}

                 
       </View>


        {/*NAGŁOWEK STRONY, OPISY ZACHECAJACE */}
        <View style={styles.pageHeading}>
            <View style={styles.pageHeadingContent}>
              <ThemedText style={styles.pageTitle}>Wszystkie produkty</ThemedText>

              <ThemedText style={styles.pageDescription}>
                Odkryj pełną ofertę tysięcy produktów dostępnych na wynajem.
                Wybierz, porównaj i wynajmij już dziś.
              </ThemedText>
            </View>

            <View style={styles.productsInfo}>
              <View style={styles.productsInfoIcon}>
                <ThemedText style={styles.productsInfoIconText}>
                 <MaterialIcons name="business-center" size={32}  />
                </ThemedText>
              </View>

              <View>
                <ThemedText  style={styles.productsInfoTitle}>Tysiące produktów</ThemedText>
                <ThemedText style={styles.productsInfoDescription}>w jednym miejscu</ThemedText>
              </View>
            </View>
          </View>

         {/* UKŁAD KATALOGU */}
          <View>
            {/* LEWY PANEL KATEGORII, KATEGORIE MAPOWANE Z DANYCH , NARAZIE PRZYKŁADOWE NIE WSZYSTKO */}
            <View>
              <ThemedText>Kategorie</ThemedText>

              <Pressable>
                <ThemedText>▦</ThemedText>
                <ThemedText>Wszystkie kategorie</ThemedText>
              </Pressable>

              <Pressable>
                <ThemedText>◆</ThemedText>
                <ThemedText>Promocje</ThemedText>
              </Pressable>

              <Pressable>
                <ThemedText>◒</ThemedText>
                <ThemedText>Buty</ThemedText>
              </Pressable>

              <Pressable>
                <ThemedText>▣</ThemedText>
                <ThemedText>Elektronika</ThemedText>
              </Pressable>

              <Pressable>
                <ThemedText>⚒</ThemedText>
                <ThemedText>Narzędzia</ThemedText>
              </Pressable>

              <Pressable>
                <ThemedText>◉</ThemedText>
                <ThemedText>Sport i rekreacja</ThemedText>
              </Pressable>
            </View>

             {/* PRAWA CZĘŚĆ */}
            <View>
              {/* PANEL FILTRÓW */}
              <View>
                {/* GÓRNY RZĄD FILTRÓW */}
                <View>
                  <View>
                    <ThemedText>Cena od</ThemedText>
                    <TextInput placeholder="od 0 zł" />
                  </View>

                  <View>
                    <ThemedText>Cena do</ThemedText>
                    <TextInput placeholder="do 5000 zł" />
                  </View>

                  <View>
                    <ThemedText>Cena min</ThemedText>

                    <Pressable>
                      <ThemedText>min. 1 dzień</ThemedText>
                      <ThemedText>⌄</ThemedText>
                    </Pressable>
                  </View>

                  <View>
                    <ThemedText>Cena max</ThemedText>

                    <Pressable>
                      <ThemedText>max. 30 dni</ThemedText>
                      <ThemedText>⌄</ThemedText>
                    </Pressable>
                  </View>

                  <View>
                    <ThemedText>Sortuj</ThemedText>

                    <Pressable>
                      <ThemedText>Cena rosnąco</ThemedText>
                      <ThemedText>⌄</ThemedText>
                    </Pressable>
                  </View>

                  <Pressable>
                    <ThemedText>◆</ThemedText>
                    <ThemedText>Promocja</ThemedText>
                    <ThemedText>OFF</ThemedText>
                  </Pressable>
                </View>

                {/* DOLNY RZĄD FILTRÓW */}
                <View>
                  <View>
                    <Pressable>
                      <ThemedText>☷</ThemedText>
                      <ThemedText>Więcej filtrów</ThemedText>
                    </Pressable>

                    <Pressable>
                      <ThemedText>↻</ThemedText>
                      <ThemedText>Wyczyść filtry</ThemedText>
                    </Pressable>
                  </View>

                  <ThemedText>Znaleziono: 120 produktów</ThemedText>
                </View>
              </View>
             {/* LISTA PRODUKTÓW */}
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


</View>





      <ThemedText> WSZYSTKO </ThemedText>
    
</View>
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
  category_path: {
    marginTop: 28,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    overflow: "hidden",
    gap: 8,
  },
pageHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 22,
  },

  pageHeadingContent: {
    flex: 1,
  },

  pageTitle: {
    color: "#111827",
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
  },

  pageDescription: {
    color: "#7A89A6",
    fontSize: 14,
    marginTop: 6,
  },

  productsInfo: {
    minWidth: 235,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,

    shadowColor: "#1E3A8A",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },

  productsInfoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
  },

  productsInfoIconText: {
    color: "#0877FF",
    fontSize: 23,
    fontWeight: "700",
  },

  productsInfoTitle: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "800",
  },

  productsInfoDescription: {
    color: "#8995AB",
    fontSize: 12,
    marginTop: 2,
  },

})