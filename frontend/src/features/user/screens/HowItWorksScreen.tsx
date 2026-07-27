import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import PageLayout from "@components/shared/Layout/PageLayout";

const STEPS = [
  {
    icon: "search" as const,
    title: "Znajdź sprzęt",
    description: "Przejrzyj katalog, wybierz kategorię lub skorzystaj z wyszukiwarki.",
  },
  {
    icon: "event-available" as const,
    title: "Wybierz termin",
    description: "Sprawdź dostępność produktu i dopasuj okres wynajmu do swoich potrzeb.",
  },
  {
    icon: "handshake" as const,
    title: "Odbierz i korzystaj",
    description: "Potwierdź wynajem, odbierz sprzęt i zwróć go po zakończeniu umowy.",
  },
];

export default function HowItWorksScreen() {
  const { width } = useWindowDimensions();
  const mobile = width < 760;

  return (
    <PageLayout>
      <View style={[styles.hero, mobile && styles.heroMobile]}>
        <Text style={[styles.eyebrow, mobile && styles.eyebrowMobile]}>
          WYNAJEM KROK PO KROKU
        </Text>
        <Text style={[styles.title, mobile && styles.titleMobile]}>
          Jak działa Rentil?
        </Text>
        <Text style={[styles.description, mobile && styles.descriptionMobile]}>
          Potrzebny sprzęt znajdziesz i wynajmiesz w kilku prostych krokach.
        </Text>
      </View>

      <View style={[styles.steps, mobile && styles.stepsMobile]}>
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stepIcon}>
              <MaterialIcons name={step.icon} size={28} color="#176BDE" />
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.catalogButton} onPress={() => router.push("/catalog" as never)}>
        <Text style={styles.catalogButtonText}>Przejdź do katalogu</Text>
        <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
      </Pressable>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingTop: 72,
    paddingBottom: 42,
  },
  heroMobile: {
    paddingTop: 38,
    paddingBottom: 28,
  },
  eyebrow: {
    color: "#176BDE",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  eyebrowMobile: {
    fontSize: 12,
  },
  title: {
    color: "#111827",
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "900",
    marginTop: 12,
    textAlign: "center",
  },
  titleMobile: {
    fontSize: 32,
    lineHeight: 39,
  },
  description: {
    maxWidth: 640,
    color: "#64748B",
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    marginTop: 12,
  },
  descriptionMobile: {
    fontSize: 15,
    lineHeight: 23,
  },
  steps: {
    flexDirection: "row",
    gap: 18,
  },
  stepsMobile: {
    flexDirection: "column",
  },
  stepCard: {
    flex: 1,
    minHeight: 260,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 26,
  },
  stepNumber: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
  },
  stepNumberText: {
    color: "#176BDE",
    fontSize: 14,
    fontWeight: "900",
  },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
  },
  stepTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 22,
  },
  stepDescription: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  catalogButton: {
    alignSelf: "center",
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15,
    backgroundColor: "#176BDE",
    paddingHorizontal: 24,
    marginTop: 30,
  },
  catalogButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});

