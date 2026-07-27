import { Redirect } from "expo-router";
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
import { pobierzWnioski, rozpatrzWniosek } from "@features/loans/loans.service";
import type {
  LoanDecision,
  LoanResponse,
  LoanStatus,
} from "@features/loans/loans.types";

type StatusStyle = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

const statusStyles: Record<LoanStatus, StatusStyle> = {
  oczekujacy: {
    label: "Oczekujący",
    backgroundColor: "#FEF3C7",
    textColor: "#92400E",
  },
  zaakceptowany: {
    label: "Zaakceptowany",
    backgroundColor: "#DBEAFE",
    textColor: "#1E40AF",
  },
  odrzucony: {
    label: "Odrzucony",
    backgroundColor: "#FEE2E2",
    textColor: "#991B1B",
  },
  aktywny: {
    label: "Aktywny",
    backgroundColor: "#DCFCE7",
    textColor: "#166534",
  },
  zwrocony: {
    label: "Zwrócony",
    backgroundColor: "#E2E8F0",
    textColor: "#334155",
  },
};

function formatujDate(data: string) {
  const parsedDate = new Date(data);

  if (Number.isNaN(parsedDate.getTime())) return data;

  return new Intl.DateTimeFormat("pl-PL").format(parsedDate);
}

export default function Dashboard() {
  const { status, user } = useAuth();
  const [wnioski,setWnioski] = useState<LoanResponse[]>([]);
  const [liczbaWnioskow,setLiczbaWnioskow] = useState(0);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string | null>(null);
  const [actionError,setActionError] = useState<string | null>(null);
  const [pendingDecision,setPendingDecision] = useState<{
    id: number;
    decyzja: LoanDecision;
  } | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || user?.rola !== "admin") return;

    async function zaladujWnioski() {
      setError(null);
      setLoading(true);

      try {
        const response = await pobierzWnioski();
        setWnioski(response.dane);
        setLiczbaWnioskow(response.total);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Nie udało się pobrać wniosków");
      } finally {
        setLoading(false);
      }
    }

    void zaladujWnioski();
  }, [status, user?.rola]);

  const wyslijDecyzje = async (wniosek: LoanResponse, decyzja: LoanDecision) => {
    if (wniosek.status !== "oczekujacy" || pendingDecision) return;

    setActionError(null);
    setPendingDecision({ id: wniosek.id, decyzja });

    try {
      const zaktualizowanyWniosek = await rozpatrzWniosek(wniosek.id, { decyzja });

      setWnioski((aktualneWnioski) =>
        aktualneWnioski.map((aktualnyWniosek) =>
          aktualnyWniosek.id === zaktualizowanyWniosek.id
            ? zaktualizowanyWniosek
            : aktualnyWniosek,
        ),
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Nie udało się rozpatrzyć wniosku",
      );
    } finally {
      setPendingDecision(null);
    }
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
        <Text style={styles.title}>Wnioski</Text>
        {!loading && !error && (
          <Text style={styles.summaryText}>Łącznie: {liczbaWnioskow}</Text>
        )}

        {loading && (
          <View style={styles.message}>
            <ActivityIndicator size="large" color="#176BDE" />
            <Text style={styles.messageText}>Ładowanie wniosków...</Text>
          </View>
        )}

        {!loading && error && <Text style={styles.errorText}>{error}</Text>}
        {!loading && actionError && (
          <Text style={styles.actionErrorText}>{actionError}</Text>
        )}

        {!loading && !error && wnioski.length === 0 && (
          <Text style={styles.messageText}>Brak wniosków do wyświetlenia.</Text>
        )}

        {!loading && !error && wnioski.map((wniosek) => {
          const statusStyle = statusStyles[wniosek.status];
          const czyPrzetwarzany = pendingDecision?.id === wniosek.id;
          const przyciskiWylaczone = pendingDecision !== null;

          return (
            <View key={wniosek.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Wniosek #{wniosek.id}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusStyle.backgroundColor },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
                    {statusStyle.label}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Użytkownik</Text>
                  <Text style={styles.detailValue}>#{wniosek.uzytkownik_id}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Sprzęt</Text>
                  <Text style={styles.detailValue}>#{wniosek.sprzet_id}</Text>
                </View>

                <View style={[styles.detailItem, styles.termItem]}>
                  <Text style={styles.detailLabel}>Termin</Text>
                  <Text style={styles.detailValue}>
                    {formatujDate(wniosek.data_od)} – {formatujDate(wniosek.data_do)}
                  </Text>
                </View>
              </View>

              {wniosek.status === "oczekujacy" && (
                <View style={styles.actions}>
                  <Pressable
                    disabled={przyciskiWylaczone}
                    style={[
                      styles.actionButton,
                      styles.acceptButton,
                      przyciskiWylaczone && styles.actionButtonDisabled,
                    ]}
                    onPress={() => void wyslijDecyzje(wniosek, "zaakceptowany")}
                  >
                    <Text style={styles.acceptButtonText}>
                      {czyPrzetwarzany && pendingDecision?.decyzja === "zaakceptowany"
                        ? "Akceptowanie..."
                        : "Zaakceptuj"}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={przyciskiWylaczone}
                    style={[
                      styles.actionButton,
                      styles.rejectButton,
                      przyciskiWylaczone && styles.actionButtonDisabled,
                    ]}
                    onPress={() => void wyslijDecyzje(wniosek, "odrzucony")}
                  >
                    <Text style={styles.rejectButtonText}>
                      {czyPrzetwarzany && pendingDecision?.decyzja === "odrzucony"
                        ? "Odrzucanie..."
                        : "Odrzuć"}
                    </Text>
                  </Pressable>
                </View>
              )}

            </View>
          );
        })}
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
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 24,
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
  actionErrorText: {
    color: "#B91C1C",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 16,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 24,
    marginBottom: 20,
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
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "800",
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  detailItem: {
    minWidth: 170,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    padding: 16,
  },
  termItem: {
    flex: 1,
    minWidth: 260,
  },
  detailLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 7,
  },
  detailValue: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  actionButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    paddingHorizontal: 18,
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  acceptButton: {
    backgroundColor: "#16A34A",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: "#EF4444",
    backgroundColor: "#FFFFFF",
  },
  rejectButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "800",
  },
});
