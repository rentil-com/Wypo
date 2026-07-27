import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@components/shared/Layout/PageLayout";

type ServiceStatus = "loading" | "OK" | "ERROR";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function StanSystemu() {
  const { status, user } = useAuth();
  const [apiStatus, setApiStatus] = useState<ServiceStatus>("loading");
  const [databaseStatus, setDatabaseStatus] = useState<ServiceStatus>("loading");
  const [s3Status, setS3Status] = useState<ServiceStatus>("loading");

  useEffect(() => {
    if (status !== "authenticated" || user?.rola !== "admin") return;

    async function sprawdzUslugi() {
      try {
        if (!API_URL) throw new Error("Brak adresu API");

        const response = await fetch(`${API_URL}/`, {
          credentials: "include",
        });
        const data = (await response.json()) as {
          api?: string;
          database?: string;
          s3?: string;
        };

        setApiStatus(data.api === "ok" ? "OK" : "ERROR");
        setDatabaseStatus(data.database === "ok" ? "OK" : "ERROR");
        setS3Status(data.s3 === "ok" ? "OK" : "ERROR");
      } catch {
        setApiStatus("ERROR");
        setDatabaseStatus("ERROR");
        setS3Status("ERROR");
      }
    }

    void sprawdzUslugi();
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
          <Text style={styles.cardTitle}>Stan API</Text>
          <View style={styles.statusRow}>
            <Text style={styles.label}>API:</Text>
            <Text
              style={[
                styles.status,
                apiStatus === "OK" && styles.statusOk,
                apiStatus === "ERROR" && styles.statusError,
              ]}
            >
              {apiStatus === "loading" ? "..." : apiStatus}
            </Text>
          </View>
        </View>

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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stan S3</Text>
          <View style={styles.statusRow}>
            <Text style={styles.label}>S3:</Text>
            <Text
              style={[
                styles.status,
                s3Status === "OK" && styles.statusOk,
                s3Status === "ERROR" && styles.statusError,
              ]}
            >
              {s3Status === "loading" ? "..." : s3Status}
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    flexGrow: 1,
    flexBasis: 300,
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
