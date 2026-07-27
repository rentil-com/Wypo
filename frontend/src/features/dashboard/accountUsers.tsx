import { Redirect, router } from "expo-router";
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
import {
  getAllAccounts,
  type AccountDetails,
  type AccountListParams,
} from "@features/account";

const textFilters = [
  { key: "imie", placeholder: "Imię" },
  { key: "nazwisko", placeholder: "Nazwisko" },
  { key: "email", placeholder: "E-mail" },
] as const;

function formatujDate(data: string) {
  const parsedDate = new Date(data);

  if (Number.isNaN(parsedDate.getTime())) return data;

  return new Intl.DateTimeFormat("pl-PL").format(parsedDate);
}

export default function AccountUsers() {
  const { status, user } = useAuth();
  const [accounts, setAccounts] = useState<AccountDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [liczbaStron, setLiczbaStron] = useState(1);
  const [filterForm, setFilterForm] = useState<AccountListParams>({});
  const [filters, setFilters] = useState<AccountListParams>({ strona: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || user?.rola !== "admin") return;

    async function zaladujUzytkownikow() {
      setError(null);
      setLoading(true);

      try {
        const response = await getAllAccounts(filters);
        setAccounts(response.dane);
        setTotal(response.total);
        setLiczbaStron(response.liczbaStron);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać użytkowników",
        );
      } finally {
        setLoading(false);
      }
    }

    void zaladujUzytkownikow();
  }, [filters, status, user?.rola]);

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
        <Text style={styles.title}>Użytkownicy</Text>

        {!loading && !error && (
          <Text style={styles.summaryText}>Łącznie: {total}</Text>
        )}

        <View style={styles.filtersBar}>
          {textFilters.map(({ key, placeholder }) => (
            <TextInput
              key={key}
              style={styles.filterInput}
              value={filterForm[key] ?? ""}
              placeholder={placeholder}
              onChangeText={(value) =>
                setFilterForm({ ...filterForm, [key]: value })
              }
            />
          ))}

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={filterForm.rola ?? ""}
              onValueChange={(rola) =>
                setFilterForm({
                  ...filterForm,
                  rola: rola ? rola as AccountListParams["rola"] : undefined,
                })
              }
            >
              <Picker.Item label="Wszystkie role" value="" />
              <Picker.Item label="Użytkownik" value="uzytkownik" />
              <Picker.Item label="Administrator" value="admin" />
            </Picker>
          </View>

          <Pressable
            style={styles.filterButton}
            onPress={() => setFilters({ ...filterForm, strona: 1 })}
          >
            <Text style={styles.filterButtonText}>Filtruj</Text>
          </Pressable>
          <Pressable
            style={styles.clearButton}
            onPress={() => {
              setFilterForm({});
              setFilters({ strona: 1 });
            }}
          >
            <Text style={styles.clearButtonText}>Wyczyść</Text>
          </Pressable>
        </View>

        {loading && (
          <View style={styles.message}>
            <ActivityIndicator size="large" color="#176BDE" />
            <Text style={styles.messageText}>Ładowanie użytkowników...</Text>
          </View>
        )}

        {!loading && error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && accounts.length === 0 && (
          <Text style={styles.messageText}>Brak użytkowników do wyświetlenia.</Text>
        )}

        {!loading && !error && accounts.map((account) => (
          <Pressable
            key={account.id}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/accountUsers/[id]",
                params: { id: account.id.toString() },
              })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {account.imie} {account.nazwisko}
              </Text>

              <View
                style={[
                  styles.roleBadge,
                  account.rola === "admin" && styles.adminBadge,
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    account.rola === "admin" && styles.adminRoleText,
                  ]}
                >
                  {account.rola === "admin" ? "Administrator" : "Użytkownik"}
                </Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>E-mail</Text>
                <Text style={styles.detailValue}>{account.email}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>ID</Text>
                <Text style={styles.detailValue}>#{account.id}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>2FA</Text>
                <Text style={styles.detailValue}>
                  {account.dwuetapowe ? "Włączone" : "Wyłączone"}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Utworzono</Text>
                <Text style={styles.detailValue}>
                  {formatujDate(account.data_utworzenia)}
                </Text>
              </View>
            </View>
          </Pressable>
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
    backgroundColor: "#F4F7FC",
  },
  content: {
    width: "100%",
    marginTop: 24,
    paddingBottom: 24,
  },
  title: {
    marginBottom: 6,
    color: "#111827",
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "900",
  },
  summaryText: {
    marginBottom: 24,
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
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
    minWidth: 170,
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
  message: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  messageText: {
    color: "#64748B",
    fontSize: 16,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 16,
  },
  card: {
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 22,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
  },
  roleBadge: {
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  adminBadge: {
    backgroundColor: "#EDE9FE",
  },
  roleText: {
    color: "#1E40AF",
    fontSize: 13,
    fontWeight: "800",
  },
  adminRoleText: {
    color: "#6D28D9",
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  detailItem: {
    flexGrow: 1,
    minWidth: 180,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    padding: 16,
  },
  detailLabel: {
    marginBottom: 7,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "800",
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
