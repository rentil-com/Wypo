import { Tabs } from "expo-router";
import { View ,Text,Image, FlatList,StyleSheet,Platform} from "react-native";
import  {useState,useEffect} from "react"
import dane from  "../dane.json"
import { ThemedText } from "@/components/themed-text";
import { SymbolView } from "expo-symbols";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
export default function User() {
  const [katalog,setKatalog] = useState(dane)
  var temp_losowy_indeks = Math.floor(Math.random() * dane.length)
  
  const kategorieMap = new Map();
  kategorieMap.set(1,"Buty")
  kategorieMap.set(2,"Elektronika")
  kategorieMap.set(3,"Narzedzia")
  kategorieMap.set(4,"Sport i rekreacja")


  return (
    <View style={styles.screen}>
     {/*głowny styl katalogu jako siatka np */}
     <View style={styles.searchBar}> 
        <MaterialIcons name="search" size={20} color="#999" />
        {/*input do wpisywanie tekstu -> searchText */}
        <ThemedText style={styles.searchText}>Wyszukaj ....</ThemedText>
           
    
        </View>
        {/*SPECIAL OFFER CARD  */}
           <View style={styles.offerCardWrapper}>
           <LinearGradient
  colors={["#38D5D1", "#2F80ED", "#6A8DFF"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.offerCard}
>
  <View style={styles.offerBubble} />
  <View style={styles.offerLeft}>
    <Text style={styles.offerTopText}>Specjalna oferta dla Ciebie</Text>

    <Text style={styles.offerTitle}>Wypożycz sprzęt taniej</Text>
    <Text style={styles.offerSubtitle} numberOfLines={2}>
        {dane[temp_losowy_indeks]?.nazwa || "Wybrany produkt dostępny już dziś"}
      </Text>

    <View style={styles.offerPriceRow}>
        <Text style={styles.offerPrice}>129,99 zł</Text>
        <Text style={styles.offerOldPrice}>179,99 zł</Text>
      </View>
    
     <View style={styles.offerButton}>
        <Text style={styles.offerButtonText}>Zobacz ofertę</Text>
      </View>
  

     <Image
      source={{ uri: dane[temp_losowy_indeks]?.zdjecie_url }}
      style={styles.offerImage}
      resizeMode="contain"
    />

  </View>
  <ThemedText>{dane[temp_losowy_indeks].nazwa}</ThemedText>
</LinearGradient>
        </View>
        <ThemedText>KATEGORIE</ThemedText>
        <View>
          {/*kontener dla kategorii  */}
          
        {Array.from(kategorieMap).map(([key,val])=> (<ThemedText key={key}>{val}</ThemedText>))}
        </View>
  

    <FlatList
      data={dane}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Image
            source={{ uri: item.zdjecie_url }}
            style={styles.image}
            resizeMode="cover"
          />
          
          <View >
            <Text >{item.nazwa}</Text>
            <Text >{item.status}</Text>
            <Text numberOfLines={2}>{item.opis}</Text>
          </View>
        </View>
      )}
    />

</View>
 
  );
  
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 250,
  },
  screen : {
    flex : 1,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  searchBar : {
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchText : {
    fontFamily : "Arial"
  },
  offerCardWrapper : {
    marginTop: 18,
    width: "90%",
    maxWidth: 380,
    alignSelf: "center",
    borderRadius: 26,
    shadowColor: "#7EDFF2",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  offerCard: {
    width: "100%",
    minHeight: 190,
    borderRadius: 26,
    padding: 18,
    overflow: "hidden",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
  },

  offerBubble: {
    position: "absolute",
    right: -35,
    top: -35,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  offerLeft: {
    flex: 1,
    zIndex: 2,
    paddingRight: 8,
  },

  offerTopText: {
    color: "#2B8CA3",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },

  offerTitle: {
    color: "#12324A",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25,
  },
  offerSubtitle: {
    color: "#3E6475",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
    lineHeight: 17,
    maxWidth: 190,
  },

  offerPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },

  offerPrice: {
    color: "#176BDE",
    fontSize: 22,
    fontWeight: "900",
  },

  offerOldPrice: {
    color: "#7A8A99",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "line-through",
  },

  offerButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#176BDE",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,

    shadowColor: "#176BDE",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,

    elevation: 4,
  },

  offerButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  offerImage: {
    width: 120,
    height: 105,
    zIndex: 2,
  },
});