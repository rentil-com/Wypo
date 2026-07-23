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

import styles from "./CategoryAdminForm.styles";

export default function AddCategoryScreen() {
  const { status, user } = useAuth();

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
              style={styles.input}
              placeholder="Np. Sprzęt ogrodowy"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Zdjęcie kategorii</Text>
            <Pressable style={styles.imagePicker}>
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

            <Pressable style={[styles.actionButton, styles.submitButton]}>
              <MaterialIcons name="add" size={19} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Dodaj kategorię</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </PageLayout>
  );
}
