import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import dane from "../dane.json";
import { pobierzProdukty } from "@/services/products.service";
import type { ApiItem } from "@/types/product";
import type {CategoryApiItem} from "@/types/categories"
import { pobierzKategorie } from "@/services/categories.service";
import { useLocalSearchParams } from "expo-router";
import { kategorieMap } from "@/constants/categories";
import ProductCard from "@/components/shared/Product/ProductCard";
import PageLayout from "@/components/shared/Layout/PageLayout";
export default function User() {

  
  const { kategoria_id } = useLocalSearchParams();

  {/* CZAS RESETU */}
  const RESET_HOUR = 10
  const RESET_MINUTE = 0
  

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [lastResetDate,setLastResetDate] = useState<string | null>(null);

  const [katalog,setKatalog] = useState(dane)

  const products = kategoria_id ? katalog.filter((product)=> String(product.kategoria_id)=== String(kategoria_id)) : katalog
  const [randomIndex,setRandomIndex] = useState(0)

  const [kategorie,setKategorie] = useState<CategoryApiItem[]>([]);
  const [produkty,setProdukty] = useState<ApiItem[]>([]);
  const [loading,setLoading] = useState(true)
  const [error,setEror] = useState<string | null>(null)


    useEffect (()=> {
    async function zaladujKategorie(){
      try {
        const response = await pobierzKategorie()

        setKategorie(response)
      }
      catch(error){
        setEror(error instanceof Error ? error.message : "Nieznany bład")
      }
      finally {
        setLoading(false)
      }
  
    }
  
    async function zaladujProdukty() {
      try {
        const response = await pobierzProdukty()

        setProdukty(response.dane);
      }
      catch(error){
        setEror(error instanceof Error ? error.message : "Nieznany bład")
      }
      finally {
        setLoading(false)
      }
      
    }
     void zaladujKategorie();
    void zaladujProdukty();


  },[]);



  const calculate_time_left =()=> {
    const now = new Date()
    let target = new Date(now)
    const todayString = now.toDateString();
    {/* ustawienie timera na reset nowej oferty */}
    target.setHours(RESET_HOUR,RESET_MINUTE,0,0)

    if(now >= target ) {
      {/*Ustawienie nowego licznika jak poprzedni sie skonczyl */}
      target.setDate(target.getDate() +1)
    }


    
   const shouldResetToday = now.getHours() > RESET_HOUR || 
                          (now.getHours() === RESET_HOUR && now.getMinutes() >= RESET_MINUTE);


  if (shouldResetToday && lastResetDate !== todayString) {
    const new_random_index = Math.floor(Math.random() * produkty.length);
    setRandomIndex(new_random_index);
    
    console.log("Reset oferty - nowy indeks:", new_random_index);
    setLastResetDate(todayString);
  }

    const diffMs = target.getTime() - now.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    setTimeLeft({ hours, minutes, seconds });

  }


  useEffect(()=> {
      calculate_time_left();
      const interval = setInterval(calculate_time_left,1000)
        
      return () => clearInterval(interval);
  },[lastResetDate])
  
  return (
  
    <PageLayout> 
      {/* HEADER */}
      
        {/*CONTROLS */}
        {/*Przenoszenie do odpowiednich widokow */}

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

            <View style={styles.offerTimerWrapper}>
        <Text style={styles.offerTimerLabel}>NOWA OFERTA JUŻ ZA</Text>
        
        <View style={styles.timerRow}>
          <View style={styles.timerSegment}>
            <Text style={styles.timerValue}>{timeLeft.hours}</Text>
            <Text style={styles.timerLabel}>GODZ</Text>
          </View>

          <Text style={styles.timerColon}>:</Text>

          <View style={styles.timerSegment}>
            <Text style={styles.timerValue}>{timeLeft.minutes}</Text>
            <Text style={styles.timerLabel}>MIN</Text>
          </View>

          <Text style={styles.timerColon}>:</Text>

          <View style={styles.timerSegment}>
            <Text style={styles.timerValue}>{timeLeft.seconds}</Text>
            <Text style={styles.timerLabel}>SEK</Text>
          </View>
        </View>
      </View>

            <Text style={styles.offerTopText}>Specjalna oferta dla Ciebie</Text>

            <Text style={styles.offerTitle}>Wypożycz sprzęt taniej</Text>

            <Text style={styles.offerSubtitle} numberOfLines={2}>
              {produkty[randomIndex]?.nazwa ||
                "Wybrany produkt dostępny już dziś"}
            </Text>
                    

          {/* TEMP CENA */}
            <View style={styles.offerPriceRow}>
              {/*PROMOCJA 5% */}
              <Text style={styles.offerPrice}>{produkty?.[randomIndex]?.cena_po_promocji !=undefined && produkty?.[randomIndex]?.cena_po_promocji} </Text>
              <Text style={styles.offerOldPrice}>{produkty?.[randomIndex]?.cena}</Text>
            </View>

            <Pressable style={styles.offerButton} onPress={()=> router.replace(`../products/${produkty[randomIndex]?.id}`)}>
              <Text style={styles.offerButtonText}>Zobacz ofertę</Text>
            </Pressable>
          </View>

          <Image
            source={{ uri: produkty[randomIndex]?.zdjecia_url["1"] }}
            style={styles.offerImage}
            resizeMode="contain"
          />
        </LinearGradient>
      </View>

      {/* KATEGORIE HEADER */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kategorie</Text>

        <View style={styles.sectionActions}>
          <Pressable style={styles.allButton} onPress={()=> router.push("/catalog/catalog")}>
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
        
        <Pressable onPress={()=> router.push("/catalog/promotions")} style={[styles.categoryCardActive]}>
          <View style={styles.categoryIconBoxActive}> 
  <MaterialIcons name={"discount"} size={32}
                color="#F43F5E"/>
          </View>
      <Text style={styles.categoryNameActive}>Promocje</Text>
        </Pressable>
   <FlatList
       data={kategorie}
    keyExtractor={(elem)=> elem.id.toString()}
    numColumns={4}
    renderItem={({item})=> (     <Pressable style={styles.categoryCard}  onPress={()=> router.push(`/catalog/category/${item.id}`)}>   <View style={styles.categoryIconBoxActive}> 
  <Image source={{uri : item.zdjecie_url}} style={styles.categoryImage}/>
          </View> 
           <Text style={styles.categoryName}>{item.nazwa}</Text> </Pressable>)}
      
      />
      </View>

      {/* BESTSELLERY HEADER */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bestsellery</Text>

        <Pressable style={styles.seeAllButton} onPress={()=> router.push("/catalog/catalog")}>
          <Text style={styles.seeAllText}>Zobacz wszystkie</Text>
          <MaterialIcons name="chevron-right" size={22} color="#176BDE" />
        </Pressable>
      </View>

      {/* KATALOG -> PRODUKTY/BESTSELLERY*/}
      <FlatList
        data={produkty}
        keyExtractor={(item) => item.id.toString()}
        numColumns={4}
        scrollEnabled={false}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productsList}
        renderItem={({ item }) => ( <ProductCard item={{...item,opis : item.opis ?? "", zdjecie_url : item.zdjecia_url["1"]}} />
        )}
      />
    </PageLayout>
);
}

const styles = StyleSheet.create({
  offerCardWrapper: {
    marginTop: 24,
    width: "100%",
    borderRadius: 28,

    shadowColor: "#2F80ED",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 1,
    zIndex : 1,
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
    zIndex : 1,
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
    height: 340,
    zIndex: 2,
  },
   sectionHeader: {
    marginTop: 34,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
  },

  sectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  allButton: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  allButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  categoriesRow: {
    width: "100%",
    flexDirection: "row",
    gap: 16,
  },

  categoryCard: {
    flex: 1,
    minHeight: 118,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8EEF7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },

  categoryCardActive: {
       flex: 1,
    minHeight: 118,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    backgroundColor: "#FFEAF0",
    borderColor: "#FFD0DC",
  },

  categoryIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#EEF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  categoryIconBoxActive: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },

  categoryName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  categoryNameActive: {
    fontSize: 15,
    fontWeight: "800",
    color: "#F43F5E",
    textAlign: "center",
  },
  seeAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },

  seeAllText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#176BDE",
  },

  productsList: {
    paddingBottom: 20,
  },

  productRow: {
    gap: 16,
    marginBottom: 16,
  },

  offerTimerWrapper: {
  backgroundColor: "rgba(255,255,255,0.16)",
  borderRadius: 20,
  paddingVertical: 12,
  paddingHorizontal: 20,
  alignSelf: "flex-start",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.25)",
  marginBottom: 20,
},

offerTimerLabel: {
  color: "rgba(255, 255, 255, 0.85)",
  fontSize: 13,
  fontWeight: "700",
  letterSpacing: 1,
  textAlign: "center",
  marginBottom: 8,
},

timerRow: {
  flexDirection: "row",
  alignItems: "center",
},

timerSegment: {
  alignItems: "center",
  minWidth: 62,
},

timerValue: {
  fontSize: 28,
  fontWeight: "900",
  color: "#FFFFFF",
  lineHeight: 30,
},

timerLabel: {
  fontSize: 11,
  fontWeight: "700",
  color: "rgba(255,255,255,0.75)",
  marginTop: 4,
  letterSpacing: 0.5,
},

timerColon: {
  fontSize: 28,
  fontWeight: "300",
  color: "rgba(255,255,255,0.65)",
  marginHorizontal: 10,
  paddingBottom: 6,
},
categoryImage :{
  width : 32,
  height : 32,
}


});