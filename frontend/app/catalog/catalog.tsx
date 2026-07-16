import { Tabs, useLocalSearchParams } from "expo-router";
import { View ,Text, FlatList,Image, StyleSheet,Pressable,TextInput} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack } from 'expo-router';
import { ThemedText } from "@/components/themed-text";
import  dane from "../dane.json"
import { useState,useEffect } from "react";
import { pobierzProdukty } from "@/services/products.service";
import type { ApiItem } from "@/types/product";
import { pobierzKategorie } from "@/services/categories.service";
import { pobierzKategoriePoId } from "@/services/categories.service";
import { CategoryApiItem } from "@/types/categories";
import { router } from "expo-router";
import { kategorieMap } from "@/constants/categories";
import Breadcrumbs from "@/components/shared/Breadcrumbs/Breadcrumbs";
import ProductCard from "@/components/shared/Product/ProductCard";
import PageLayout from "@/components/shared/Layout/PageLayout";





{/*props */}
type CatalogViewProps = {
  kategoriaId?: string;
  tylkoPromocje? : boolean;
  promocja? : boolean;
  };


export default function TabsLayout({kategoriaId,tylkoPromocje, promocja} : CatalogViewProps) {
  {/*kategorie-dostepne */}
    

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
        const produkt = await pobierzProdukty()

        setProdukty(produkt.dane);

        const pobranaKategoria = await pobierzKategoriePoId(Number(kategoriaId))
        setKategoria(pobranaKategoria)        
      }
      catch(error){
        setEror(error instanceof Error ? error.message : "Nieznany bład")
      }
      finally {
        setLoading(false)
      }
      
    }
    void zaladujProdukty();
    void zaladujKategorie();

  },[kategoriaId]);

    const [kategorie,setKategorie] =useState<CategoryApiItem[]>([])
    const [produkty,setProdukty] = useState<ApiItem[]>([]);
    const [loading,setLoading] = useState(true)
    const [error,setEror] = useState<string | null>(null)
    const [kategoria,setKategoria] = useState<CategoryApiItem>()
    const [aktualnyIndeks,setaktualnyIndeks] = useState(0)

    const [tab,setTab] = useState(dane)
    const {query} = useLocalSearchParams();
 


    const searchQuery = String(query ?? "").toLowerCase();
    const promocjeAktywne = tylkoPromocje || promocja;
    const tab_filtered = produkty.filter((item)=> {
       const filterSearch = item.nazwa.toLowerCase().includes(searchQuery);
       const filterCategory = !kategoriaId || String(item.kategoria_id) === String(kategoriaId);
       const filterPromotion = !promocjeAktywne 

       return filterSearch && filterCategory && filterPromotion
      })
    

  const handleSwitchPromotion =()=> {
    if(kategoriaId){
          return router.push(promocja ? `/catalog/category/${kategoriaId}` :  `/catalog/category/${kategoriaId}?promocja=true`)
    }

     router.push(tylkoPromocje ? "/catalog/catalog" : "/catalog/promotions")
  }
 
  return (
   <PageLayout wide>
        {/* GŁÓWNA ZAWARTOŚĆ */}
        <View style={styles.mainContent}>

          {/* BREADCRUMBS */}
        <Breadcrumbs items={[{label : "Wszystkie"}]}/>

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
                {kategorie.map((item) => (
  <Pressable
    key={item.id}
    onPress={() => router.push(`/catalog/category/${item.id}`)}
    style={[
      styles.categoryItem,
      String(kategoriaId) === String(item.id) &&
        styles.categoryItemActive,
    ]}
  >
    <ThemedText
      style={[
        styles.categoryText,
        String(kategoriaId) === String(item.id) &&
          styles.categoryTextActive,
      ]}
    >
      {item.nazwa}
    </ThemedText>
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

       {loading && <Text>Ładowanie .....</Text>}
       {error !="" && <Text>{error}</Text>}

  <FlatList
    data={tab_filtered}
    keyExtractor={(elem)=> elem.id.toString()}
    numColumns={4}
    columnWrapperStyle={styles.productsRow}
    contentContainerStyle={styles.productsGrid}
    renderItem={({item})=> (<ProductCard item={{...item,opis : item.opis ?? "",cena_po_promocji : item.cena_po_promocji ?? item.cena, zdjecie_url : item.zdjecia_url["1"]}} />
      )}
/>



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
  </PageLayout>
  );
}

const styles = StyleSheet.create({
  logoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 210,
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




})
