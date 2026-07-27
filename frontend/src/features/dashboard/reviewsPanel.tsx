import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@components/shared/Layout/PageLayout";
import { pobierzRecenzje } from "@features/reviews/reviews.services";
import type { ReviewResponse } from "@features/reviews/reviews.types";

function formatujDate(data: string) {
  return new Intl.DateTimeFormat("pl-PL").format(new Date(data));
}

export default function ReviewsPanel() {
  const { status, user } = useAuth();
  const [recenzje, setRecenzje] = useState<ReviewResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || user?.rola !== "admin") return;

    async function zaladujRecenzje() {
      try {
        const response = await pobierzRecenzje();
        setRecenzje(response.dane);
        setTotal(response.total);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Nie udało się pobrać recenzji",
        );
      } finally {
        setLoading(false);
      }
    }

    void zaladujRecenzje();
  }, [status, user?.rola]);

  if (status === "loading") {
    return (
      <View style={styles.stateScreen}>
        <ActivityIndicator size="large" color="#176BDE" />
      </View>
    );
  }

  if (status !== "authenticated" || user?.rola !== "admin") {
    return <Redirect href="/(tabs)/user" />;
  }

  return (
    <PageLayout wide>
      <View style={styles.content}>
        <Text style={styles.title}>Panel Recenzji</Text>

        {!loading && !error && (
          <Text style={styles.summary}>Łącznie: {total}</Text>
        )}

        {loading && <ActivityIndicator size="large" color="#176BDE" />}
        {error && <Text style={styles.error}>{error}</Text>}

        {!loading && !error && recenzje.length === 0 && (
          <Text style={styles.empty}>Brak recenzji.</Text>
        )}

        {!loading && !error && recenzje.map((recenzja) => (
          <View key={recenzja.id} style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.cardTitle}>Recenzja #{recenzja.id}</Text>
              <Text style={styles.rating}>★ {recenzja.gwiazdki}/5</Text>
            </View>

            <Text style={styles.line}>
              Użytkownik: {recenzja.imie} {recenzja.nazwisko} (#{recenzja.uzytkownik_id})
            </Text>
            <Text style={styles.line}>
              Sprzęt: {recenzja.nazwa_sprzetu ?? `#${recenzja.sprzet_id}`}
            </Text>
            <Text style={styles.line}>Status: {recenzja.status}</Text>
            <Text style={styles.line}>Dodano: {formatujDate(recenzja.data_dodania)}</Text>
            <Text style={styles.text}>{recenzja.tresc ?? "Brak treści."}</Text>
          </View>
        ))}
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  stateScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    marginTop: 24,
    paddingBottom: 24,
  },
  title: {
    color: "#111827",
    fontSize: 40,
    fontWeight: "900",
  },
  summary: {
    color: "#64748B",
    marginTop: 6,
    marginBottom: 24,
  },
  card: {
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
  },
  rating: {
    color: "#F59E0B",
    fontWeight: "800",
  },
  line: {
    color: "#475569",
    marginBottom: 7,
  },
  text: {
    color: "#111827",
    marginTop: 8,
  },
  empty: {
    color: "#64748B",
  },
  error: {
    color: "#B91C1C",
  },
});
