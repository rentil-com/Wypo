import { Tabs } from "expo-router";
import { View ,Text,Image, FlatList,StyleSheet,Platform,Pressable,ScrollView} from "react-native";
import { TextInput } from "react-native";
import  {useState,useEffect} from "react"
import dane from  "../dane.json"
import { ThemedText } from "@/components/themed-text";
import { SymbolView } from "expo-symbols";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
export default function User() {
  const [katalog,setKatalog] = useState(dane)
  const [searchText,setsearchText] = useState("")
  var temp_losowy_indeks = Math.floor(Math.random() * dane.length)
  
  const kategorieMap = new Map();
  kategorieMap.set(1,"Buty")
  kategorieMap.set(2,"Elektronika")
  kategorieMap.set(3,"Narzedzia")
  kategorieMap.set(4,"Sport i rekreacja")


  return (
  <View style={styles.screen}>
        <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
    <View style={styles.page}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerName}>
          <Text style={styles.logoText}>Wypożyczalnia</Text>
        </View>

        {/*SEARCH BAR */}
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
        {/*CONTROLS */}
        {/*Przenoszenie do odpowiednich widokow */}
        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction}>
            <MaterialIcons name="favorite-border" size={24} color="#111827" />
            <Text style={styles.headerActionText}>Ulubione</Text>
          </Pressable>

          <Pressable style={styles.headerAction}>
            <MaterialIcons name="shopping-cart" size={24} color="#111827" />
            <Text style={styles.headerActionText}>Koszyk</Text>
          </Pressable>

          <Pressable style={styles.headerAction}>
            <MaterialIcons name="person-outline" size={25} color="#111827" />
            <Text style={styles.headerActionText}>Konto</Text>
          </Pressable>
        </View>
      </View>

      {/* SPECIAL OFFER CARD */}
      <View style={styles.offerCardWrapper}>
        <LinearGradient
          colors={["#2537D9", "#2F80ED", "#65DDE0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.offerCard}
        >
          <View style={styles.offerBubbleOne} />
          <View style={styles.offerBubbleTwo} />

          <View style={styles.offerLeft}>
            <Text style={styles.offerTopText}>Specjalna oferta dla Ciebie</Text>

            <Text style={styles.offerTitle}>Wypożycz sprzęt taniej</Text>

            <Text style={styles.offerSubtitle} numberOfLines={2}>
              {dane[temp_losowy_indeks]?.nazwa ||
                "Wybrany produkt dostępny już dziś"}
            </Text>
                    

          {/* TEMP CENA */}
            <View style={styles.offerPriceRow}>
              <Text style={styles.offerPrice}>129,99 zł</Text>
              <Text style={styles.offerOldPrice}>179,99 zł</Text>
            </View>

            <Pressable style={styles.offerButton}>
              <Text style={styles.offerButtonText}>Zobacz ofertę</Text>
            </Pressable>
          </View>

          <Image
            source={{ uri: dane[temp_losowy_indeks]?.zdjecie_url }}
            style={styles.offerImage}
            resizeMode="contain"
          />
        </LinearGradient>
      </View>

      {/* KATEGORIE HEADER */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kategorie</Text>

        <View style={styles.sectionActions}>
          <Pressable style={styles.allButton}>
            <Text style={styles.allButtonText}>Wszystkie</Text>
          </Pressable>

          <Pressable style={styles.arrowButton}>
            <MaterialIcons name="chevron-left" size={22} color="#111827" />
          </Pressable>

          <Pressable style={styles.arrowButton}>
            <MaterialIcons name="chevron-right" size={22} color="#111827" />
          </Pressable>
        </View>
      </View>

      {/* KATEGORIE */}
      <View style={styles.categoriesRow}>
        {Array.from(kategorieMap).map(([key, val], index) => (
          <Pressable
            key={key}
            style={[
              styles.categoryCard,
              index === 0 && styles.categoryCardActive,
            ]}
          >
            <View
              style={[
                styles.categoryIconBox,
                index === 0 && styles.categoryIconBoxActive,
              ]}
            >

              {/* IKONKI DLA KATEGORII */}
              <MaterialIcons
                name={
                  index === 0
                    ? "local-offer"
                    : index === 1
                    ? "devices"
                    : index === 2
                    ? "build"
                    : "sports-soccer"
                }
                size={32}
                color={index === 0 ? "#F43F5E" : "#176BDE"}
              />
            </View>

            <Text
              style={[
                styles.categoryName,
                index === 0 && styles.categoryNameActive,
              ]}
            >
              {val}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* BESTSELLERY HEADER */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bestsellery</Text>

        <Pressable style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>Zobacz wszystkie</Text>
          <MaterialIcons name="chevron-right" size={22} color="#176BDE" />
        </Pressable>
      </View>

      {/* KATALOG -> PRODUKTY/BESTSELLERY*/}
      <FlatList
        data={dane}
        keyExtractor={(item) => item.id.toString()}
        numColumns={4}
        scrollEnabled={false}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productsList}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            {/* DODAJ DO ULUBIONYCH */}
            <Pressable style={styles.favoriteButton}>
              <MaterialIcons name="favorite-border" size={23} color="#111827" />
            </Pressable>
             {/* ZDJECIE PRODUKTU*/}
            <View style={styles.productImageBox}>
              <Image
                source={{ uri: item.zdjecie_url }}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>
             {/* NAZWA PRODUKTU */}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.nazwa}
              </Text>

                  {/* STATUS PRODUKTU */}
              <Text style={styles.productStatus}>{item.status}</Text>

                  {/* OPIS PRODUKTU */}
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.opis}
              </Text>

                  {/* CENA PRODUKTU */}
              <View style={styles.productBottom}>
                <View>
                  <Text style={styles.productPrice}>99,99 zł</Text>
                
                  {/* OCENA PRODUKTU */}
                  <View style={styles.ratingRow}>
                    <MaterialIcons name="star" size={17} color="#F59E0B" />
                    <Text style={styles.ratingText}>4.8</Text>
                  </View>
                </View>

               
                <Pressable style={styles.addButton}>
                  <MaterialIcons name="add" size={24} color="#176BDE" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </View>
    </ScrollView>
  </View>
);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F8FF",
    paddingTop: 24,
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

  logoText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
  },

  searchBar: {
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

  offerCardWrapper: {
    marginTop: 24,
    width: "100%",
    borderRadius: 28,

    shadowColor: "#2F80ED",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 8,
  },

  offerCard: {
    width: "100%",
    minHeight: 280,
    borderRadius: 28,
    padding: 42,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },

  offerBubbleOne: {
    position: "absolute",
    right: -80,
    top: -80,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  offerBubbleTwo: {
    position: "absolute",
    right: 280,
    bottom: -100,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  offerLeft: {
    flex: 1,
    zIndex: 2,
    maxWidth: 560,
  },

  offerTopText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },

  offerTitle: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
    lineHeight: 46,
  },

  offerSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 19,
    fontWeight: "500",
    marginTop: 12,
    lineHeight: 28,
    maxWidth: 520,
  },

  offerPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 24,
  },

  offerPrice: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "900",
  },

  offerOldPrice: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 20,
    fontWeight: "700",
    textDecorationLine: "line-through",
  },

  offerButton: {
    marginTop: 28,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,

    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },

  offerButtonText: {
    color: "#176BDE",
    fontSize: 16,
    fontWeight: "900",
  },

  offerImage: {
    width: 380,
    height: 240,
    zIndex: 2,
  },
});