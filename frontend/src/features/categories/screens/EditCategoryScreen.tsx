import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import PageLayout from "@components/shared/Layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import styles from "./CategoryAdminForm.styles";
import { useEffect, useState } from "react";
import { pobierzKategoriePoId } from "../categories.service";
import { edytujKategorie } from "../categories.management.services";

export default function EditCategoryScreen() {
  const { status, user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [nowaNazwa,setNowaNazwa] = useState("")
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aktualneZdjecie, setAktualneZdjecie] = useState<string | null>(null);
  const [noweZdjecie, setNoweZdjecie] =useState<ImagePicker.ImagePickerAsset | null>(null);

  const categoryId = Number(id);

  if (status === "loading") {
    return (
      <View style={styles.stateScreen}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (
    status !== "authenticated" ||
    user?.rola !== "admin" ||
    !Number.isInteger(categoryId) ||
    categoryId <= 0
  ) {
    return <Redirect href="/(tabs)/user" />;
  }
  useEffect(()=> {
  if (
    status !== "authenticated" ||
    user?.rola !== "admin" ||
    !Number.isInteger(categoryId) ||
    categoryId <= 0
  ) {
    return;
  }

  async function zaladujKategorie() {
    setError(null);
    setLoading(true);

    try {
      const response =
        await pobierzKategoriePoId(categoryId);

      setNowaNazwa(response.nazwa);
      setAktualneZdjecie(response.zdjecie_url);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Nie udało się pobrać kategorii",
      );
    } finally {
      setLoading(false);
    }
  }

  void zaladujKategorie();
  },[categoryId,status, user?.rola])

  const wybierzZdjecie = async () => {
  setError(null);

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled) {
    setNoweZdjecie(result.assets[0]);
  }
};

  const zapiszZmiany =async ()=> {
  setError(null);

  const poprawnaNazwa = nowaNazwa.trim();

  if (!poprawnaNazwa) {
    setError("Nazwa nie może być pusta");
    return;
  }

  if (poprawnaNazwa.length > 100) {
    setError("Nazwa może mieć maksymalnie 100 znaków");
    return;
  }

  setLoading(true);

    try {
      const formData = new FormData();
      formData.append("nazwa", poprawnaNazwa);

      if (noweZdjecie?.file) {
        formData.append("zdjecie", noweZdjecie.file);
      } else if (noweZdjecie) {
        formData.append(
          "zdjecie",
          {
            uri: noweZdjecie.uri,
            name: noweZdjecie.fileName ?? "kategoria.jpg",
            type: noweZdjecie.mimeType ?? "image/jpeg",
          } as any,
        );
      }

      await edytujKategorie(categoryId, formData);
      router.back();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Nie udało się edytować kategorii",
      );
    } 
    finally 
    {
      setLoading(false);
    }
  }
  return (
    <PageLayout>
      <View style={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={19} color="#1D4ED8" />
          <Text style={styles.backButtonText}>Wróć</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>ADMIN · KATEGORIE</Text>
          <Text style={styles.title}>Edytuj kategorię</Text>
          <Text style={styles.description}>
            Zmień nazwę lub zdjęcie wybranej kategorii.
          </Text>
          <View style={styles.categoryIdBadge}>
            <Text style={styles.categoryIdText}>ID kategorii: {categoryId}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nazwa kategorii</Text>
            <TextInput
              value={nowaNazwa}
              onChangeText={val => setNowaNazwa(val)}
              style={styles.input}
              placeholder="Nazwa kategorii"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Zdjęcie kategorii</Text>
            <Pressable style={styles.imagePicker} onPress={()=>wybierzZdjecie()}>
              <View style={styles.imagePickerIcon}>
                <MaterialIcons name="image" size={27} color="#2563EB" />
              </View>
              <Text style={styles.imagePickerTitle}>Zmień zdjęcie</Text>
              <Text style={styles.imagePickerDescription}>
                Obecne zdjęcie zostanie pokazane po podpięciu danych kategorii.
              </Text>
            </Pressable>
          </View>

          <View style={styles.formActions}>
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Anuluj</Text>
            </Pressable>

            <Pressable style={[styles.actionButton, styles.submitButton]} onPress={()=> zapiszZmiany()}>
              <MaterialIcons name="save" size={19} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Zapisz zmiany</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </PageLayout>
  );
}
