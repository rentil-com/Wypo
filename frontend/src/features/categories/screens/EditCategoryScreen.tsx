import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, router, useLocalSearchParams } from "expo-router";
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

export default function EditCategoryScreen() {
  const { status, user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
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
              style={styles.input}
              placeholder="Nazwa kategorii"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Zdjęcie kategorii</Text>
            <Pressable style={styles.imagePicker}>
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

            <Pressable style={[styles.actionButton, styles.submitButton]}>
              <MaterialIcons name="save" size={19} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Zapisz zmiany</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </PageLayout>
  );
}
