import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@components/shared/Layout/PageLayout";
import {
  odkryjRecenzje,
  pobierzPojedynczaRecenzjeProduktu,
  ukryjRecenzje,
  usunRecenzje,
} from "@features/reviews/reviews.services";
import type { ReviewResponse } from "@features/reviews/reviews.types";

type ReviewAction = "ukryj" | "odkryj" | "usun";

export default function ReviewDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, user } = useAuth();
  const [recenzja, setRecenzja] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || user?.rola !== "admin") return;

    const reviewId = Number(id);

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      setError("Nieprawidłowe ID recenzji");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setRecenzja(await pobierzPojedynczaRecenzjeProduktu(reviewId));
      } catch (error) {
        setError(error instanceof Error ? error.message : "Błąd pobierania recenzji");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id, status, user?.rola]);

  const wykonajAkcje = async (action: ReviewAction) => {
    if (!recenzja || saving) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = action === "ukryj"
        ? await ukryjRecenzje(recenzja.id)
        : action === "odkryj"
          ? await odkryjRecenzje(recenzja.id)
          : await usunRecenzje(recenzja.id);

      setRecenzja((current) => current ? { ...current, ...response } : response);
      setMessage("Zaktualizowano recenzję");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Błąd aktualizacji recenzji");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  if (status !== "authenticated" || user?.rola !== "admin") {
    return <Redirect href="/(tabs)/user" />;
  }

  return (
    <PageLayout wide>
      <View style={styles.content}>
        <Text style={styles.title}>Szczegóły recenzji</Text>

        {loading && <ActivityIndicator size="large" color="#176BDE" />}
        {error && <Text style={styles.error}>{error}</Text>}
        {message && <Text style={styles.success}>{message}</Text>}

        {!loading && recenzja && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recenzja #{recenzja.id}</Text>
            <Text style={styles.line}>
              Użytkownik: {recenzja.imie} {recenzja.nazwisko} (#{recenzja.uzytkownik_id})
            </Text>
            <Text style={styles.line}>
              Sprzęt: {recenzja.nazwa_sprzetu ?? `#${recenzja.sprzet_id}`}
            </Text>
            <Text style={styles.line}>
              Wypożyczenie: {recenzja.wypozyczenie_id ?? "brak"}
            </Text>
            <Text style={styles.line}>Ocena: {recenzja.gwiazdki}/5</Text>
            <Text style={styles.line}>Status: {recenzja.status}</Text>
            <Text style={styles.line}>Dodano: {recenzja.data_dodania}</Text>
            <Text style={styles.text}>{recenzja.tresc ?? "Brak treści."}</Text>

            <View style={styles.actions}>
              {recenzja.status === "aktywna" && (
                <Pressable
                  disabled={saving}
                  style={[styles.button, styles.hideButton]}
                  onPress={() => void wykonajAkcje("ukryj")}
                >
                  <Text style={styles.buttonText}>Ukryj</Text>
                </Pressable>
              )}

              {recenzja.status === "ukryta" && (
                <Pressable
                  disabled={saving}
                  style={[styles.button, styles.showButton]}
                  onPress={() => void wykonajAkcje("odkryj")}
                >
                  <Text style={styles.buttonText}>Odkryj</Text>
                </Pressable>
              )}

              {recenzja.status !== "usunieta" && (
                <Pressable
                  disabled={saving}
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => void wykonajAkcje("usun")}
                >
                  <Text style={styles.buttonText}>Usuń</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
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
    marginTop: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 20,
  },
  card: {
    maxWidth: 900,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 22,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 16,
  },
  line: {
    color: "#334155",
    fontSize: 16,
    marginBottom: 9,
  },
  text: {
    marginTop: 6,
    color: "#111827",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  hideButton: {
    backgroundColor: "#D97706",
  },
  showButton: {
    backgroundColor: "#16A34A",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  error: {
    color: "#B91C1C",
    marginBottom: 12,
  },
  success: {
    color: "#15803D",
    marginBottom: 12,
  },
});
