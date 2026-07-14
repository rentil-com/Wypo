import { Tabs, useLocalSearchParams } from "expo-router";
import { View ,Text, FlatList,Image, StyleSheet,Pressable,TextInput,ScrollView} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack } from 'expo-router';
import { ThemedText } from "@/components/themed-text";
import  dane from "../dane.json"
import { useState } from "react";
import { router } from "expo-router";


{/*props */}
type CatalogViewProps = {
  kategoriaId?: string;
  tylkoPromocje? : boolean;
  promocja? : boolean;
  };


export default function TabsLayout({kategoriaId,tylkoPromocje, promocja} : CatalogViewProps) {
  {/*kategorie-dostepne */}
    
  const kategorieMap = new Map();
  kategorieMap.set(1,"Buty")
  kategorieMap.set(2,"Elektronika")
  kategorieMap.set(3,"Narzedzia")
  kategorieMap.set(4,"Sport i rekreacja")

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


    const [tab,setTab] = useState(dane)
    const {query} = useLocalSearchParams();
    const [searchText,setsearchText] = useState("")
    const searchQuery = String(query ?? "").toLowerCase();
    const promocjeAktywne = tylkoPromocje || promocja;
    const tab_filtered = tab.filter((item)=> {
       const filterSearch = item.nazwa.toLowerCase().includes(searchQuery);
       const filterCategory = !kategoriaId || String(item.kategoria_id) === String(kategoriaId);
       const filterPromotion = !promocjeAktywne || item.promocja === true

       return filterSearch && filterCategory && filterPromotion
      })
    
    const suggestions = dane.filter((item)=> item.nazwa.toLowerCase().includes(searchText.trim().toLowerCase()))

    const handleSearchSubmit =()=> {
        const query = searchText.trim()

        router.push({pathname : "catalog/catalog", params : {query : searchText} })
    }


  const handleSwitchPromotion =()=> {
    if(kategoriaId){
          return router.push(promocja ? `/catalog/category/${kategoriaId}` :  `/catalog/category/${kategoriaId}?promocja=true`)
    }

     router.push(tylkoPromocje ? "/catalog/catalog" : "/catalog/promotions")
  }
 
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
         <View style={styles.categoryContainer}>
                <View
          style={styles.categoryWrapper}
          onPointerEnter={() => setshowcategoryPanel(true)}
          onPointerLeave={() => setshowcategoryPanel(false)}
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
              </View>
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
        <View style={styles.mainContent}>

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
         
            {/* LEWY PANEL KATEGORII, KATEGORIE MAPOWANE Z DANYCH , NARAZIE PRZYKŁADOWE NIE WSZYSTKO */}
            <View style={styles.catalogLayout}>
              <View style={styles.categoriesSidebar}>   
                 <ThemedText style={styles.sidebarTitle}>
                Kategorie
              </ThemedText>
               <Pressable  onPress={()=> router.push(`/catalog/catalog`)}  style={[styles.categoryItem, !kategoriaId && !tylkoPromocje && styles.categoryItemActive]}>
                <MaterialIcons name="grid-view" size={32} color="#176BDE" style={styles.categoryIcon} />

                    <ThemedText style={[styles.categoryText,!kategoriaId && !tylkoPromocje && styles.categoryTextActive]}>Wszystkie kategorie</ThemedText>

                  </Pressable>
                   <Pressable  onPress={()=> router.push("/catalog/promotions")}  style={[styles.categoryItem,tylkoPromocje && styles.categoryItemActive]}>
                    <MaterialIcons name={"discount"} size={32}
                                    color="#F43F5E" style={styles.categoryIcon}/>
                  

                    <ThemedText style={[styles.categoryText,tylkoPromocje && styles.categoryTextActive]}>Promocje</ThemedText>
                    {/*ikonka do kategorii */}
                   
                  </Pressable>

              {Array.from(kategorieMap).map(([key,val],index)=> (
                  <Pressable key={key} onPress={()=> router.push(`catalog/category/${key}`)}  style={[styles.categoryItem , String(kategoriaId)=== String(key) && styles.categoryItemActive]}>
                    <ThemedText style={[styles.categoryText, String(kategoriaId)=== String(key) && styles.categoryTextActive]}>{val}</ThemedText>
                    {/*ikonka do kategorii */}
                    <ThemedText></ThemedText>
                  </Pressable>
              ))}


</View>

             {/* PRAWA CZĘŚĆ */}
            <View style={styles.catalogContent}>
              {/* PANEL FILTRÓW */}
              <View style={styles.filtersPanel}>
                {/* GÓRNY RZĄD FILTRÓW */}
                <View style={styles.filtersTopRow}>
                  <View  style={styles.filterGroup}>
                    <ThemedText style={styles.filterLabel}>Cena od</ThemedText>
                    <TextInput
                      style={styles.filterInput}
                      placeholder="od 0 zł"
                      placeholderTextColor="#91A0B8"
                    />
                  </View>

                  <View style={styles.filterGroup}>
                    <ThemedText style={styles.filterLabel}>Cena do</ThemedText>
                    <TextInput
                      style={styles.filterInput}
                      placeholder="do 5000 zł"
                      placeholderTextColor="#91A0B8"
                    />
                  </View>

                  <View style={styles.filterGroup}>
                    <ThemedText style={styles.filterLabel}>Cena min</ThemedText>

                    <Pressable style={styles.filterSelect}>
                      <ThemedText style={styles.filterValue}>min. 1 dzień</ThemedText>
                      <ThemedText style={styles.filterChevron}>⌄</ThemedText>
                    </Pressable>
                  </View>

                  <View style={styles.filterGroup}>
                    <ThemedText style={styles.filterLabel}>Cena max</ThemedText>

                    <Pressable style={styles.filterSelect}>
                      <ThemedText style={styles.filterValue}>max. 30 dni</ThemedText>
                      <ThemedText style={styles.filterChevron}>⌄</ThemedText>
                    </Pressable>
                  </View>

                  <View style={styles.filterGroup}>
                    <ThemedText style={styles.filterLabel}>Sortuj</ThemedText>

                    <Pressable style={styles.filterSelect}>
                      <ThemedText style={styles.filterValue}>Cena rosnąco</ThemedText>
                      <ThemedText style={styles.filterChevron}>⌄</ThemedText>
                    </Pressable>
                  </View>

                  <Pressable style={styles.promotionFilter} onPress={()=> handleSwitchPromotion()}>
                    <ThemedText style={styles.promotionIcon}>◆</ThemedText>
                    <ThemedText style={styles.promotionLabel}>Promocja</ThemedText>
                    <View style={[styles.switchTrack, promocjeAktywne && styles.switchTrack1]}>
                      <View style={styles.switchThumb} />
                    </View>
                  </Pressable>
                </View>

                {/* DOLNY RZĄD FILTRÓW */}
                <View style={styles.filtersBottomRow}>
                  <View style={styles.filterActions}>
                    <Pressable style={[styles.filterActionButton, styles.filterActionButtonPrimary]}>
                      <ThemedText style={styles.filterActionIcon}>☷</ThemedText>
                      <ThemedText style={styles.filterActionTextPrimary}>Więcej filtrów</ThemedText>
                    </Pressable>

                    <Pressable style={styles.filterActionButton}>
                      <ThemedText style={styles.filterActionIconMuted}>↻</ThemedText>
                      <ThemedText style={styles.filterActionText}>Wyczyść filtry</ThemedText>
                    </Pressable>
                  </View>

                  <ThemedText style={styles.resultsText}>Znaleziono: 120 produktów</ThemedText>
                </View>
              </View>
             {/* LISTA PRODUKTÓW */}
  <FlatList
    data={tab_filtered}
    keyExtractor={(elem)=> elem.id.toString()}
    numColumns={4}
    columnWrapperStyle={styles.productsRow}
    contentContainerStyle={styles.productsGrid}
    renderItem={({item})=> (
        <View style={styles.productCard}>
          {/*poprawny link do prodkutu */}
          <Pressable onPress={()=> router.push(`../../products/${item.id}`)}>
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
>

</FlatList>

              <View style={styles.pagination}>
                <View style={styles.paginationSide} />

                <View style={styles.paginationPages}>
                  <View style={[styles.paginationButton, styles.paginationButtonDisabled]}>
                    <MaterialIcons name="chevron-left" size={20} color="#B8C4D6" />
                  </View>
                  <View style={[styles.paginationButton, styles.paginationButtonActive]}>
                    <Text style={styles.paginationTextActive}>1</Text>
                  </View>
                  <View style={styles.paginationButton}>
                    <Text style={styles.paginationText}>2</Text>
                  </View>
                  <View style={styles.paginationButton}>
                    <Text style={styles.paginationText}>3</Text>
                  </View>
                  <View style={styles.paginationButton}>
                    <Text style={styles.paginationText}>4</Text>
                  </View>
                  <View style={styles.paginationButton}>
                    <Text style={styles.paginationText}>...</Text>
                  </View>
                  <View style={styles.paginationButton}>
                    <Text style={styles.paginationText}>10</Text>
                  </View>
                  <View style={styles.paginationButton}>
                    <MaterialIcons name="chevron-right" size={20} color="#172033" />
                  </View>
                </View>

                <View style={styles.paginationSide}>
                  <Text style={styles.pageSizeLabel}>Pokaż na stronie:</Text>
                  <View style={styles.pageSizeSelect}>
                    <Text style={styles.pageSizeValue}>12</Text>
                    <MaterialIcons name="expand-more" size={19} color="#172033" />
                  </View>
                </View>
              </View>

              </View>


</View>


    </View>
    </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },

  page: {
    width: "100%",
    maxWidth: 1920,
    alignSelf: "center",
    paddingTop: 16,
    paddingHorizontal: 40,
  },

  header: {
    width: "100%",
    minHeight: 76,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    zIndex : 200,
    position : "relative",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },

  headerName: {
    minWidth: 126,
    alignItems: "flex-start",
    justifyContent: "center",
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
    minWidth: 300,
    maxWidth: 680,
    height: 46,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
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
    gap: 18,
  },

  headerSideActions: {
    flexShrink: 0,
  },

  headerInfo: {
    minHeight: 36,
    justifyContent: "center",
  },

  headerInfoText: {
    color: "#172033",
    fontSize: 13,
    fontWeight: "600",
  },

  headerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },


  headerActionText: {
    fontSize: 13,
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
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 12,
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
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 24,
  },

  pageHeadingContent: {
    flex: 1,
  },

  pageTitle: {
    color: "#111827",
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "900",
  },

  pageDescription: {
    color: "#7A89A6",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },

  productsInfo: {
    minWidth: 220,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    paddingHorizontal: 18,
    paddingVertical: 14,
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
    catalogLayout: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },

  categoriesSidebar: {
    width: 218,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 20,

    shadowColor: "#1E3A8A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.04,
    shadowRadius: 22,
    elevation: 2,
  },
  sidebarTitle: {
    color: "#151D2F",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 14,
    paddingHorizontal: 4,
  },

  categoryItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 11,
    paddingHorizontal: 12,
    marginBottom: 4,
    gap: 12,
  },
  categoryItemActive: {
    backgroundColor: "#EEF4FF",
  },
   categoryText: {
    color: "#263247",
    fontSize: 13,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#176BDE",
    fontWeight: "700",
  },
   categoryIcon: {
    width: 20,
    fontSize: 19,
    textAlign: "center",
  },
  productsGrid: {
    gap: 14,
  },
  productsRow: {
    gap: 12,
  },
   productCard: {
    flex: 1,
    minHeight: 324,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    maxWidth : 500, //ograniczenie rozciagania sie produktu
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
    height: 142,
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
    fontSize: 15,
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
    fontSize: 12,
    lineHeight: 17,
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
    fontSize: 17,
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
    backgroundColor: "#F4F7FC",
  },
  scrollContent: {
    paddingBottom: 34,
  },
  catalogContent: {
    flex: 1,
    minWidth: 0,
  },

  filtersPanel: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 14,

    shadowColor: "#1E3A8A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.04,
    shadowRadius: 22,
    elevation: 2,
  },

  filtersTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
   filterGroup: {
    flex: 1,
    minWidth: 112,
  },
  filterLabel: {
    color: "#273247",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    marginBottom: 7,
  },
  filterInput: {
    width: "100%",
    height: 42,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    borderRadius: 10,
    paddingHorizontal: 13,
    color: "#172033",
    backgroundColor: "#FFFFFF",
    fontSize: 13,
    outlineStyle: "none" as any,
  },
  filterSelect: {
    width: "100%",
    height: 42,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    borderRadius: 10,
    paddingHorizontal: 13,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  filterValue: {
    color: "#8290A8",
    fontSize: 13,
  },
  filterChevron: {
    color: "#557099",
    fontSize: 15,
    lineHeight: 16,
  },
  promotionFilter: {
    width: 178,
    height: 42,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    borderRadius: 10,
    paddingHorizontal: 13,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  promotionIcon: {
    color: "#F43F5E",
    fontSize: 15,
  },
  promotionLabel: {
    flex: 1,
    color: "#273247",
    fontSize: 13,
    fontWeight: "600",
  },
  switchTrack: {
    width: 38,
    height: 21,
    borderRadius: 999,
    padding: 2,
    backgroundColor: "#D8E1ED",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  switchThumb: {
    width: 17,
    height: 17,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  filtersBottomRow: {
    width: "100%",
    marginTop: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  filterActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterActionButton: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    borderRadius: 9,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  filterActionButtonPrimary: {
    borderColor: "#CFE0F8",
  },
  filterActionIcon: {
    color: "#176BDE",
    fontSize: 16,
  },
  filterActionIconMuted: {
    color: "#536987",
    fontSize: 16,
  },
  filterActionTextPrimary: {
    color: "#176BDE",
    fontSize: 12,
    fontWeight: "700",
  },
  filterActionText: {
    color: "#53627A",
    fontSize: 12,
    fontWeight: "600",
  },
  resultsText: {
    color: "#7786A1",
    fontSize: 12,
  },
  pagination: {
    width: "100%",
    minHeight: 44,
    marginTop: 32,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  paginationSide: {
    flex: 1,
    minWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  paginationPages: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  paginationButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: "#E1E8F2",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  paginationButtonDisabled: {
    backgroundColor: "#F9FBFE",
  },
  paginationButtonActive: {
    borderColor: "#176BDE",
    backgroundColor: "#176BDE",
    shadowColor: "#176BDE",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  paginationText: {
    color: "#172033",
    fontSize: 13,
    fontWeight: "600",
  },
  paginationTextActive: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  pageSizeLabel: {
    color: "#7786A1",
    fontSize: 12,
  },
  pageSizeSelect: {
    width: 76,
    height: 40,
    borderWidth: 1,
    borderColor: "#E1E8F2",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageSizeValue: {
    color: "#172033",
    fontSize: 13,
    fontWeight: "700",
  },
  mainContent : {
    width : "100%",
    marginTop : 0,
  },
  switchTrack1 :{ 
    width: 38,
    height: 21,
    borderRadius: 999,
    padding: 2,
    alignItems: "flex-end",
    justifyContent: "center",
    backgroundColor : "red"
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
  paddingTop: 24,           
  width: 220,
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
  elevation: 18,
  zIndex: 300,
  overflow: "hidden",
},
categoryContainer :{
  position : "relative",
},
categoryWrapper: {
  position : "relative",
},
  categoryName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },




})
