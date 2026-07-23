import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@components/shared/Layout/PageLayout";
import { useState } from "react";
import styles from "./CategoryAdminForm.styles";
import { dodajKategorie } from "../categories.management.services";
import * as ImagePicker from "expo-image-picker";
export default function AddCategoryScreen() {
  const { status, user } = useAuth();
  const [nowaNazwa, setNowaNazwa] = useState("")
  const [zdjecie,setZdjecie] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const wybierzZdjecie = async ()=>{
    setError(null)
    const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled) {
    setZdjecie(result.assets[0]);
  }
  }


  const dodaj = async () => {
    setError(null)
    const poprawnaNazwa = nowaNazwa.trim()
    if(!poprawnaNazwa ) {
      setError("Nazwa nie moze byc pusta")
      return;
    }
    if (poprawnaNazwa.length > 100) {
    setError("Nazwa może mieć maksymalnie 100 znaków");
    return;
    }

       setLoading(true)

     try{
      const formData = new FormData();
      formData.append("nazwa",poprawnaNazwa)
      if(zdjecie?.file){
          formData.append("zdjecie",zdjecie.file)
      }
      else if (zdjecie){
        formData.append("zdjecie", {uri : zdjecie.uri,
          name : zdjecie.fileName ?? "kategoria.jpg",
          type : zdjecie.mimeType ?? "image/jpeg"
      }as any,)
      }
      
      await dodajKategorie(formData)
      router.back()
    }
    catch(error){
      setError(error instanceof Error  ? error.message : "Nie udalo sie dodac kategorii ")
    }
    finally {
      setLoading(false)
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
          <Text style={styles.title}>Dodaj kategorię</Text>
          <Text style={styles.description}>
            Uzupełnij nazwę kategorii i wybierz zdjęcie wyświetlane w katalogu.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nazwa kategorii</Text>
            <TextInput
              value={nowaNazwa}
              onChangeText={(val)=> setNowaNazwa(val)}
              style={styles.input}
              placeholder="Np. Sprzęt ogrodowy"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Zdjęcie kategorii</Text>
            <Pressable style={styles.imagePicker} onPress={()=> wybierzZdjecie()}>
              <View style={styles.imagePickerIcon}>
                <MaterialIcons name="add-photo-alternate" size={27} color="#2563EB" />
              </View>
              <Text style={styles.imagePickerTitle}>Wybierz zdjęcie</Text>
              <Text style={styles.imagePickerDescription}>
                Plik PNG, JPG lub WEBP.
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

            <Pressable style={[styles.actionButton, styles.submitButton]} onPress={()=>dodaj()}>
              <MaterialIcons name="add" size={19} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Dodaj kategorię</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </PageLayout>
  );
}
