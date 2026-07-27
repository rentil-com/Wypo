import { Redirect, router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

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

  if (status !== "authenticated") {
    return (
      <PageLayout wide>
        <View style={styles.authGate}>
          <View style={styles.authIcon}>
            <MaterialIcons name="lock-outline" size={30} color="#176BDE" />
          </View>
          <Text style={styles.authTitle}>Dashboard wymaga konta administratora</Text>
          <Text style={styles.authDescription}>
            Zaloguj się na konto administratora, aby przejść do panelu zarządzania.
          </Text>
          <Pressable
            style={styles.authButton}
            onPress={() => router.push({
              pathname: "/login",
              params: { reason: "Zaloguj się na konto administratora, aby otworzyć Dashboard." },
            })}
          >
            <Text style={styles.authButtonText}>Przejdź do logowania</Text>
          </Pressable>
        </View>
      </PageLayout>
    );
  }

  if (user?.rola !== "admin") {
    return <Redirect href="/" />;
  }

  return (
    <PageLayout wide>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/products/AddProduct")}
            >
              <Text style={styles.addButtonText}>Dodaj produkt</Text>
            </Pressable>

            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/category/addCategory")}
            >
              <Text style={styles.addButtonText}>Dodaj kategorię</Text>
            </Pressable>
          </View>
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
            onPress={() => router.push("/(tabs)/reviewsPanel")}
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
  authGate: {
    width: "100%",
    maxWidth: 600,
    minHeight: 320,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 36,
    marginTop: 48,
  },
  authIcon: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#EEF6FF",
    marginBottom: 18,
  },
  authTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  authDescription: {
    maxWidth: 460,
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
  },
  authButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#176BDE",
    paddingHorizontal: 22,
    marginTop: 24,
  },
  authButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
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
  headerActions: {
    gap: 10,
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
