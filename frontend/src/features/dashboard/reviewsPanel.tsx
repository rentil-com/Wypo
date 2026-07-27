import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Picker } from "@react-native-picker/picker";
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
import { pobierzRecenzje } from "@features/reviews/reviews.services";
import type {
  Review_Rating,
  ReviewResponse,
  ReviewsListParams,
  ReviewsStatus,
} from "@features/reviews/reviews.types";

type FiltersForm = {
  uzytkownikId: string;
  sprzetId: string;
  status: "" | ReviewsStatus;
  gwiazdki: "" | Review_Rating;
};

const emptyFilters: FiltersForm = {
  uzytkownikId: "",
  sprzetId: "",
  status: "",
  gwiazdki: "",
};

function formatujDate(data: string) {
  return new Intl.DateTimeFormat("pl-PL").format(new Date(data));
}

export default function ReviewsPanel() {
  const { status, user } = useAuth();
  const [recenzje, setRecenzje] = useState<ReviewResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [liczbaStron, setLiczbaStron] = useState(1);
  const [filterForm, setFilterForm] = useState<FiltersForm>(emptyFilters);
  const [filters, setFilters] = useState<ReviewsListParams>({ strona: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || user?.rola !== "admin") return;

    async function zaladujRecenzje() {
      try {
        const response = await pobierzRecenzje(filters);
        setRecenzje(response.dane);
        setTotal(response.total);
        setLiczbaStron(response.liczbaStron);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Nie udało się pobrać recenzji",
        );
      } finally {
        setLoading(false);
      }
    }

    void zaladujRecenzje();
  }, [filters, status, user?.rola]);

  const filtruj = () => {
    setFilters({
      strona: 1,
      uzytkownik_id: filterForm.uzytkownikId
        ? Number(filterForm.uzytkownikId)
        : undefined,
      sprzet_id: filterForm.sprzetId ? Number(filterForm.sprzetId) : undefined,
      status: filterForm.status || undefined,
      gwiazdki: filterForm.gwiazdki || undefined,
    });
  };

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

        <View style={styles.filtersBar}>
          <TextInput
            style={styles.filterInput}
            value={filterForm.uzytkownikId}
            placeholder="ID użytkownika"
            keyboardType="numeric"
            onChangeText={(value) =>
              /^\d*$/.test(value) &&
              setFilterForm({ ...filterForm, uzytkownikId: value })
            }
          />
          <TextInput
            style={styles.filterInput}
            value={filterForm.sprzetId}
            placeholder="ID sprzętu"
            keyboardType="numeric"
            onChangeText={(value) =>
              /^\d*$/.test(value) &&
              setFilterForm({ ...filterForm, sprzetId: value })
            }
          />

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={filterForm.status}
              onValueChange={(status: FiltersForm["status"]) =>
                setFilterForm({ ...filterForm, status })
              }
            >
              <Picker.Item label="Wszystkie statusy" value="" />
              <Picker.Item label="Aktywna" value="aktywna" />
              <Picker.Item label="Ukryta" value="ukryta" />
              <Picker.Item label="Usunięta" value="usunieta" />
            </Picker>
          </View>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={filterForm.gwiazdki}
              onValueChange={(gwiazdki: FiltersForm["gwiazdki"]) =>
                setFilterForm({ ...filterForm, gwiazdki })
              }
            >
              <Picker.Item label="Wszystkie oceny" value="" />
              {[1, 2, 3, 4, 5].map((gwiazdki) => (
                <Picker.Item
                  key={gwiazdki}
                  label={`${gwiazdki} ★`}
                  value={gwiazdki}
                />
              ))}
            </Picker>
          </View>

          <Pressable style={styles.filterButton} onPress={filtruj}>
            <Text style={styles.filterButtonText}>Filtruj</Text>
          </Pressable>
          <Pressable
            style={styles.clearButton}
            onPress={() => {
              setFilterForm(emptyFilters);
              setFilters({ strona: 1 });
            }}
          >
            <Text style={styles.clearButtonText}>Wyczyść</Text>
          </Pressable>
        </View>

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

        {!loading && !error && liczbaStron > 1 && (
          <View style={styles.pagination}>
            <Pressable
              disabled={(filters.strona ?? 1) === 1}
              style={styles.pageButton}
              onPress={() =>
                setFilters({ ...filters, strona: (filters.strona ?? 1) - 1 })
              }
            >
              <Text style={styles.pageButtonText}>Poprzednia</Text>
            </Pressable>
            <Text>{filters.strona ?? 1} / {liczbaStron}</Text>
            <Pressable
              disabled={(filters.strona ?? 1) >= liczbaStron}
              style={styles.pageButton}
              onPress={() =>
                setFilters({ ...filters, strona: (filters.strona ?? 1) + 1 })
              }
            >
              <Text style={styles.pageButtonText}>Następna</Text>
            </Pressable>
          </View>
        )}
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
  filtersBar: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 20,
  },
  filterInput: {
    flexGrow: 1,
    minWidth: 150,
    height: 44,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  pickerWrapper: {
    flexGrow: 1,
    minWidth: 180,
    height: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    overflow: "hidden",
  },
  filterButton: {
    height: 44,
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#176BDE",
    paddingHorizontal: 18,
  },
  filterButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  clearButton: {
    height: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    paddingHorizontal: 18,
  },
  clearButtonText: {
    color: "#475569",
    fontWeight: "700",
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
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  pageButton: {
    borderRadius: 9,
    backgroundColor: "#176BDE",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pageButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
