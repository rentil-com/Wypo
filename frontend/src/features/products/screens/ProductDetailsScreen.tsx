import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import Breadcrumbs from "@components/shared/Breadcrumbs/Breadcrumbs";
import PageLayout from "@components/shared/Layout/PageLayout";
import { pobierzPojedynczyProdukt, type SingleProductApiItem } from "@features/products";
import { pobierzKategoriePoId, type CategoryApiItem } from "@features/categories";
import ProductReviewsSection from "@features/reviews/screens/ProductReviewsSection";
import type { ProductReviewsResponse } from '@features/reviews/reviews.types';
import { pobierzWszystkieRecenzjeProduktu } from "@features/reviews/reviews.services";
import { dodajZdjeciaProduktu, edytujProdukt, usunZdjeciaProduktu } from "../products.management.services";
import type { ProductSpecificationBody, ProductStatus } from "../products.management.types";
import adminStyles from "./ProductAdminForm.styles";



export default function ProductDetailedView() {
  const { user } = useAuth();
  const isAdmin = user?.rola === "admin";
  {/* STATUSY SPRZETU */}
  type StatusSprzetu = "dostepny" | "wypozyczony" | "w_naprawie" | "niedostepny";

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
      niedostepny: {
  label: "Niedostępny",
  backgroundColor: "#FEE2E2",
  textColor: "#991B1B",
  icon: "cancel",
},
  };
  const [reviews, setReviews] = useState<ProductReviewsResponse | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const [kategoria,setKategoria] = useState<CategoryApiItem>();
  const [pojedynczyProdukt,setPojedynczyProdukt] = useState<SingleProductApiItem>();
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState<string | null>(null)
  {/* STANY I PARAMETRY */}
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const [trybEdycji,setTrybEdycji] = useState(edit === "true");
  const [cena,setCena] = useState("");
  const [opis,setOpis] = useState("");
  const [statusProduktu,setStatusProduktu] = useState<ProductStatus>("dostepny");
  const [specyfikacje,setSpecyfikacje] = useState<ProductSpecificationBody[]>([]);
  const [noweZdjecia,setNoweZdjecia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [zdjeciaDoUsuniecia,setZdjeciaDoUsuniecia] = useState<number[]>([]);
  {/* index = aktualne zdjecie w galerii */}
  const [indexaktualneZdjecie, setindexaktualneZdjecie] = useState(0);
  const wpisyZdjec = pojedynczyProdukt
    ? Object.entries(pojedynczyProdukt.zdjecia_url).filter(([numer]) => !zdjeciaDoUsuniecia.includes(Number(numer)))
    : [];
  const zdjecia = wpisyZdjec.map(([,zdjecie]) => zdjecie);
  const edytowanie = isAdmin && trybEdycji;
  {/* SUGESTIE WYSZUKIWANIA */}
 
    useEffect (()=> {


      async function zaladujProdukty() {
        setError(null);
        setLoading(true);

        try {
          const produkt = await pobierzPojedynczyProdukt(Number(id))
  
          setPojedynczyProdukt(produkt);
          setCena(produkt.cena.toString());
          setOpis(produkt.opis ?? "");
          setStatusProduktu(produkt.status as ProductStatus);
          setSpecyfikacje(produkt.specyfikacje.map((specyfikacja) => ({
            nazwa_specyfikacji: specyfikacja.nazwa_specyfikacji,
            opis_specyfikacji: specyfikacja.opis_specyfikacji,
            emotka_specyfikacji: specyfikacja.emotka_specyfikacji ?? null,
          })));
          setNoweZdjecia([]);
          setZdjeciaDoUsuniecia([]);
          setindexaktualneZdjecie(0);

          const pobranaKategoria = await pobierzKategoriePoId(Number(produkt.kategoria_id))
          setKategoria(pobranaKategoria)
        }
        catch(error){
          setError(error instanceof Error ? error.message : "Nieznany błąd")
        }
        finally {
          setLoading(false)
        }
        
      }
     

      void zaladujProdukty();
  
    }, [id]);

    useEffect(() => {
      if (edit === "true") setTrybEdycji(true);
    }, [edit]);
  
    useEffect(() => {
    async function zaladujRecenzje() {
      setReviewsError(null);
      setReviewsLoading(true);

      try {
        const response =
          await pobierzWszystkieRecenzjeProduktu(Number(id));

        setReviews(response);
      } catch (error) {
        setReviewsError(
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać recenzji",
        );
      } finally {
        setReviewsLoading(false);
      }
    }

    void zaladujRecenzje();
  }, [id]);

  {/* TYMCZASOWA GALERIA ZDJEC, NARAZIE MAM JEDNO ZDJECIE (POTEM BEDZIE WIELE) */}

  if (loading) {
    return (
      <View style={styles.screen}>
        <Text>Ładowanie produktu...</Text>
      </View>
    );
  }

  if (!pojedynczyProdukt) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>
          {error ?? "Nie znaleziono produktu."}
        </Text>
      </View>
    );
  }

  const wybierzZdjecie = async () => {
    setError(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (result.assets) setNoweZdjecia([...noweZdjecia, result.assets[0]]);
  };

  const usunNoweZdjecie = (index: number) => {
    const pozostaleZdjecia = [...noweZdjecia];
    pozostaleZdjecia.splice(index, 1);
    setNoweZdjecia(pozostaleZdjecia);
  };

  const usunAktualneZdjecie = () => {
    const aktualneZdjecie = wpisyZdjec[indexaktualneZdjecie];
    if (!aktualneZdjecie) return;

    setZdjeciaDoUsuniecia([...zdjeciaDoUsuniecia, Number(aktualneZdjecie[0])]);
    setindexaktualneZdjecie(0);
  };

  const dodajSpecyfikacje = () => {
    setSpecyfikacje([
      ...specyfikacje,
      {
        nazwa_specyfikacji: "",
        opis_specyfikacji: "",
        emotka_specyfikacji: null,
      },
    ]);
  };

  const usunSpecyfikacje = (index: number) => {
    const noweSpecyfikacje = [...specyfikacje];
    noweSpecyfikacje.splice(index, 1);
    setSpecyfikacje(noweSpecyfikacje);
  };

  const anulujEdycje = () => {
    setCena(pojedynczyProdukt.cena.toString());
    setOpis(pojedynczyProdukt.opis ?? "");
    setStatusProduktu(pojedynczyProdukt.status as ProductStatus);
    setSpecyfikacje(pojedynczyProdukt.specyfikacje.map((specyfikacja) => ({
      nazwa_specyfikacji: specyfikacja.nazwa_specyfikacji,
      opis_specyfikacji: specyfikacja.opis_specyfikacji,
      emotka_specyfikacji: specyfikacja.emotka_specyfikacji ?? null,
    })));
    setNoweZdjecia([]);
    setZdjeciaDoUsuniecia([]);
    setindexaktualneZdjecie(0);
    setError(null);
    setTrybEdycji(false);
  };

  const zapiszZmiany = async () => {
    setError(null);

    const poprawnaCena = cena.trim().replace(",", ".");
    const poprawnyOpis = opis.trim();
    const poprawneSpecyfikacje: ProductSpecificationBody[] = [];

    if (!poprawnaCena || Number.isNaN(Number(poprawnaCena)) || Number(poprawnaCena) < 0) {
      setError("Podaj poprawną cenę produktu");
      return;
    }

    for (const specyfikacja of specyfikacje) {
      const poprawnaNazwa = specyfikacja.nazwa_specyfikacji.trim();
      const poprawnyOpisSpecyfikacji = specyfikacja.opis_specyfikacji.trim();
      const poprawnaEmotka = specyfikacja.emotka_specyfikacji?.trim() ?? "";

      if (!poprawnaNazwa || !poprawnyOpisSpecyfikacji) {
        setError("Nazwa i opis każdej specyfikacji są wymagane");
        return;
      }

      poprawneSpecyfikacje.push({
        nazwa_specyfikacji: poprawnaNazwa,
        opis_specyfikacji: poprawnyOpisSpecyfikacji,
        emotka_specyfikacji: poprawnaEmotka || null,
      });
    }

    setLoading(true);

    try {
      await edytujProdukt(pojedynczyProdukt.id, {
        cena: poprawnaCena,
        opis: poprawnyOpis || null,
        status: statusProduktu,
        specyfikacje: poprawneSpecyfikacje,
      });

      if (zdjeciaDoUsuniecia.length > 0) {
        await usunZdjeciaProduktu(pojedynczyProdukt.id, { zdjecia: zdjeciaDoUsuniecia });
      }

      if (noweZdjecia.length > 0) {
        const formData = new FormData();

        for (const zdjecie of noweZdjecia) {
          if (zdjecie.file) {
            formData.append("zdjecia", zdjecie.file);
          } else {
            formData.append(
              "zdjecia",
              {
                uri: zdjecie.uri,
                name: zdjecie.fileName ?? "produkt.jpg",
                type: zdjecie.mimeType ?? "image/jpeg",
              } as any,
            );
          }
        }

        await dodajZdjeciaProduktu(pojedynczyProdukt.id, formData);
      }

      const produkt = await pobierzPojedynczyProdukt(pojedynczyProdukt.id);
      setPojedynczyProdukt(produkt);
      setCena(produkt.cena.toString());
      setOpis(produkt.opis ?? "");
      setStatusProduktu(produkt.status as ProductStatus);
      setSpecyfikacje(produkt.specyfikacje.map((specyfikacja) => ({
        nazwa_specyfikacji: specyfikacja.nazwa_specyfikacji,
        opis_specyfikacji: specyfikacja.opis_specyfikacji,
        emotka_specyfikacji: specyfikacja.emotka_specyfikacji ?? null,
      })));
      setNoweZdjecia([]);
      setZdjeciaDoUsuniecia([]);
      setindexaktualneZdjecie(0);
      setTrybEdycji(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Nie udało się edytować produktu");
    } finally {
      setLoading(false);
    }
  };

  {/* FUNKCJE GALERII */}
  const przejdzDoNastepnegoZdjecia = () => {
    let nowy_index = indexaktualneZdjecie + 1;

    if (nowy_index >= zdjecia.length) {
      nowy_index = 0;
    }

    setindexaktualneZdjecie(nowy_index);
  };

  const przejdzDoPoprzedniegoZdjecia = () => {
    let nowy_index = indexaktualneZdjecie - 1;

    if (nowy_index < 0) {
      nowy_index = zdjecia.length - 1;
    }

    setindexaktualneZdjecie(nowy_index);

  };



  return (
   <PageLayout>
         

          {/* SCIEZKA KATEGORII */}
          <Breadcrumbs
  items={[
      {
        label:
          kategoria?.nazwa ??
          "Kategoria",

        href: `/catalog/category/${pojedynczyProdukt.kategoria_id}`,
      },
      {
        label: pojedynczyProdukt.nazwa,
      },
    ]}
  />

          {isAdmin && (
            <View style={styles.adminToolbar}>
              <View style={styles.adminBadge}>
                <MaterialIcons name="admin-panel-settings" size={18} color="#1D4ED8" />
                <Text style={styles.adminBadgeText}>TRYB ADMINISTRATORA</Text>
              </View>

              <View style={styles.adminToolbarActions}>
                {!edytowanie && (
                  <Pressable style={styles.editProductButton} onPress={() => setTrybEdycji(true)}>
                    <MaterialIcons name="edit" size={18} color="#1D4ED8" />
                    <Text style={styles.editProductButtonText}>Edytuj produkt</Text>
                  </Pressable>
                )}

                {edytowanie && (
                  <>
                    <Pressable style={styles.cancelEditButton} onPress={() => anulujEdycje()}>
                      <Text style={styles.cancelEditButtonText}>Anuluj</Text>
                    </Pressable>
                    <Pressable style={styles.saveProductButton} onPress={() => zapiszZmiany()}>
                      <MaterialIcons name="save" size={18} color="#FFFFFF" />
                      <Text style={styles.saveProductButtonText}>Zapisz zmiany</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          )}

          {error && <Text style={styles.adminErrorText}>{error}</Text>}

          {/* SEKCJA PRODUKTU */}
          <View style={styles.productSection}>
            {/* GALERIA ZDJEC */}
            <View style={styles.galleryCard}>
              {edytowanie && (
                <View style={styles.galleryEditActions}>
                  <Pressable style={styles.addImageButton} onPress={() => wybierzZdjecie()}>
                    <MaterialIcons name="add-photo-alternate" size={18} color="#1D4ED8" />
                    <Text style={styles.addImageButtonText}>Dodaj zdjęcie</Text>
                  </Pressable>

                  {zdjecia.length > 0 && (
                    <Pressable style={styles.deleteImageButton} onPress={() => usunAktualneZdjecie()}>
                      <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
                      <Text style={styles.deleteImageButtonText}>Usuń to zdjęcie</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {/* ILOSC ZDJEC NA ILE */}
                  {zdjecia.length > 0 ? indexaktualneZdjecie + 1 : 0} / {zdjecia.length}
                </Text>
              </View>

              {/* COFNIECIE ZDJECIA */}
              {zdjecia.length > 1 && (
                <Pressable
                  onPress={() => przejdzDoPoprzedniegoZdjecia()}
                  style={[styles.galleryArrow, styles.galleryArrowLeft]}
                >
                  <MaterialIcons name="chevron-left" size={28} color="#0F172A" />
                </Pressable>
              )}

              {/* GLOWNE ZDJECIE PRODUKTU */}
              <View style={styles.mainImageBox}>
                {zdjecia.length > 0 ? (
                  <Image
                    source={{ uri: zdjecia[indexaktualneZdjecie] }}
                    style={styles.mainProductImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.emptyGalleryText}>Brak zdjęć produktu</Text>
                )}
              </View>

              {/* KOLEJNE ZDJECIE */}
              {zdjecia.length > 1 && (
                <Pressable
                  onPress={() => przejdzDoNastepnegoZdjecia()}
                  style={[styles.galleryArrow, styles.galleryArrowRight]}
                >
                  <MaterialIcons name="chevron-right" size={28} color="#0F172A" />
                </Pressable>
              )}

              {/* MINIATURY ZDJEC */}
              <View style={styles.thumbnailRow}>
                {zdjecia.map((image,index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.thumbnailBox,
                      indexaktualneZdjecie === index && styles.thumbnailBoxActive,
                    ]}
                    onPress={() => setindexaktualneZdjecie(index)}
                  >
                    <Image source={{ uri: image }} style={styles.thumbnailImage} resizeMode="contain" />
                  </Pressable>
                ))}
              </View>

              {edytowanie && noweZdjecia.length > 0 && (
                <View style={styles.newImagesSection}>
                  <Text style={styles.newImagesTitle}>Nowe zdjęcia do zapisania</Text>
                  <View style={adminStyles.imagesPreview}>
                    {noweZdjecia.map((zdjecie,index) => (
                      <View key={`${zdjecie.uri}-${index}`} style={adminStyles.imagePreview}>
                        <Image source={{ uri: zdjecie.uri }} style={adminStyles.image} />
                        <Pressable style={adminStyles.removeImageButton} onPress={() => usunNoweZdjecie(index)}>
                          <MaterialIcons name="close" size={17} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* PRAWA STRONA - SZCZEGOLY */}
            <View style={styles.detailsCard}>
              {edytowanie && (
                <View>
                  <Text style={styles.productTitle}>{pojedynczyProdukt.nazwa}</Text>

                  <View style={adminStyles.field}>
                    <Text style={adminStyles.fieldLabel}>Status produktu</Text>
                    <View style={adminStyles.selectWrapper}>
                      <Picker
                        selectedValue={statusProduktu}
                        onValueChange={(value) => setStatusProduktu(value as ProductStatus)}
                        style={adminStyles.picker}
                      >
                        <Picker.Item label="Dostępny" value="dostepny" />
                        <Picker.Item label="Wypożyczony" value="wypozyczony" />
                        <Picker.Item label="W naprawie" value="w_naprawie" />
                      </Picker>
                    </View>
                  </View>

                  <View style={adminStyles.field}>
                    <Text style={adminStyles.fieldLabel}>Cena</Text>
                    <TextInput
                      value={cena}
                      onChangeText={setCena}
                      style={adminStyles.input}
                      placeholder="Np. 49.99"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={adminStyles.field}>
                    <Text style={adminStyles.fieldLabel}>Opis produktu</Text>
                    <TextInput
                      value={opis}
                      onChangeText={setOpis}
                      style={[adminStyles.input, adminStyles.textArea]}
                      placeholder="Opis produktu"
                      placeholderTextColor="#94A3B8"
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.editDivider} />

                  <View style={adminStyles.sectionHeadingRow}>
                    <Text style={adminStyles.sectionTitle}>Specyfikacje</Text>
                    <Pressable style={adminStyles.addSpecificationButton} onPress={() => dodajSpecyfikacje()}>
                      <MaterialIcons name="add" size={17} color="#1D4ED8" />
                      <Text style={adminStyles.addSpecificationText}>Dodaj specyfikację</Text>
                    </Pressable>
                  </View>

                  {specyfikacje.map((specyfikacja,index) => (
                    <View key={index} style={adminStyles.specificationCard}>
                      <View style={adminStyles.specificationHeader}>
                        <Text style={adminStyles.specificationTitle}>Specyfikacja {index + 1}</Text>
                        <Pressable style={adminStyles.removeSpecificationButton} onPress={() => usunSpecyfikacje(index)}>
                          <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
                        </Pressable>
                      </View>

                      <View style={styles.specificationEditFields}>
                        <TextInput
                          value={specyfikacja.nazwa_specyfikacji}
                          onChangeText={(value) => {
                            const noweSpecyfikacje = [...specyfikacje];
                            noweSpecyfikacje[index] = { ...specyfikacja, nazwa_specyfikacji: value };
                            setSpecyfikacje(noweSpecyfikacje);
                          }}
                          style={adminStyles.input}
                          placeholder="Nazwa specyfikacji"
                          placeholderTextColor="#94A3B8"
                        />
                        <TextInput
                          value={specyfikacja.opis_specyfikacji}
                          onChangeText={(value) => {
                            const noweSpecyfikacje = [...specyfikacje];
                            noweSpecyfikacje[index] = { ...specyfikacja, opis_specyfikacji: value };
                            setSpecyfikacje(noweSpecyfikacje);
                          }}
                          style={adminStyles.input}
                          placeholder="Wartość specyfikacji"
                          placeholderTextColor="#94A3B8"
                        />
                        <TextInput
                          value={specyfikacja.emotka_specyfikacji ?? ""}
                          onChangeText={(value) => {
                            const noweSpecyfikacje = [...specyfikacje];
                            noweSpecyfikacje[index] = { ...specyfikacja, emotka_specyfikacji: value || null };
                            setSpecyfikacje(noweSpecyfikacje);
                          }}
                          style={adminStyles.input}
                          placeholder="Ikona, opcjonalnie"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                    </View>
                  ))}

                  {specyfikacje.length === 0 && (
                    <Text style={styles.emptySpecificationsText}>Brak specyfikacji. Możesz dodać pierwszą powyżej.</Text>
                  )}

                  {zdjeciaDoUsuniecia.length > 0 && (
                    <Text style={styles.imagesToDeleteText}>
                      Zdjęcia oznaczone do usunięcia: {zdjeciaDoUsuniecia.length}
                    </Text>
                  )}
                </View>
              )}

              {!edytowanie && (
                <>
              {/* NAZWA PRODUKTU */}
              <Text style={styles.productTitle}>{pojedynczyProdukt?.nazwa}</Text>

              {/* STATUS PRODUKTU */}
              <View >
                <View  />

                <View
                  style={[
                    styles.productStatusBadge,
                    {
                      backgroundColor:
                        statusStyles[pojedynczyProdukt.status as keyof typeof statusStyles].backgroundColor,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={statusStyles[pojedynczyProdukt.status as keyof typeof statusStyles].icon}
                    size={14}
                    color={statusStyles[pojedynczyProdukt.status as keyof typeof statusStyles].textColor}
                  />

                  <Text
                    style={[
                      styles.productStatusText,
                      {
                        color: statusStyles[pojedynczyProdukt.status as keyof typeof statusStyles].textColor,
                      },
                    ]}
                  >
                    {statusStyles[pojedynczyProdukt.status as keyof typeof statusStyles].label}
                  </Text>
                </View>

                {/* OPINIE DO ZOBACZENIA PO KLIKNIECIU */}
                <View style={styles.ratingRow}>
                  <MaterialIcons name="star" size={18} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                  {reviews
                    ? `${reviews.srednia_ocen.toFixed(1)} (${reviews.liczba_recenzji} opinii)`
                    : "Brak opinii"}
                </Text>
                </View>

                {/* CENA PRODUKTU */}
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{pojedynczyProdukt?.cena_aktualna ?? pojedynczyProdukt?.cena}</Text>
                  <Text style={styles.pricePeriod}>/ za okres</Text>
                </View>

                {pojedynczyProdukt?.czy_promocja && pojedynczyProdukt.promocja &&
                <View style={styles.oldPriceRow}>
                  <Text style={styles.oldPrice}>{pojedynczyProdukt.cena}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {pojedynczyProdukt.promocja.typ === "procentowa"
                        ? `-${pojedynczyProdukt.promocja.wartosc}%`
                        : `-${pojedynczyProdukt.promocja.wartosc} zł`}
                    </Text>
                  </View>
                </View>
                    }
                {/* OPIS PRODUKTU */}
                <Text style={styles.description}>{pojedynczyProdukt?.opis}</Text>

                    <View style={styles.specList}>
          {pojedynczyProdukt.specyfikacje.map((specyfikacja) => (
            <View key={specyfikacja.id} style={styles.specRow}>
              <View style={styles.specLeft}>
                <Text style={styles.specEmoji}>
                  {specyfikacja.emotka_specyfikacji}
                </Text>

                <Text style={styles.specLabel}>
                  {specyfikacja.nazwa_specyfikacji}
                </Text>
              </View>

              <Text style={styles.specValue}>
                {specyfikacja.opis_specyfikacji}
              </Text>
            </View>
          ))}

          {pojedynczyProdukt.specyfikacje.length === 0 && (
            <Text style={styles.description}>
              Brak specyfikacji produktu.
            </Text>
          )}
        </View>
                <View style={styles.divider} />

                {/* OKRES WYNAJMU */}
                <View style={styles.periodHeader}>
                  <Text style={styles.periodTitle}>Wybierz okres wynajmu</Text>

                  {/* PRZEKIEROWANIE */}
                  <Pressable style={styles.howItWorksButton}>
                    <MaterialIcons name="info-outline" size={16} color="#2563EB" />
                    <Text style={styles.howItWorksText} onPress={()=> router.push("/(tabs)/howItWorks")}>Jak to działa?</Text>
                  </Pressable>
                </View>

                <View style={styles.periodOptions}>
                  <Pressable style={[styles.periodOption, styles.periodOptionActive]}>
                    <Text style={styles.periodOptionTitleActive}>1 dzień</Text>
                    <Text style={styles.periodOptionPriceActive}>{pojedynczyProdukt?.cena}</Text>
                  </Pressable>
                </View>

                {/* PRZYCISKI INTERAKTYWNE */}
                <Pressable style={styles.primaryButton}>
                  <MaterialIcons name="flash-on" size={22} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Wypożycz teraz</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton}>
                  <MaterialIcons name="shopping-cart" size={22} color="#2563EB" />
                  <Text style={styles.secondaryButtonText}>Dodaj do koszyka</Text>
                </Pressable>
              </View>
                </>
              )}
            </View>
          </View>

          <ProductReviewsSection
            reviews={reviews}
            loading={reviewsLoading}
            error={reviewsError}
          />

          {/* PASEK ZALET */}
          <View style={styles.benefitsBar}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <MaterialIcons name="local-shipping" size={24} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.benefitTitle}>Darmowa dostawa</Text>
                <Text style={styles.benefitText}>Na terenie całej Polski</Text>
              </View>
            </View>

            <View style={styles.benefitDivider} />

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <MaterialIcons name="sync" size={24} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.benefitTitle}>Elastyczny wynajem</Text>
                <Text style={styles.benefitText}>Krótko- i długoterminowy</Text>
              </View>
            </View>

            <View style={styles.benefitDivider} />

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <MaterialIcons name="shield" size={24} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.benefitTitle}>Bezpieczeństwo</Text>
                <Text style={styles.benefitText}>Sprzęt sprawdzony i gotowy</Text>
              </View>
            </View>

            <View style={styles.benefitDivider} />

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <MaterialIcons name="headset-mic" size={24} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.benefitTitle}>Wsparcie 24/7</Text>
                <Text style={styles.benefitText}>Jesteśmy dla Ciebie</Text>
              </View>
            </View>
          </View>
  </PageLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },
  errorText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#EF4444",
    padding: 32,
  },
  adminToolbar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  adminBadgeText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "900",
  },
  adminToolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editProductButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  editProductButtonText: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "800",
  },
  cancelEditButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 16,
  },
  cancelEditButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
  },
  saveProductButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: "#176BDE",
    paddingHorizontal: 16,
  },
  saveProductButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  adminErrorText: {
    width: "100%",
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 14,
  },


  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },

  sideheaderAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  sideheaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  headerDivider: {
    width: 1,
    height: 42,
    backgroundColor: "#E2E8F0",
  },

  /* SCIEZKA KATEGORII */

  category_path: {
    marginTop: 28,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    overflow: "hidden",
    gap: 8,
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

  /* MAIN PRODUCT SECTION */

  productSection: {
    width: "100%",
    flexDirection: "row",
    gap: 24,
    alignItems: "stretch",
    position : "relative",
    zIndex : 1,
  },

  /* LEFT GALLERY */

  galleryCard: {
    flex: 1.65,
    minHeight: 720,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 28,
    position: "relative",

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 5,
  },
  galleryEditActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 100,
  },
  addImageButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
  },
  addImageButtonText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "800",
  },
  deleteImageButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF7F7",
    paddingHorizontal: 14,
  },
  deleteImageButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "800",
  },

  imageCounter: {
    position: "absolute",
    top: 26,
    right: 28,
    zIndex: 10,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  imageCounterText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748B",
  },

  mainImageBox: {
    flex: 1,
    minHeight: 540,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 60,
    paddingTop: 35,
    paddingBottom: 20,
  },

  mainProductImage: {
    width: "100%",
    height: "100%",
    maxHeight: 540,
  },
  emptyGalleryText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "700",
  },

  thumbnailRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 12,
  },

  thumbnailBox: {
    flex: 1,
    height: 96,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },

  thumbnailBoxActive: {
    borderWidth: 2,
    borderColor: "#176BDE",
    backgroundColor: "#F8FBFF",
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  newImagesSection: {
    marginTop: 18,
  },
  newImagesTitle: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
  },

  galleryArrow: {
    position: "absolute",
    top: "48%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  galleryArrowLeft: {
    left: 28,
  },

  galleryArrowRight: {
    right: 28,
  },

  /* PRAWA STRONA - SZCZEGOLY */

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


  detailsCard: {
    flex: 1,
    minHeight: 720,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 30,

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 5,
    position : "relative",
    zIndex : 1,
  },
  editDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginBottom: 24,
  },
  specificationEditFields: {
    gap: 10,
  },
  emptySpecificationsText: {
    color: "#64748B",
    fontSize: 14,
    marginBottom: 16,
  },
  imagesToDeleteText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },

  productTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#07163D",
    marginBottom: 14,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 18,
  },

  availableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  availableDot: {
    width: 11,
    height: 11,
    borderRadius: 99,
    backgroundColor: "#10B981",
  },

  availableText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 4,
  },

  price: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "900",
    color: "#2563EB",
  },

  pricePeriod: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
  },

  oldPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 22,
  },

  oldPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#64748B",
    textDecorationLine: "line-through",
  },

  discountBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  discountText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#059669",
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    color: "#475569",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 24,
  },

  specList: {
    gap: 14,
  },

  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },

  specLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  specLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },

  specValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    textAlign: "right",
  },

  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  periodTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  howItWorksButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  howItWorksText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },

  periodOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  periodOption: {
    flex: 1,
    minHeight: 68,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
  },

  periodOptionActive: {
    borderWidth: 2,
    borderColor: "#2563EB",
    backgroundColor: "#F8FBFF",
  },

  periodOptionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },

  periodOptionTitleActive: {
    fontSize: 15,
    fontWeight: "900",
    color: "#2563EB",
    marginBottom: 6,
  },

  periodOptionPriceActive: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563EB",
  },

  periodPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  periodOldPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    textDecorationLine: "line-through",
  },

  periodDiscount: {
    fontSize: 12,
    fontWeight: "900",
    color: "#059669",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },

  primaryButton: {
    height: 56,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,

    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 5,
  },

  primaryButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  secondaryButton: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2563EB",
  },

  /* PASEK ZALET */

  benefitsBar: {
    marginTop: 24,
    minHeight: 88,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },

  benefitItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  benefitIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  benefitTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },

  benefitText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  benefitDivider: {
    width: 1,
    height: 42,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 20,
  },
  specEmoji: {
  width: 24,
  fontSize: 18,
  textAlign: "center",
},
  
});
  
