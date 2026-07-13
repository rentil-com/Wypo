import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import dane from "../dane.json";
import { useLocalSearchParams } from "expo-router";

export default function User() {
  const { kategoria_id } = useLocalSearchParams();

  {/* CZAS RESETU */}
  const RESET_HOUR = 10
  const RESET_MINUTE = 0
  

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [lastResetDate,setLastResetDate] = useState<string | null>(null);

  const [katalog,setKatalog] = useState(dane)
  const products = kategoria_id ? katalog.filter((product)=> String(product.kategoria_id)=== String(kategoria_id)) : katalog
  const [searchText,setsearchText] = useState("")
  const [randomIndex,setRandomIndex] = useState(0)
  const [showcategoryPanel,setshowcategoryPanel] = useState(false)

  

  {/*statusy Sprzetu */}
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

  
   
  const kategorieMap = new Map();
  kategorieMap.set(1,"Buty")
  kategorieMap.set(2,"Elektronika")
  kategorieMap.set(3,"Narzedzia")
  kategorieMap.set(4,"Sport i rekreacja")



  const suggestions = dane.filter((item)=> item.nazwa.toLowerCase().includes(searchText.trim().toLowerCase()))

  const handleSearchSubmit =()=> {
    const query = searchText.trim()

    router.push({pathname : "../catalog/catalog", params : {query : searchText} })
  }


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
    const new_random_index = Math.floor(Math.random() * dane.length);
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
         <Image source={{uri : "https://wypozyczalnia.calantris.com/logo.svg"}} style={styles.logo} />
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
        <View style={styles.categoryContainer}>
          <Pressable
    style={styles.categoryWrapper}
    onHoverIn={() => setshowcategoryPanel(true)}
    onHoverOut={() => setshowcategoryPanel(false)}
  > 
         <View style={styles.headerSideActions}>
          {/*onHoverIn, onHoverOut - działaja tylko na web , do mobliek dodac onPressIn, onPressOut */}
                <View style={styles.headerInfo}   >
                  <Text style={styles.headerInfoText}>Kategorie</Text>
                </View>
             </View>
      {/*ROZWIJANY PANEL KATEGORII, NARAZIE NIE WSZYSTKIE KATEGORIE */}
      {/*przeniesienie do odpowiedniego widoku kategorii, dodac ikonki do poszczegółnych kategorii */}
      {showcategoryPanel && <View style={styles.categoryPanel} >
        {Array.from(kategorieMap).map(([key,val],index)=>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName} onPress={()=>router.push(`../catalog/category/${key}`)}>{val}</Text>
        </View>
        ) }
        
        </View>
        }
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
              {dane[randomIndex]?.nazwa ||
                "Wybrany produkt dostępny już dziś"}
            </Text>
                    

          {/* TEMP CENA */}
            <View style={styles.offerPriceRow}>
              {/*PROMOCJA 5% */}
              <Text style={styles.offerPrice}>{Math.round(129 * 0.95)}zł</Text>
              <Text style={styles.offerOldPrice}>179,99 zł</Text>
            </View>

            <Pressable style={styles.offerButton} onPress={()=> router.replace(`../products/${dane[randomIndex]?.id}`)}>
              <Text style={styles.offerButtonText}>Zobacz ofertę</Text>
            </Pressable>
          </View>

          <Image
            source={{ uri: dane[randomIndex]?.zdjecie_url }}
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
        
        <Pressable onPress={()=> router.push("../promotions/promotions")} style={[styles.categoryCardActive]}>
          <View style={styles.categoryIconBoxActive}> 
  <MaterialIcons name={"discount"} size={32}
                color="#F43F5E"/>
          </View>
      <Text style={styles.categoryNameActive}>Promocje</Text>
        </Pressable>

        {Array.from(kategorieMap).map(([key, val], index) => (
          <Pressable  onPress={()=> router.push(`../catalog/category/${key}`)}
            key={key}
            style={[
              styles.categoryCard
            
            ]}
          >
            <View
              style={[
                styles.categoryIconBox,
          
              ]}
            >

              {/* IKONKI DLA KATEGORII */}
              <MaterialIcons
                name={
                  index === 0
                    ? "shopping-bag"
                    : index === 1
                    ? "devices"
                    : index === 2
                    ? "build"
                    : "sports-soccer"
                }
                size={32}
                color= "#176BDE"
              />
            </View>

            <Text
              style={styles.categoryName}
            >
              {val}
            </Text>
          </Pressable>
        ))}
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
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={4}
        scrollEnabled={false}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productsList}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <Pressable onPress={()=> router.push(`../products/${item.id}`)}>  
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
                            <View
            style={[
              styles.productStatusBadge,
              {
                backgroundColor:
                  statusStyles[item.status as keyof typeof statusStyles].backgroundColor,
              },
            ]}
          >
            <MaterialIcons
              name={statusStyles[item.status as keyof typeof statusStyles].icon}
              size={14}
              color={statusStyles[item.status as keyof typeof statusStyles].textColor}
            />

            <Text
              style={[
                styles.productStatusText,
                {
                  color: statusStyles[item.status as keyof typeof statusStyles].textColor,
                },
              ]}
            >
              {statusStyles[item.status as keyof typeof statusStyles].label}
            </Text>
          </View>

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

               {/* DODAJ DO KOSZYKA */}
                <Pressable style={styles.addButton}>
                  <MaterialIcons name="add" size={24} color="#176BDE" />
                </Pressable>
              </View>
            </View>
            </Pressable>
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

  productCard: {
    flex: 1,
    minHeight: 310,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    position: "relative",

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },

  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  productImageBox: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 4,
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
  productDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
    minHeight: 36,
  },

  productBottom: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  productPrice: {
    fontSize: 19,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#176BDE",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  scroll: {
  flex: 1,
},

  scrollContent: {
    paddingBottom: 60,
  },
  headerName : {
    fontFamily: 'Arial'
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
categoryPanel : {
 position: "absolute",
  top: "100%",
  left: -20,
  transform: [{ translateX: -110 }],
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#E2E8F0",
  paddingVertical: 8,
  paddingHorizontal: 12,
  paddingTop: 24,           // zwiększone
  width: 220,
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
  elevation: 18,
  zIndex: 300,
  overflow: "hidden",
},
categoryItem : {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 13,
  paddingHorizontal: 16,
  borderRadius: 10,
  marginHorizontal: 4,
},
categoryContainer :{
  position : "relative",
},
categoryWrapper: {
  position: "relative",
},
});