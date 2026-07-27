import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
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
import { styles } from "./ProductDetailsScreen.styles";
import { zlozWniosekOWypozyczenie } from "@features/loans/loans.service";



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
  const [wybranaDataOd,setwybranaDataOd] = useState("")
  const [wybranaDataDo,setwybranaDataDo] = useState("")
  const [wniosekZaczety,setwniosekZaczety] = useState(false)
  const [wniosekLoading,setWniosekLoading] = useState(false)
  const [wniosekError,setWniosekError] = useState<string | null>(null)
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


  const zamknijModalWniosku = () => {
    setwniosekZaczety(false)
    setwybranaDataOd("")
    setwybranaDataDo("")
    setWniosekError(null)
  }

  const wypozyczTeraz = async ()=> {
    const dataOd = wybranaDataOd.trim()
    const dataDo = wybranaDataDo.trim()
    const formatDaty = /^\d{4}-\d{2}-\d{2}$/

    setWniosekError(null)

    if (!formatDaty.test(dataOd) || !formatDaty.test(dataDo)) {
      setWniosekError("Podaj obie daty w formacie RRRR-MM-DD")
      return
    }

    if (dataDo < dataOd) {
      setWniosekError("Data zakończenia nie może być wcześniejsza niż data rozpoczęcia")
      return
    }

    setWniosekLoading(true)

    try {
      await zlozWniosekOWypozyczenie({
        sprzet_id: pojedynczyProdukt.id,
        data_od: dataOd,
        data_do: dataDo,
      })
      zamknijModalWniosku()
    }
    catch(error){
      setWniosekError(error instanceof Error ? error.message : "Nie udało się złożyć wniosku")
    }
    finally {
      setWniosekLoading(false)
    }
  }


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
                  <Text style={styles.price}>{pojedynczyProdukt?.cena_po_promocji !=null ? pojedynczyProdukt.cena_po_promocji : pojedynczyProdukt?.cena}</Text>
                  <Text style={styles.pricePeriod}>/ za okres</Text>
                </View>
                
                {pojedynczyProdukt?.cena_po_promocji !=null && 
                <View style={styles.oldPriceRow}>
                  <Text style={styles.oldPrice}>{pojedynczyProdukt?.cena}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-28%</Text>
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
                <Pressable style={styles.primaryButton} onPress={()=> setwniosekZaczety(true)}>
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

          <Modal
            visible={wniosekZaczety}
            transparent
            animationType="fade"
            onRequestClose={zamknijModalWniosku}
          >
            <View style={styles.loanModalOverlay}>
              <View style={styles.loanModalCard}>
                <View style={styles.loanModalIcon}>
                  <MaterialIcons name="date-range" size={28} color="#2563EB" />
                </View>

                <Text style={styles.loanModalTitle}>Wybierz termin wypożyczenia</Text>
                <Text style={styles.loanModalDescription}>
                  Podaj datę rozpoczęcia i zakończenia wynajmu.
                </Text>

                <View style={styles.loanModalField}>
                  <Text style={styles.loanModalLabel}>Data od</Text>
                  <TextInput
                    value={wybranaDataOd}
                    onChangeText={setwybranaDataOd}
                    placeholder="RRRR-MM-DD"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    style={styles.loanModalInput}
                  />
                </View>

                <View style={styles.loanModalField}>
                  <Text style={styles.loanModalLabel}>Data do</Text>
                  <TextInput
                    value={wybranaDataDo}
                    onChangeText={setwybranaDataDo}
                    placeholder="RRRR-MM-DD"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    style={styles.loanModalInput}
                  />
                </View>

                {wniosekError && (
                  <Text style={styles.loanModalError}>{wniosekError}</Text>
                )}

                <View style={styles.loanModalActions}>
                  <Pressable
                    disabled={wniosekLoading}
                    style={[styles.loanModalButton, styles.loanModalCancelButton]}
                    onPress={zamknijModalWniosku}
                  >
                    <Text style={styles.loanModalCancelText}>Anuluj</Text>
                  </Pressable>

                  <Pressable
                    disabled={wniosekLoading}
                    style={[
                      styles.loanModalButton,
                      styles.loanModalSubmitButton,
                      wniosekLoading && styles.loanModalButtonDisabled,
                    ]}
                    onPress={() => void wypozyczTeraz()}
                  >
                    <Text style={styles.loanModalSubmitText}>
                      {wniosekLoading ? "Składanie..." : "Złóż wniosek"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

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

