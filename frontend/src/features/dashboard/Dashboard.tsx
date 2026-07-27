import { Redirect, router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@components/shared/Layout/PageLayout";

export default function Dashboard() {
  const { status, user } = useAuth();

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
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/products/AddProduct")}
          >
            <Text style={styles.addButtonText}>Dodaj produkt</Text>
          </Pressable>
        </View>

        <View style={styles.tiles}>
          <Pressable
            style={styles.tile}
            onPress={() => router.push("/(tabs)/applications")}
          >
            <Text style={styles.tileText}>Panel Wniosków</Text>
          </Pressable>

          <Pressable
            style={styles.tile}
            onPress={() => router.push("/(tabs)/accountUsers")}
          >
            <Text style={styles.tileText}>Panel Użytkowników</Text>
          </Pressable>
            <Pressable
            style={styles.tile}
            onPress={() => router.push("/promotions/admin")}
          >
            <Text style={styles.tileText}>Panel Promocji</Text>
          </Pressable>
             <Pressable
            style={styles.tile}
            onPress={() => router.push("/promotions/admin")}
          >
            <Text style={styles.tileText}>Panel Recenzji</Text>
          </Pressable>
          
          <Pressable
            style={styles.tile}
            onPress={() => router.push("/(tabs)/stansystemu")}
          >
            <Text style={styles.tileText}>Stan Systemu</Text>
          </Pressable>
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
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 28,
  },
  title: {
    color: "#111827",
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "900",
  },
  addButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#176BDE",
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  tile: {
    flexGrow: 1,
    flexBasis: 260,
    minHeight: 150,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  tileText: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
  },
});
