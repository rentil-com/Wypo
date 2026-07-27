import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@components/shared/Layout/PageLayout";
import { dodajRecenzje } from "./reviews.services";
import type { Review_Rating } from "./reviews.types";

const oceny: Review_Rating[] = [1, 2, 3, 4, 5];

export default function AddReviewScreen() {
  const { status } = useAuth();
  const { sprzetId, wypozyczenieId } = useLocalSearchParams<{
    sprzetId: string;
    wypozyczenieId: string;
  }>();
  const [gwiazdki, setGwiazdki] = useState<Review_Rating | null>(null);
  const [tresc, setTresc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dodaj = async () => {
    const sprzet = Number(sprzetId);
    const wypozyczenie = Number(wypozyczenieId);

    if (!gwiazdki) {
      setError("Wybierz ocenę od 1 do 5");
      return;
    }

    if (!Number.isInteger(sprzet) || !Number.isInteger(wypozyczenie)) {
      setError("Nieprawidłowe dane wypożyczenia");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await dodajRecenzje({
        sprzet_id: sprzet,
        wypozyczenie_id: wypozyczenie,
        gwiazdki,
        tresc: tresc.trim() || null,
      });
      router.replace("/(tabs)/loans");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Nie udało się dodać recenzji");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  if (status !== "authenticated") {
    return <Redirect href="/(tabs)/user" />;
  }

  return (
    <PageLayout>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Wróć</Text>
        </Pressable>

        <Text style={styles.title}>Dodaj recenzję</Text>
        <Text style={styles.subtitle}>Sprzęt #{sprzetId}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Ocena</Text>
          <View style={styles.stars}>
            {oceny.map((ocena) => (
              <Pressable
                key={ocena}
                style={[
                  styles.starButton,
                  gwiazdki === ocena && styles.starActive,
                ]}
                onPress={() => setGwiazdki(ocena)}
              >
                <Text style={styles.starText}>{ocena} ★</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Treść (opcjonalna)</Text>
          <TextInput
            style={styles.input}
            value={tresc}
            onChangeText={setTresc}
            placeholder="Napisz krótką opinię"
            multiline
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text>Anuluj</Text>
            </Pressable>
            <Pressable
              disabled={loading}
              style={[styles.submitButton, loading && styles.disabled]}
              onPress={() => void dodaj()}
            >
              <Text style={styles.submitText}>
                {loading ? "Dodawanie..." : "Dodaj recenzję"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 720,
    marginTop: 24,
  },
  back: {
    color: "#2563EB",
    fontWeight: "700",
    marginBottom: 18,
  },
  title: {
    color: "#111827",
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748B",
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  label: {
    color: "#334155",
    fontWeight: "800",
    marginBottom: 8,
  },
  stars: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  starButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 10,
  },
  starActive: {
    borderColor: "#F59E0B",
    backgroundColor: "#FEF3C7",
  },
  starText: {
    color: "#92400E",
    fontWeight: "700",
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
  },
  error: {
    color: "#B91C1C",
    marginTop: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    padding: 12,
  },
  submitButton: {
    borderRadius: 8,
    backgroundColor: "#16A34A",
    padding: 12,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.5,
  },
});
