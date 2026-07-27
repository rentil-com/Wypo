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
  aktywujWypozyczenie,
  pobierzWnioski,
  przeterminowanyZwrot,
  przypomnienieOdbioru,
  przypomnienieZwrotu,
  rozpatrzWniosek,
  zwrocWypozyczenie,
} from "@features/loans/loans.service";
import type {
  LoanDecision,
  LoansListParams,
  LoanResponse,
  LoanStatus,
} from "@features/loans/loans.types";

type FiltersForm = {
  uzytkownikId: string;
  sprzetId: string;
  status: "" | LoanStatus;
  data: string;
};

const emptyFilters: FiltersForm = {
  uzytkownikId: "",
  sprzetId: "",
  status: "",
  data: "",
};

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

export default function Applications() {
  const { status, user } = useAuth();
  const [wnioski,setWnioski] = useState<LoanResponse[]>([]);
  const [liczbaWnioskow,setLiczbaWnioskow] = useState(0);
  const [liczbaStron,setLiczbaStron] = useState(1);
  const [filterForm,setFilterForm] = useState<FiltersForm>(emptyFilters);
  const [filters,setFilters] = useState<LoansListParams>({ strona: 1 });
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string | null>(null);
  const [actionError,setActionError] = useState<string | null>(null);
  const [actionMessage,setActionMessage] = useState<string | null>(null);
  const [aktywowanyId,setAktywowanyId] = useState<number | null>(null);
  const [zwracanyId,setZwracanyId] = useState<number | null>(null);
  const [pendingReminder,setPendingReminder] = useState<{
    id: number;
    typ: "odbior" | "zwrot" | "przeterminowany";
  } | null>(null);
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
        const response = await pobierzWnioski(filters);
        setWnioski(response.dane);
        setLiczbaWnioskow(response.total);
        setLiczbaStron(response.liczbaStron);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Nie udało się pobrać wniosków");
      } finally {
        setLoading(false);
      }
    }

    void zaladujWnioski();
  }, [filters, status, user?.rola]);

  const filtruj = () => {
    setFilters({
      strona: 1,
      uzytkownik_id: filterForm.uzytkownikId
        ? Number(filterForm.uzytkownikId)
        : undefined,
      sprzet_id: filterForm.sprzetId ? Number(filterForm.sprzetId) : undefined,
      status: filterForm.status || undefined,
      data: filterForm.data.trim() || undefined,
    });
  };

  const wyczyscFiltry = () => {
    setFilterForm(emptyFilters);
    setFilters({ strona: 1 });
  };

  const wyslijDecyzje = async (wniosek: LoanResponse, decyzja: LoanDecision) => {
    if (wniosek.status !== "oczekujacy" || pendingDecision) return;

    setActionError(null);
    setActionMessage(null);
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

  const aktywuj = async (wniosek: LoanResponse) => {
    if (wniosek.status !== "zaakceptowany" || aktywowanyId) return;

    setActionError(null);
    setActionMessage(null);
    setAktywowanyId(wniosek.id);

    try {
      const aktywowany = await aktywujWypozyczenie(wniosek.id);
      setWnioski((aktualne) =>
        aktualne.map((item) => item.id === aktywowany.id ? aktywowany : item),
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Nie udało się aktywować wypożyczenia");
    } finally {
      setAktywowanyId(null);
    }
  };

  const zwroc = async (wniosek: LoanResponse) => {
    if (wniosek.status !== "aktywny" || zwracanyId) return;
    setActionError(null);
    setActionMessage(null);
    setZwracanyId(wniosek.id);

    try {
      const zwrocony = await zwrocWypozyczenie(wniosek.id);
      setWnioski((aktualne) =>
        aktualne.map((item) => item.id === zwrocony.id ? zwrocony : item),
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Nie udało się zwrócić wypożyczenia");
    } finally {
      setZwracanyId(null);
    }
  };

  const przypomnij = async (
    wniosek: LoanResponse,
    typ: "odbior" | "zwrot" | "przeterminowany",
  ) => {
    const czyPrzeterminowany =
      wniosek.status === "aktywny" &&
      new Date(wniosek.data_do).getTime() < Date.now();
    const poprawnyStatus =
      (typ === "odbior" && wniosek.status === "zaakceptowany") ||
      (typ === "zwrot" && wniosek.status === "aktywny") ||
      (typ === "przeterminowany" && czyPrzeterminowany);

    if (!poprawnyStatus || pendingReminder) return;

    setActionError(null);
    setActionMessage(null);
    setPendingReminder({ id: wniosek.id, typ });

    try {
      const response =
        typ === "odbior"
          ? await przypomnienieOdbioru(wniosek.id)
          : typ === "zwrot"
            ? await przypomnienieZwrotu(wniosek.id)
            : await przeterminowanyZwrot(wniosek.id);

      setActionMessage(response.message);
      setWnioski((aktualne) =>
        aktualne.map((item) =>
          item.id === response.wypozyczenie.id
            ? response.wypozyczenie
            : item,
        ),
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Nie udało się wysłać przypomnienia",
      );
    } finally {
      setPendingReminder(null);
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

        <View style={styles.filtersBar}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>ID użytkownika</Text>
            <TextInput
              style={styles.filterInput}
              value={filterForm.uzytkownikId}
              placeholder="Np. 5"
              keyboardType="numeric"
              onChangeText={(value) =>
                /^\d*$/.test(value) &&
                setFilterForm({ ...filterForm, uzytkownikId: value })
              }
            />
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>ID sprzętu</Text>
            <TextInput
              style={styles.filterInput}
              value={filterForm.sprzetId}
              placeholder="Np. 10"
              keyboardType="numeric"
              onChangeText={(value) =>
                /^\d*$/.test(value) &&
                setFilterForm({ ...filterForm, sprzetId: value })
              }
            />
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={filterForm.status}
                onValueChange={(value) =>
                  setFilterForm({ ...filterForm, status: value })
                }
              >
                <Picker.Item label="Wszystkie" value="" />
                <Picker.Item label="Oczekujący" value="oczekujacy" />
                <Picker.Item label="Zaakceptowany" value="zaakceptowany" />
                <Picker.Item label="Odrzucony" value="odrzucony" />
                <Picker.Item label="Aktywny" value="aktywny" />
                <Picker.Item label="Zwrócony" value="zwrocony" />
              </Picker>
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Data</Text>
            <TextInput
              style={styles.filterInput}
              value={filterForm.data}
              placeholder="RRRR-MM-DD"
              onChangeText={(data) => setFilterForm({ ...filterForm, data })}
            />
          </View>

          <Pressable style={styles.filterButton} onPress={filtruj}>
            <Text style={styles.filterButtonText}>Filtruj</Text>
          </Pressable>
          <Pressable style={styles.clearButton} onPress={wyczyscFiltry}>
            <Text style={styles.clearButtonText}>Wyczyść</Text>
          </Pressable>
        </View>

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
        {!loading && actionMessage && (
          <Text style={styles.actionSuccessText}>{actionMessage}</Text>
        )}

        {!loading && !error && wnioski.length === 0 && (
          <Text style={styles.messageText}>Brak wniosków do wyświetlenia.</Text>
        )}

        {!loading && !error && wnioski.map((wniosek) => {
          const statusStyle = statusStyles[wniosek.status];
          const czyPrzetwarzany = pendingDecision?.id === wniosek.id;
          const przyciskiWylaczone = pendingDecision !== null;
          const czyPrzeterminowany =
            wniosek.status === "aktywny" &&
            new Date(wniosek.data_do).getTime() < Date.now();

          return (
            <Pressable
              key={wniosek.id}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/applications/[id]",
                  params: { id: wniosek.id.toString() },
                })
              }
            >
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
                    onPress={(event) => {
                      event.stopPropagation();
                      void wyslijDecyzje(wniosek, "zaakceptowany");
                    }}
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
                    onPress={(event) => {
                      event.stopPropagation();
                      void wyslijDecyzje(wniosek, "odrzucony");
                    }}
                  >
                    <Text style={styles.rejectButtonText}>
                      {czyPrzetwarzany && pendingDecision?.decyzja === "odrzucony"
                        ? "Odrzucanie..."
                        : "Odrzuć"}
                    </Text>
                  </Pressable>
                </View>
              )}

              {wniosek.status === "zaakceptowany" && (
                <View style={styles.actions}>
                  <Pressable
                    disabled={aktywowanyId !== null || pendingReminder !== null}
                    style={[
                      styles.actionButton,
                      styles.activateButton,
                      (aktywowanyId !== null || pendingReminder !== null) &&
                        styles.actionButtonDisabled,
                    ]}
                    onPress={(event) => {
                      event.stopPropagation();
                      void aktywuj(wniosek);
                    }}
                  >
                    <Text style={styles.acceptButtonText}>
                      {aktywowanyId === wniosek.id ? "Aktywowanie..." : "Aktywuj"}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={pendingReminder !== null || aktywowanyId !== null}
                    style={[
                      styles.actionButton,
                      styles.reminderButton,
                      (pendingReminder !== null || aktywowanyId !== null) &&
                        styles.actionButtonDisabled,
                    ]}
                    onPress={(event) => {
                      event.stopPropagation();
                      void przypomnij(wniosek, "odbior");
                    }}
                  >
                    <Text style={styles.acceptButtonText}>
                      {pendingReminder?.id === wniosek.id &&
                      pendingReminder.typ === "odbior"
                        ? "Wysyłanie..."
                        : "Przypomnij o odbiorze"}
                    </Text>
                  </Pressable>
                </View>
              )}

              {wniosek.status === "aktywny" && (
                <View style={styles.actions}>
                  <Pressable
                    disabled={zwracanyId !== null || pendingReminder !== null}
                    style={[
                      styles.actionButton,
                      styles.returnButton,
                      (zwracanyId !== null || pendingReminder !== null) &&
                        styles.actionButtonDisabled,
                    ]}
                    onPress={(event) => {
                      event.stopPropagation();
                      void zwroc(wniosek);
                    }}
                  >
                    <Text style={styles.acceptButtonText}>
                      {zwracanyId === wniosek.id ? "Zwracanie..." : "Zwrot"}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={pendingReminder !== null || zwracanyId !== null}
                    style={[
                      styles.actionButton,
                      styles.reminderButton,
                      (pendingReminder !== null || zwracanyId !== null) &&
                        styles.actionButtonDisabled,
                    ]}
                    onPress={(event) => {
                      event.stopPropagation();
                      void przypomnij(wniosek, "zwrot");
                    }}
                  >
                    <Text style={styles.acceptButtonText}>
                      {pendingReminder?.id === wniosek.id &&
                      pendingReminder.typ === "zwrot"
                        ? "Wysyłanie..."
                        : "Przypomnij o zwrocie"}
                    </Text>
                  </Pressable>

                  {czyPrzeterminowany && (
                    <Pressable
                      disabled={pendingReminder !== null || zwracanyId !== null}
                      style={[
                        styles.actionButton,
                        styles.overdueButton,
                        (pendingReminder !== null || zwracanyId !== null) &&
                          styles.actionButtonDisabled,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        void przypomnij(wniosek, "przeterminowany");
                      }}
                    >
                      <Text style={styles.acceptButtonText}>
                        {pendingReminder?.id === wniosek.id &&
                        pendingReminder.typ === "przeterminowany"
                          ? "Wysyłanie..."
                          : "Informuj o opóźnieniu"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

            </Pressable>
          );
        })}

        {!loading && !error && liczbaStron > 1 && (
          <View style={styles.pagination}>
            <Pressable
              disabled={(filters.strona ?? 1) === 1}
              style={[
                styles.pageButton,
                (filters.strona ?? 1) === 1 && styles.pageButtonDisabled,
              ]}
              onPress={() =>
                setFilters((current) => ({
                  ...current,
                  strona: (current.strona ?? 1) - 1,
                }))
              }
            >
              <Text style={styles.pageButtonText}>Poprzednia</Text>
            </Pressable>

            <Text style={styles.pageText}>
              {filters.strona ?? 1} / {liczbaStron}
            </Text>

            <Pressable
              disabled={(filters.strona ?? 1) >= liczbaStron}
              style={[
                styles.pageButton,
                (filters.strona ?? 1) >= liczbaStron && styles.pageButtonDisabled,
              ]}
              onPress={() =>
                setFilters((current) => ({
                  ...current,
                  strona: (current.strona ?? 1) + 1,
                }))
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
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 24,
  },
  filtersBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 20,
  },
  filterGroup: {
    flexGrow: 1,
    minWidth: 150,
  },
  filterLabel: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  filterInput: {
    height: 46,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  pickerWrapper: {
    height: 46,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  filterButton: {
    height: 46,
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
    height: 46,
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
  actionErrorText: {
    color: "#B91C1C",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 16,
  },
  actionSuccessText: {
    color: "#166534",
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
  cardPressed: {
    borderColor: "#176BDE",
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
  activateButton: {
    backgroundColor: "#2563EB",
  },
  returnButton: {
    backgroundColor: "#7C3AED",
  },
  reminderButton: {
    backgroundColor: "#475569",
  },
  overdueButton: {
    backgroundColor: "#DC2626",
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
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 8,
  },
  pageButton: {
    borderRadius: 9,
    backgroundColor: "#176BDE",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  pageText: {
    color: "#475569",
    fontWeight: "700",
  },
});
