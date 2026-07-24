import { router, useLocalSearchParams } from "expo-router";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "@components/themed-text";
import { useEffect, useState } from "react";
import { pobierzProdukty, type ApiItem, type ItemsQueryParams } from "@features/products";
import { pobierzKategorie, type CategoryApiItem } from "@features/categories";
import {
  pobierzUsuwalneKategorie,
  usunKategorie,
} from "@features/categories/categories.management.services";
import Breadcrumbs from "@components/shared/Breadcrumbs/Breadcrumbs";
import ProductGrid from "@components/shared/Product/ProductGrid";
import PageLayout from "@components/shared/Layout/PageLayout";
import { pobierzUlubione } from "@features/favourites/fav.service";
import { FavouritesResponse } from "@features/favourites/fav.types";
import { useAuth } from "@/contexts/AuthContext";

type CatalogViewProps = {
  kategoriaId?: string;
  tylkoPromocje?: boolean;
  promocja?: boolean;
};

export default function TabsLayout({
  kategoriaId,
  tylkoPromocje,
  promocja,
}: CatalogViewProps) {
  const { user } = useAuth();
  const isAdmin = user?.rola === "admin";
  const { search } = useLocalSearchParams<{ search?: string }>();
  const searchQuery = search?.trim() ?? "";

  const [filters, setFilters] = useState<ItemsQueryParams>({
    strona: 1,
    kategoria: kategoriaId ? Number(kategoriaId) : null,
    status: null,
    cena_od: null,
    cena_do: null,
    promocja: Boolean(promocja || tylkoPromocje),
  });
  const [tablicaUlubionych,settablicaUlubionych] = useState<FavouritesResponse | null>(null)
  const [kategorie, setKategorie] = useState<CategoryApiItem[]>([]);
  const [categoryToDelete, setCategoryToDelete] =
    useState<CategoryApiItem | null>(null);
  const [usuwalneKategorieIds, setUsuwalneKategorieIds] = useState<number[]>([]);
  const [produkty, setProdukty] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wybraneSortowanie,setwybraneSortowanie] = useState("")
  useEffect(() => {
    let cancelled = false;

    async function zaladujKategorie() {
      try {
        const response = await pobierzKategorie();
        if (!cancelled) {
          setKategorie(response);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Nieznany błąd");
        }
      }
    }
void zaladujKategorie();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setUsuwalneKategorieIds([]);
      return;
    }

    async function zaladujUsuwalneKategorie() {
      setError(null);

      try {
        const response = await pobierzUsuwalneKategorie();
        setUsuwalneKategorieIds(response);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać kategorii możliwych do usunięcia",
        );
      }
    }

    void zaladujUsuwalneKategorie();
  }, [isAdmin]);

useEffect(() => {
  let cancelled = false;

  async function zaladujUlubione() {
    try {
      const response = await pobierzUlubione();

      if (!cancelled) {
        settablicaUlubionych(response);
      }
    } catch (error) {
      if (!cancelled) {
        setError(
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać ulubionych",
        );
      }
    }
  }

  void zaladujUlubione();

  return () => {
    cancelled = true;
  };
}, []);

  useEffect(() => {
    let cancelled = false;

    async function zaladujProdukty() {
      setLoading(true);
      setError(null);

      try {
        const response = await pobierzProdukty({
          ...filters,
          nazwa: searchQuery || null,
        });

        if (!cancelled) {
          setProdukty(response.dane);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Nieznany błąd");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void zaladujProdukty();

    return () => {
      cancelled = true;
    };
  }, [filters, searchQuery]);

  const clearFilters = () => {
    setFilters({
      strona: 1,
      kategoria: kategoriaId ? Number(kategoriaId) : null,
      status: null,
      cena_od: null,
      cena_do: null,
      promocja: false,
    });

    if (kategoriaId) {
      router.replace(`/catalog/category/${kategoriaId}`);
      return;
    }

    router.replace("/catalog/catalog");
  };

  const promocjeAktywne = filters.promocja === true;

  const handleSwitchPromotion = () => {
    const nowyStan = !filters.promocja;
    setFilters((currentFilters) => ({
      ...currentFilters,
      promocja: nowyStan,
    }));
    router.setParams({
      promocja: nowyStan ? "true" : undefined,
    });
  };

  const handlePriceChange = (value: string) => {
    if (!/^[0-9]*$/.test(value)) {
      alert("Jedynie cyfry");
      return;
    }

    setFilters((currentFilters) => ({
      ...currentFilters,
      cena_od: value === "" ? null : Number(value),
    }));
    router.setParams({ cena_od: value === "" ? undefined : value });
  };

  const handlePriceChangeCenaDo = (value: string) => {
    if (!/^[0-9]*$/.test(value)) {
      alert("Jedynie cyfry");
      return;
    }

    setFilters((currentFilters) => ({
      ...currentFilters,
      cena_do: value === "" ? null : Number(value),
    }));
    router.setParams({ cena_do: value === "" ? undefined : value });
  };

  const getFinalPrice = (product : ApiItem) => {
    return product.cena_po_promocji ?? product.cena
  }
 
  const handleSort = (value : string) => {
    setwybraneSortowanie(value)
    if(value === "asc"){ 
      const ascending = [...produkty].sort((a,b)=> getFinalPrice(a) - getFinalPrice(b))
      setProdukty(ascending)
    }
    else {
      if(value === "desc"){
              const descending = [...produkty].sort((a,b)=> getFinalPrice(b) - getFinalPrice(a))
              setProdukty(descending)
      }
    }
  }

  const usuniecieKategorii = async () => {
    if (!categoryToDelete) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await usunKategorie(categoryToDelete.id);
      setKategorie((currentCategories) =>
        currentCategories.filter((category) => category.id !== response.id),
      );
      setUsuwalneKategorieIds((currentIds) =>
        currentIds.filter((id) => id !== response.id),
      );
      setCategoryToDelete(null);
      alert("Pomyślnie usunięto kategorię");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Nie udało się usunąć kategorii",
      );
    } finally {
      setLoading(false);
    }
  };

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
               {isAdmin && (
              <Pressable
                style={styles.addCategoryButton}
                onPress={() => router.push("/category/addCategory")}
              >
                <MaterialIcons name="add" size={19} color="#FFFFFF" />
                <ThemedText style={styles.addCategoryButtonText}>
                  Dodaj kategorię
                </ThemedText>
              </Pressable>
            )}

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
                {kategorie.map((item) => {
                  const isActive = String(kategoriaId) === String(item.id);
                  const moznaUsunac = usuwalneKategorieIds.includes(item.id);

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.categoryItem,
                        isActive && styles.categoryItemActive,
                      ]}
                    >
                      <Pressable
                        style={styles.categoryItemLink}
                        onPress={() =>
                          router.push(`/catalog/category/${item.id}`)
                        }
                      >
                        <ThemedText
                          numberOfLines={1}
                          style={[
                            styles.categoryText,
                            isActive && styles.categoryTextActive,
                          ]}
                        >
                          {item.nazwa}
                        </ThemedText>
                      </Pressable>

                      {isAdmin && (
                        <View style={styles.categoryAdminActions}>
                          <Pressable
                            style={[
                              styles.categoryAdminButton,
                              styles.categoryEditButton,
                            ]}
                            onPress={() =>
                              router.push({
                                pathname: "/category/edit/[id]",
                                params: { id: item.id.toString() },
                              })
                            }
                          >
                            <MaterialIcons
                              name="edit"
                              size={14}
                              color="#1D4ED8"
                            />
                          </Pressable>

                          <Pressable
                            style={[
                              styles.categoryAdminButton,
                              styles.categoryDeleteButton,
                              !moznaUsunac &&
                                styles.categoryDeleteButtonDisabled,
                            ]}
                            disabled={!moznaUsunac}
                            onPress={() => setCategoryToDelete(item)}
                          >
                            <MaterialIcons
                              name="delete-outline"
                              size={15}
                              color={moznaUsunac ? "#DC2626" : "#94A3B8"}
                            />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}

         

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
                      value={filters.cena_od?.toString() ?? "" }
                      onChangeText={(val)=> handlePriceChange(val)}
                      keyboardType="numeric"
                      
                    />
                  </View>

                  <View style={styles.filterGroup}>
                    <ThemedText style={styles.filterLabel}>Cena do</ThemedText>
                    <TextInput
                    value={filters.cena_do?.toString() ?? ""}
                      style={styles.filterInput}
                      placeholder="do 5000 zł"
                      placeholderTextColor="#91A0B8"
                      onChangeText={handlePriceChangeCenaDo}
                    />
                  </View>
                  <View style={styles.filterGroup}>
                    <ThemedText style={styles.filterLabel}>Sortuj</ThemedText>
                  <Picker selectedValue={wybraneSortowanie?.toString() ?? ""} onValueChange={(val)=> handleSort(val)} style={styles.filterInput}
                  >
                    <Picker.Item label="Rosnaco" value="asc"      />
                    <Picker.Item label="Malejaco" value="desc"      />
                  </Picker>
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

                    <Pressable style={styles.filterActionButton} onPress={()=> clearFilters()}>
                      <ThemedText style={styles.filterActionIconMuted}>↻</ThemedText>
                      <ThemedText style={styles.filterActionText}>Wyczyść filtry</ThemedText>
                    </Pressable>
                  </View>

                  <ThemedText style={styles.resultsText}>Znaleziono: 120 produktów</ThemedText>
                </View>
              </View>
             {/* LISTA PRODUKTÓW */}

       {loading && <Text>Ładowanie .....</Text>}
       {error && <Text>{error}</Text>}

  <ProductGrid
    ulubioneIds ={tablicaUlubionych ??  []}
    data={produkty}
    columnWrapperStyle={styles.productsRow}
    contentContainerStyle={styles.productsGrid}
    mapItem={(item)=> ({...item,opis : item.opis ?? "",cena_po_promocji : item.cena_po_promocji ?? item.cena, zdjecie_url : item.zdjecia_url["1"]})}
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
    <Modal
      transparent
      animationType="fade"
      visible={isAdmin && categoryToDelete !== null}
      onRequestClose={() => setCategoryToDelete(null)}
    >
      <View style={styles.categoryModalOverlay}>
        <View style={styles.categoryModalCard}>
          <View style={styles.categoryModalIcon}>
            <MaterialIcons name="delete-outline" size={26} color="#DC2626" />
          </View>

          <ThemedText style={styles.categoryModalTitle}>
            Usunąć kategorię?
          </ThemedText>
          <ThemedText style={styles.categoryModalDescription}>
            Czy na pewno chcesz usunąć kategorię „{categoryToDelete?.nazwa}”?
          </ThemedText>

          <View style={styles.categoryModalActions}>
            <Pressable
              style={[
                styles.categoryModalButton,
                styles.categoryModalCancelButton,
              ]}
              onPress={() => setCategoryToDelete(null)}
            >
              <ThemedText style={styles.categoryModalCancelText}>
                Anuluj
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.categoryModalButton,
                styles.categoryModalDeleteButton,
              ]}
              onPress={() => void usuniecieKategorii()}
            >
              <ThemedText style={styles.categoryModalDeleteText}>
                Usuń
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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

  addCategoryButton: {
    width: "100%",
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    backgroundColor: "#176BDE",
    paddingHorizontal: 18,
    marginBottom: 10,
  },

  addCategoryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
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
  categoryItemLink: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    justifyContent: "center",
  },
  categoryAdminActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  categoryAdminButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryEditButton: {
    borderColor: "#DBEAFE",
    backgroundColor: "#F8FBFF",
  },
  categoryDeleteButton: {
    borderColor: "#FECACA",
    backgroundColor: "#FFF7F7",
  },
  categoryDeleteButtonDisabled: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    opacity: 0.6,
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
  categoryModalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    paddingHorizontal: 20,
  },
  categoryModalCard: {
    width: "100%",
    maxWidth: 430,
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 30,
  },
  categoryModalIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    marginBottom: 16,
  },
  categoryModalTitle: {
    color: "#172033",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  categoryModalDescription: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
  categoryModalActions: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  categoryModalButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryModalCancelButton: {
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#FFFFFF",
  },
  categoryModalDeleteButton: {
    backgroundColor: "#DC2626",
  },
  categoryModalCancelText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  categoryModalDeleteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },




})
