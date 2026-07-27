import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@components/shared/Layout/PageLayout";
import { getAllAccounts, type AccountDetails } from "@features/account";

function formatujDate(data: string) {
  const parsedDate = new Date(data);

  if (Number.isNaN(parsedDate.getTime())) return data;

  return new Intl.DateTimeFormat("pl-PL").format(parsedDate);
}

export default function AccountUsers() {
  const { status, user } = useAuth();
  const [accounts, setAccounts] = useState<AccountDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || user?.rola !== "admin") return;

    async function zaladujUzytkownikow() {
      setError(null);
      setLoading(true);

      try {
        const response = await getAllAccounts();
        setAccounts(response.dane);
        setTotal(response.total);
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
        <Text style={styles.title}>Użytkownicy</Text>

        {!loading && !error && (
          <Text style={styles.summaryText}>Łącznie: {total}</Text>
        )}

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
          <View key={account.id} style={styles.card}>
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
});
