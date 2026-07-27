import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@components/shared/Layout/PageLayout";

type DatabaseStatus = "loading" | "OK" | "ERROR";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function StanBazy() {
  const { status, user } = useAuth();
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus>("loading");

  useEffect(() => {
    if (status !== "authenticated" || user?.rola !== "admin") return;

    async function sprawdzBaze() {
      try {
        if (!API_URL) throw new Error("Brak adresu API");

        const response = await fetch(`${API_URL}/`, {
          credentials: "include",
        });
        const data = (await response.json()) as { database?: string };

        setDatabaseStatus(data.database === "ok" ? "OK" : "ERROR");
      } catch {
        setDatabaseStatus("ERROR");
      }
    }

    void sprawdzBaze();
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
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stan bazy danych</Text>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Baza:</Text>
            <Text
              style={[
                styles.status,
                databaseStatus === "OK" && styles.statusOk,
                databaseStatus === "ERROR" && styles.statusError,
              ]}
            >
              {databaseStatus === "loading" ? "..." : databaseStatus}
            </Text>
          </View>
        </View>
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
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 28,
  },
  cardTitle: {
    marginBottom: 24,
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    color: "#475569",
    fontSize: 22,
    fontWeight: "800",
  },
  status: {
    color: "#64748B",
    fontSize: 22,
    fontWeight: "900",
  },
  statusOk: {
    color: "#16A34A",
  },
  statusError: {
    color: "#DC2626",
  },
});
