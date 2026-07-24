import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import {
  pobierzPojedynczyProdukt,
  pobierzProdukty,
  type ApiItem,
  type SingleProductApiItem,
} from "@features/products";
import { pobierzKategorie, type CategoryApiItem } from "@features/categories";
import ProductGrid from "@components/shared/Product/ProductGrid";
import PageLayout from "@components/shared/Layout/PageLayout";
import { FavouritesResponse } from "@features/favourites/fav.types";
import { pobierzUlubione } from "@features/favourites/fav.service";
import { pobierzUsuwalneKategorie, usunKategorie } from "@features/categories/categories.management.services";
import {
  czyOdpowiedzDziennejPromocji,
  losujDziennaPromocje,
  type DailyPromotionResponse,
} from "@features/promotions";

const DAILY_PROMOTION_STORAGE_PREFIX = "rentil_daily_promotion_";
const EMPTY_TIME_LEFT = { hours: 0, minutes: 0, seconds: 0 };

type TimeLeft = {
  hours: number;
  minutes: number;
  seconds: number;
};

function pobierzTerminPromocji(response: DailyPromotionResponse) {
  return response.ponowne_losowanie_od || response.promocja.data_do;
}

function czyPromocjaAktywna(response: DailyPromotionResponse) {
  const expiration = new Date(pobierzTerminPromocji(response)).getTime();

  return (
    Number.isFinite(expiration) &&
    expiration > Date.now() &&
    response.promocja.aktywna !== false &&
    response.promocja.stan !== "wygasla" &&
    response.promocja.stan !== "wylaczona"
  );
}

function kluczDziennejPromocji(userId: number) {
  return `${DAILY_PROMOTION_STORAGE_PREFIX}${userId}`;
}

function pobierzZapamietanaPromocje(userId: number) {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    const storedPromotion = localStorage.getItem(kluczDziennejPromocji(userId));

    if (!storedPromotion) {
      return null;
    }

    const parsedPromotion: unknown = JSON.parse(storedPromotion);

    if (
      !czyOdpowiedzDziennejPromocji(parsedPromotion) ||
      !czyPromocjaAktywna(parsedPromotion)
    ) {
      localStorage.removeItem(kluczDziennejPromocji(userId));
      return null;
    }

    return parsedPromotion;
  } catch {
    return null;
  }
}

function zapiszPromocje(
  userId: number,
  promotionResponse: DailyPromotionResponse,
) {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      kluczDziennejPromocji(userId),
      JSON.stringify(promotionResponse),
    );
  } catch {
    // Brak dostepu do pamieci przegladarki nie blokuje losowania.
  }
}

function usunZapamietanaPromocje(userId: number) {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(kluczDziennejPromocji(userId));
  } catch {
    // Brak dostepu do pamieci przegladarki nie blokuje ekranu.
  }
}

function formatujRabat(value: number) {
  return value.toString().replace(".", ",");
}

function obliczCenePoRabacie(price: number, discount: number) {
  return Math.round(price * (100 - discount)) / 100;
}

function formatujCene(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function uzupelnijZero(value: number) {
  return value.toString().padStart(2, "0");
}

export default function User() {
  const { status, user } = useAuth();
  const isAdmin = user?.rola === "admin";
  const isAuthenticated = status === "authenticated" && user !== null;
  const isOfferLocked = status !== "authenticated";

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(EMPTY_TIME_LEFT);
  const [dailyPromotion, setDailyPromotion] = useState<DailyPromotionResponse | null>(null);
  const [dailyProduct, setDailyProduct] = useState<SingleProductApiItem | null>(null);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState<string | null>(null);

  const [ulubioneIds, setUlubioneIds] = useState<FavouritesResponse | null>(null);
  const [kategorie,setKategorie] = useState<CategoryApiItem[]>([]);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryApiItem | null>(null);
  const [produkty,setProdukty] = useState<ApiItem[]>([]);
  const [usuwalneKategorieIds, setUsuwalneKategorieIds] = useState<number[]>([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState<string | null>(null)

  const promotedProductId =
    dailyPromotion?.promocja.zakres_sprzetow.sprzety_ids[0] ?? null;


    useEffect (()=> {
    async function zaladujKategorie(){
      try {
        const response = await pobierzKategorie()

        setKategorie(response)
      }
      catch(error){
        setError(error instanceof Error ? error.message : "Nieznany bład")
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
        setError(error instanceof Error ? error.message : "Nieznany bład")
      }
      finally {
        setLoading(false)
      }
      
    }
     void zaladujKategorie();
    void zaladujProdukty();


  },[]);

  useEffect(() => {
    let cancelled = false;

    async function zaladujUlubione() {
      try {
        const response = await pobierzUlubione();

        if (!cancelled) {
          setUlubioneIds(response);
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

  useEffect(()=> {
    if (!isAdmin) {
    setUsuwalneKategorieIds([]);
    return;
  }
  async function zaladujUsuwalneKategorie() {
    setError(null)
    try {
      const response = await pobierzUsuwalneKategorie()
      setUsuwalneKategorieIds(response)
    }
    catch(error) {
      setError(error instanceof Error ? error.message : "Nie udalo sie pobrac")
    }

  }


  void zaladujUsuwalneKategorie()
  },[isAdmin])


  const usuniecieKategorii  = async () =>{
    setError(null)
    if (!categoryToDelete) {
      return;
    }
    setLoading(true)
    try {
      const response = await usunKategorie(categoryToDelete.id);

      setKategorie((aktualne) =>
        aktualne.filter(
          (kategoria) => kategoria.id !== response.id,
        ),
      );

      setUsuwalneKategorieIds((aktualneIds) =>
        aktualneIds.filter((id) => id !== response.id),
      );

      setCategoryToDelete(null);
      alert("Pomyślnie usunięto kategorię");
  
    }
    catch(error){
      setError(error instanceof Error ? error.message : "Nieznany bład")
    }
    finally {
      setLoading(false)
    }
  
  }
  




  useEffect(() => {
    setPromotionError(null);

    if (!user) {
      setDailyPromotion(null);
      setTimeLeft(EMPTY_TIME_LEFT);
      return;
    }

    setDailyPromotion(pobierzZapamietanaPromocje(user.id));
  }, [user]);

  useEffect(() => {
    if (promotedProductId === null) {
      setDailyProduct(null);
      return;
    }
    const productId = promotedProductId;

    let cancelled = false;

    async function zaladujPromowanyProdukt() {
      try {
        const response = await pobierzPojedynczyProdukt(productId);

        if (!cancelled) {
          setDailyProduct(response);
        }
      } catch (error) {
        if (!cancelled) {
          setDailyProduct(null);
          setPromotionError(
            error instanceof Error
              ? error.message
              : "Nie udało się pobrać wylosowanego sprzętu",
          );
        }
      }
    }

    void zaladujPromowanyProdukt();

    return () => {
      cancelled = true;
    };
  }, [promotedProductId]);

  useEffect(() => {
    if (!dailyPromotion || !user) {
      setTimeLeft(EMPTY_TIME_LEFT);
      return;
    }

    const updateTimer = () => {
      const expiration = new Date(
        pobierzTerminPromocji(dailyPromotion),
      ).getTime();
      const difference = expiration - Date.now();

      if (!Number.isFinite(expiration) || difference <= 0) {
        setDailyPromotion(null);
        setTimeLeft(EMPTY_TIME_LEFT);
        usunZapamietanaPromocje(user.id);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [dailyPromotion, user]);

  const wylosujPromocje = async () => {
    if (!isAuthenticated || !user || promotionLoading) {
      return;
    }

    setPromotionLoading(true);
    setPromotionError(null);

    try {
      const response = await losujDziennaPromocje();

      setDailyPromotion(response);
      zapiszPromocje(user.id, response);

      try {
        const productsResponse = await pobierzProdukty();
        setProdukty(productsResponse.dane);
      } catch {
        // Promocja pozostaje aktywna, nawet gdy odswiezenie produktow sie nie uda.
      }
    } catch (error) {
      setPromotionError(
        error instanceof Error ? error.message : "Nie udało się wylosować promocji",
      );
    } finally {
      setPromotionLoading(false);
    }
  };

  return (
  
    <PageLayout> 
      {/* HEADER */}
      
        {/*CONTROLS */}
        {/*Przenoszenie do odpowiednich widokow */}

      {isAdmin && (
        <View style={styles.adminBadge}>
          <View style={styles.adminBadgeDot} />
          <MaterialIcons name="admin-panel-settings" size={17} color="#176BDE" />
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      )}

      {/* SPECIAL OFFER CARD */}
      <View style={styles.offerCardWrapper}>
        <LinearGradient
          colors={["#2537D9", "#2F80ED", "#65DDE0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.offerCard,
            isOfferLocked && styles.offerCardBlurred,
          ]}
        >
          <View style={styles.offerBubbleOne} />
          <View style={styles.offerBubbleTwo} />

          <View style={styles.offerLeft}>
            {dailyPromotion ? (
              <>
                <View style={styles.offerTimerWrapper}>
                  <Text style={styles.offerTimerLabel}>PROMOCJA WYGASA ZA</Text>

                  <View style={styles.timerRow}>
                    <View style={styles.timerSegment}>
                      <Text style={styles.timerValue}>
                        {uzupelnijZero(timeLeft.hours)}
                      </Text>
                      <Text style={styles.timerLabel}>GODZ</Text>
                    </View>

                    <Text style={styles.timerColon}>:</Text>

                    <View style={styles.timerSegment}>
                      <Text style={styles.timerValue}>
                        {uzupelnijZero(timeLeft.minutes)}
                      </Text>
                      <Text style={styles.timerLabel}>MIN</Text>
                    </View>

                    <Text style={styles.timerColon}>:</Text>

                    <View style={styles.timerSegment}>
                      <Text style={styles.timerValue}>
                        {uzupelnijZero(timeLeft.seconds)}
                      </Text>
                      <Text style={styles.timerLabel}>SEK</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.offerTopText}>Twój wylosowany sprzęt</Text>
                <Text style={styles.offerTitle}>
                  {dailyProduct?.nazwa || "Dzienna promocja"} -{formatujRabat(dailyPromotion.promocja.wartosc)}%
                </Text>
                <Text style={styles.offerSubtitle} numberOfLines={2}>
                  {dailyProduct?.opis ||
                    dailyPromotion.promocja.opis ||
                    "Indywidualny rabat na wylosowany sprzęt."}
                </Text>

                {dailyProduct && (
                  <View style={styles.offerPriceRow}>
                    <Text style={styles.offerPrice}>
                      {formatujCene(
                        obliczCenePoRabacie(
                          dailyProduct.cena,
                          dailyPromotion.promocja.wartosc,
                        ),
                      )} zł / dzień
                    </Text>
                    <Text style={styles.offerOldPrice}>
                      {formatujCene(dailyProduct.cena)} zł
                    </Text>
                  </View>
                )}

                {promotionError && (
                  <Text style={styles.offerError}>{promotionError}</Text>
                )}

                <Pressable
                  style={[
                    styles.offerButton,
                    promotedProductId === null && styles.offerButtonDisabled,
                  ]}
                  disabled={promotedProductId === null}
                  onPress={() =>
                    promotedProductId !== null &&
                    router.push(`/products/${promotedProductId}`)
                  }
                >
                  <Text style={styles.offerButtonText}>Zobacz ofertę</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.offerTopText}>Specjalna oferta dla Ciebie</Text>
                <Text style={styles.offerTitle}>Wylosuj dzienny rabat</Text>
                <Text style={styles.offerSubtitle} numberOfLines={2}>
                  Wylosuj indywidualny rabat na jeden dostępny sprzęt. Promocja
                  będzie ważna przez czas wskazany po losowaniu.
                </Text>

                <Pressable
                  style={[
                    styles.offerButton,
                    (!isAuthenticated || promotionLoading) &&
                      styles.offerButtonDisabled,
                  ]}
                  disabled={!isAuthenticated || promotionLoading}
                  onPress={() => void wylosujPromocje()}
                >
                  <Text style={styles.offerButtonText}>
                    {promotionLoading ? "Losowanie..." : "Wylosuj promocję"}
                  </Text>
                </Pressable>

                {promotionError && (
                  <Text style={styles.offerError}>{promotionError}</Text>
                )}
              </>
            )}
          </View>

          <View style={styles.offerVisual}>
            {dailyProduct?.zdjecia_url["1"] ? (
              <>
                <Image
                  source={{ uri: dailyProduct.zdjecia_url["1"] }}
                  style={styles.offerProductImage}
                  resizeMode="contain"
                />
                <View style={styles.offerDiscountBadge}>
                  <Text style={styles.offerDiscountBadgeText}>
                    -{formatujRabat(dailyPromotion?.promocja.wartosc ?? 0)}%
                  </Text>
                </View>
              </>
            ) : (
              <>
                <MaterialIcons
                  name="local-offer"
                  size={112}
                  color="rgba(255,255,255,0.28)"
                />
                <Text style={styles.offerVisualValue}>
                  {dailyPromotion
                    ? `-${formatujRabat(dailyPromotion.promocja.wartosc)}%`
                    : "?%"}
                </Text>
              </>
            )}
            <Text style={styles.offerVisualLabel}>
              {dailyProduct ? "WYLOSOWANY SPRZĘT" : "TWÓJ DZIENNY RABAT"}
            </Text>
          </View>
        </LinearGradient>

        {isOfferLocked && (
          <View style={styles.offerLockedOverlay}>
            <View style={styles.offerLockedIcon}>
              <MaterialIcons name="lock-outline" size={30} color="#FFFFFF" />
            </View>

            {status === "loading" ? (
              <Text style={styles.offerLockedTitle}>Sprawdzamy sesję...</Text>
            ) : (
              <>
                <Text style={styles.offerLockedTitle}>
                  Zaloguj się, żeby wylosować dzienną promocję
                </Text>
                <Text style={styles.offerLockedDescription}>
                  Rabaty na losowy sprzęt są dostępne tylko dla zalogowanych użytkowników.
                </Text>
                <Pressable
                  style={styles.offerLoginButton}
                  onPress={() => router.push("/")}
                >
                  <Text style={styles.offerLoginButtonText}>Zaloguj się</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </View>

      {/* KATEGORIE HEADER */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kategorie</Text>

        <View style={styles.sectionActions}>
          <Pressable style={styles.allButton} onPress={()=> router.push("/catalog/catalog")}>
            <Text style={styles.allButtonText}>Wszystkie</Text>
          </Pressable>

          {isAdmin && (
            <Pressable
              style={[styles.categoryAdminButton, styles.addCategoryButton]}
              onPress={() => router.push("/category/addCategory")}
            >
              <MaterialIcons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addCategoryButtonText}>Dodaj kategorię</Text>
            </Pressable>
          )}

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
    renderItem={({item})=> {
      const moznaUsunac = usuwalneKategorieIds.includes(item.id);

      return (
        <View style={styles.categoryCardWrapper}>
        <Pressable
          style={styles.categoryCard}
          onPress={()=> router.push(`/catalog/category/${item.id}`)}
        >
          <View style={styles.categoryIconBoxActive}>
            <Image source={{uri : item.zdjecie_url}} style={styles.categoryImage}/>
          </View>
          <Text style={styles.categoryName}>{item.nazwa}</Text>
        </Pressable>

        {isAdmin && (
          <View style={styles.categoryCardAdminActions}>
            <Pressable
              style={[styles.categoryCardAdminButton, styles.categoryEditButton]}
              onPress={() =>
                router.push({
                  pathname: "/category/edit/[id]",
                  params: { id: item.id.toString() },
                })
              }
            >
              <MaterialIcons name="edit" size={15} color="#1D4ED8" />
            </Pressable>

            <Pressable
              style={[
                styles.categoryCardAdminButton,
                styles.categoryDeleteButton,
                !moznaUsunac && styles.categoryDeleteButtonDisabled,
              ]}
              disabled={!moznaUsunac}
              onPress={() => setCategoryToDelete(item)}
            >
              <MaterialIcons
                name="delete-outline"
                size={16}
                color={moznaUsunac ? "#DC2626" : "#94A3B8"}
              />
            </Pressable>
          </View>
        )}
        </View>
      );
    }}
      
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
      <ProductGrid
        ulubioneIds={ulubioneIds ?? []}
        data={produkty}
        scrollEnabled={false}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productsList}
        mapItem={(item) => ({...item,opis : item.opis ?? "", cena_po_promocji: item.czy_promocja ? item.cena_aktualna : null, zdjecie_url : item.zdjecia_url["1"]})}
      />

      <Modal
        transparent
        animationType="fade"
        visible={isAdmin && categoryToDelete !== null}
        onRequestClose={() => setCategoryToDelete(null)}
      >
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModalCard}>
            <View style={styles.categoryModalIcon}>
              <MaterialIcons name="delete-outline" size={30} color="#DC2626" />
            </View>

            <Text style={styles.categoryModalTitle}>Usunąć kategorię?</Text>
            <Text style={styles.categoryModalDescription}>
              Czy na pewno chcesz usunąć kategorię „{categoryToDelete?.nazwa}”?
            </Text>

            <View style={styles.categoryModalActions}>
              <Pressable
                style={[styles.categoryModalButton, styles.categoryModalCancelButton]}
                onPress={() => setCategoryToDelete(null)}
              >
                <Text style={styles.categoryModalCancelText}>Anuluj</Text>
              </Pressable>

              <Pressable
                style={[styles.categoryModalButton, styles.categoryModalDeleteButton]}
                onPress={() => usuniecieKategorii()}
              >
                <Text style={styles.categoryModalDeleteText}>Usuń</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </PageLayout>
);
}

const styles = StyleSheet.create({
  adminBadge: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    marginBottom: -8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  adminBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },

  adminBadgeText: {
    color: "#176BDE",
    fontSize: 13,
    fontWeight: "900",
  },

  offerCardWrapper: {
    marginTop: 24,
    width: "100%",
    borderRadius: 28,
    position: "relative",

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

  offerCardBlurred: {
    filter: "blur(7px)",
    opacity: 0.68,
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
    marginTop: 22,
  },

  offerPrice: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
  },

  offerOldPrice: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 18,
    fontWeight: "700",
    textDecorationLine: "line-through",
  },

  offerVisual: {
    width: 330,
    minHeight: 270,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 2,
  },

  offerProductImage: {
    width: 310,
    height: 245,
  },

  offerDiscountBadge: {
    position: "absolute",
    top: 20,
    right: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },

  offerDiscountBadgeText: {
    color: "#176BDE",
    fontSize: 24,
    fontWeight: "900",
  },

  offerVisualValue: {
    position: "absolute",
    color: "#FFFFFF",
    fontSize: 60,
    fontWeight: "900",
    textShadowColor: "rgba(15,23,42,0.18)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },

  offerVisualLabel: {
    position: "absolute",
    bottom: 30,
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    backgroundColor: "rgba(15,23,42,0.28)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    overflow: "hidden",
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

  offerButtonDisabled: {
    opacity: 0.65,
  },

  offerButtonText: {
    color: "#176BDE",
    fontSize: 16,
    fontWeight: "900",
  },

  offerError: {
    maxWidth: 520,
    marginTop: 14,
    color: "#FEE2E2",
    fontSize: 14,
    fontWeight: "700",
  },

  offerLockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: "rgba(15,23,42,0.46)",
    padding: 32,
  },

  offerLockedIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 16,
  },

  offerLockedTitle: {
    maxWidth: 580,
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    textAlign: "center",
  },

  offerLockedDescription: {
    maxWidth: 520,
    color: "rgba(255,255,255,0.86)",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },

  offerLoginButton: {
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 20,
  },

  offerLoginButtonText: {
    color: "#176BDE",
    fontSize: 15,
    fontWeight: "900",
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

  categoryAdminButton: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },

  addCategoryButton: {
    backgroundColor: "#176BDE",
  },

  addCategoryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
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

  categoryCardWrapper: {
    flex: 1,
    position: "relative",
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

  categoryCardAdminActions: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    gap: 6,
    zIndex: 2,
  },

  categoryCardAdminButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
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
  width: 58,
  height: 58,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 18,
  backgroundColor: "#FEF2F2",
  marginBottom: 16,
},
categoryModalTitle: {
  color: "#0F172A",
  fontSize: 21,
  fontWeight: "900",
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
  height: 48,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 13,
},
categoryModalCancelButton: {
  backgroundColor: "#F1F5F9",
},
categoryModalDeleteButton: {
  backgroundColor: "#DC2626",
},
categoryModalCancelText: {
  color: "#475569",
  fontSize: 14,
  fontWeight: "800",
},
categoryModalDeleteText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "800",
},
categoryImage :{
  width : 32,
  height : 32,
}


});
