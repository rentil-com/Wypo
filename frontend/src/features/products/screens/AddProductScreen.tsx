import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@components/shared/Layout/PageLayout";
import {
  pobierzKategorie,
  type CategoryApiItem,
} from "@features/categories";

import { dodajProdukt } from "../products.management.services";
import type { ProductSpecificationBody, ProductStatus } from "../products.management.types";
import styles from "./ProductAdminForm.styles";

export default function AddProductScreen() {
  const { status, user } = useAuth();
  const [nazwa,setNazwa] = useState("");
  const [opis,setOpis] = useState("");
  const [kategoriaId,setKategoriaId] = useState("");
  const [cena,setCena] = useState("");
  const [cenaPoPromocji,setCenaPoPromocji] = useState("");
  const [statusProduktu,setStatusProduktu] = useState<ProductStatus>("dostepny");
  const [zdjecia,setZdjecia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [nazwaSpecyfikacji,setNazwaSpecyfikacji] = useState("");
  const [opisSpecyfikacji,setOpisSpecyfikacji] = useState("");
  const [emotkaSpecyfikacji,setEmotkaSpecyfikacji] = useState("");
  const [specyfikacje,setSpecyfikacje] = useState<ProductSpecificationBody[]>([]);
  const [kategorie,setKategorie] = useState<CategoryApiItem[]>([]);
  const [loadingKategorii,setLoadingKategorii] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState<string | null>(null);

  useEffect(() => {
    async function zaladujKategorie() {
      setError(null);
      setLoadingKategorii(true);

      try {
        const response = await pobierzKategorie();
        setKategorie(response);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Nie udało się pobrać kategorii");
      } finally {
        setLoadingKategorii(false);
      }
    }

    void zaladujKategorie();
  }, []);

  if (status === "loading") {
    return (
      <View style={styles.stateScreen}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (status !== "authenticated" || user?.rola !== "admin") {
    return <Redirect href="/(tabs)/user" />;
  }

  const wybierzZdjecie = async () => {
    setError(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (result.assets) setZdjecia([...zdjecia, result.assets[0]]);
  };

  const dodajSpecyfikacje = () => {
    setError(null);
    const poprawnaNazwa = nazwaSpecyfikacji.trim();
    const poprawnyOpis = opisSpecyfikacji.trim();
    const poprawnaEmotka = emotkaSpecyfikacji.trim();

    if (!poprawnaNazwa || !poprawnyOpis) {
      setError("Nazwa i opis specyfikacji są wymagane");
      return;
    }

    const nowaSpecyfikacja: ProductSpecificationBody = {
      nazwa_specyfikacji: poprawnaNazwa,
      opis_specyfikacji: poprawnyOpis,
      emotka_specyfikacji: poprawnaEmotka || null,
    };

    setSpecyfikacje([...specyfikacje, nowaSpecyfikacja]);
    setNazwaSpecyfikacji("");
    setOpisSpecyfikacji("");
    setEmotkaSpecyfikacji("");
  };

  const usunSpecyfikacje = (index: number) => {
    const noweSpecyfikacje = [...specyfikacje];
    noweSpecyfikacje.splice(index, 1);
    setSpecyfikacje(noweSpecyfikacje);
  };

  const dodaj = async () => {
    setError(null);

    const poprawnaNazwa = nazwa.trim();
    const poprawnyOpis = opis.trim();
    const poprawnaCena = cena.trim().replace(",", ".");
    const poprawnaCenaPoPromocji = cenaPoPromocji.trim().replace(",", ".");

    if (!poprawnaNazwa) {
      setError("Nazwa produktu jest wymagana");
      return;
    }

    if (poprawnaNazwa.length > 100) {
      setError("Nazwa może mieć maksymalnie 100 znaków");
      return;
    }

    if (!kategoriaId) {
      setError("Musisz wybrać kategorię");
      return;
    }

    if (!poprawnaCena) {
      setError("Cena jest wymagana");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("nazwa", poprawnaNazwa);
      formData.append("kategoria_id", kategoriaId);
      formData.append("cena", poprawnaCena);
      formData.append("status", statusProduktu);
      formData.append("specyfikacje", JSON.stringify(specyfikacje));

      if (poprawnyOpis) {
        formData.append("opis", poprawnyOpis);
      }

      if (poprawnaCenaPoPromocji) {
        formData.append("cena_po_promocji", poprawnaCenaPoPromocji);
      }

      for (const zdjecie of zdjecia) {
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

      await dodajProdukt(formData);
      router.back();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Nie udało się dodać produktu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <View style={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={19} color="#1D4ED8" />
          <Text style={styles.backButtonText}>Wróć</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>ADMIN · PRODUKTY</Text>
          <Text style={styles.title}>Dodaj produkt</Text>
          <Text style={styles.description}>
            Uzupełnij dane produktu, wybierz kategorię i dodaj zdjęcia.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Podstawowe informacje</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nazwa produktu</Text>
            <TextInput
              value={nazwa}
              onChangeText={setNazwa}
              style={styles.input}
              placeholder="Np. Wiertarko-wkrętarka Bosch 18V"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Opis produktu</Text>
            <TextInput
              value={opis}
              onChangeText={setOpis}
              style={[styles.input, styles.textArea]}
              placeholder="Opisz produkt"
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.fieldsRow}>
            <View style={styles.rowField}>
              <Text style={styles.fieldLabel}>Kategoria</Text>
              <View style={styles.selectWrapper}>
                <Picker
                  selectedValue={kategoriaId}
                  onValueChange={(value) => setKategoriaId(String(value))}
                  style={styles.picker}
                >
                  <Picker.Item
                    label={
                      loadingKategorii
                        ? "Ładowanie kategorii..."
                        : "Wybierz kategorię"
                    }
                    value=""
                  />
                  {kategorie.map((kategoria) => (
                    <Picker.Item
                      key={kategoria.id}
                      label={kategoria.nazwa}
                      value={kategoria.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.rowField}>
              <Text style={styles.fieldLabel}>Status produktu</Text>
              <View style={styles.selectWrapper}>
                <Picker
                  selectedValue={statusProduktu}
                  onValueChange={(value) => setStatusProduktu(value as ProductStatus)}
                  style={styles.picker}
                >
                  <Picker.Item label="Dostępny" value="dostepny" />
                  <Picker.Item label="Wypożyczony" value="wypozyczony" />
                  <Picker.Item label="W naprawie" value="w_naprawie" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.fieldsRow}>
            <View style={styles.rowField}>
              <Text style={styles.fieldLabel}>Cena za dzień</Text>
              <TextInput
                value={cena}
                onChangeText={setCena}
                style={styles.input}
                placeholder="Np. 49.99"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.rowField}>
              <Text style={styles.fieldLabel}>Cena promocyjna</Text>
              <TextInput
                value={cenaPoPromocji}
                onChangeText={setCenaPoPromocji}
                style={styles.input}
                placeholder="Opcjonalnie, np. 39.99"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Zdjęcia produktu</Text>

          <Pressable style={styles.imagePicker} onPress={wybierzZdjecie}>
            <View style={styles.imagePickerIcon}>
              <MaterialIcons
                name="add-photo-alternate"
                size={27}
                color="#2563EB"
              />
            </View>
            <Text style={styles.imagePickerTitle}>Dodaj zdjęcie</Text>
            <Text style={styles.imagePickerDescription}>
              Każde kliknięcie dodaje jedno zdjęcie do produktu.
            </Text>
          </Pressable>

          {zdjecia.length > 0 && (
            <View style={styles.imagesPreview}>
              {zdjecia.map((zdjecie, index) => (
                <View key={`${zdjecie.uri}-${index}`} style={styles.imagePreview}>
                  <Image source={{ uri: zdjecie.uri }} style={styles.image} />
                </View>
              ))}
            </View>
          )}

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Specyfikacje produktu</Text>

          <View style={styles.specificationCard}>
            <View style={styles.specificationFields}>
              <TextInput
                value={nazwaSpecyfikacji}
                onChangeText={setNazwaSpecyfikacji}
                style={[styles.input, styles.specificationNameInput]}
                placeholder="Nazwa, np. Moc"
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                value={opisSpecyfikacji}
                onChangeText={setOpisSpecyfikacji}
                style={[styles.input, styles.specificationDescriptionInput]}
                placeholder="Opis, np. 750 W"
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                value={emotkaSpecyfikacji}
                onChangeText={setEmotkaSpecyfikacji}
                style={[styles.input, styles.specificationIconInput]}
                placeholder="Emotka"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <Pressable style={styles.addSpecificationButton} onPress={dodajSpecyfikacje}>
              <MaterialIcons name="add" size={18} color="#1D4ED8" />
              <Text style={styles.addSpecificationText}>Dodaj specyfikację</Text>
            </Pressable>
          </View>

          {specyfikacje.map((specyfikacja, index) => (
            <View key={index} style={styles.specificationCard}>
              <View style={styles.specificationHeader}>
                <Text style={styles.specificationTitle}>
                  {specyfikacja.nazwa_specyfikacji}: {specyfikacja.opis_specyfikacji}
                </Text>
                <Pressable style={styles.removeSpecificationButton} onPress={() => usunSpecyfikacje(index)}>
                  <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
                </Pressable>
              </View>
              {specyfikacja.emotka_specyfikacji && (
                <Text style={styles.sectionDescription}>{specyfikacja.emotka_specyfikacji}</Text>
              )}
            </View>
          ))}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.formActions}>
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Anuluj</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.submitButton]}
              onPress={dodaj}
              disabled={loading}
            >
              <MaterialIcons name="add" size={19} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {loading ? "Dodawanie..." : "Dodaj produkt"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </PageLayout>
  );
}
