import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
  edytujWypozyczenie,
  nadpiszWypozyczenie,
  pobierzWypozyczeniePoId,
} from "@features/loans/loans.service";
import type {
  LoanPatchBody,
  LoanResponse,
  LoanStatus,
} from "@features/loans/loans.types";

const statusy: LoanStatus[] = [
  "oczekujacy",
  "zaakceptowany",
  "odrzucony",
  "aktywny",
  "zwrocony",
];

type Form = {
  data_od: string;
  data_do: string;
  status: LoanStatus;
  data_zwrotu_rzeczywista: string;
};

const pustyForm: Form = {
  data_od: "",
  data_do: "",
  status: "oczekujacy",
  data_zwrotu_rzeczywista: "",
};

function formZ(wniosek: LoanResponse): Form {
  return {
    data_od: wniosek.data_od,
    data_do: wniosek.data_do,
    status: wniosek.status,
    data_zwrotu_rzeczywista: wniosek.data_zwrotu_rzeczywista ?? "",
  };
}

export default function ApplicationDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, user } = useAuth();
  const [wniosek, setWniosek] = useState<LoanResponse | null>(null);
  const [form, setForm] = useState<Form>(pustyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || user?.rola !== "admin") return;

    const loanId = Number(id);

    if (!Number.isInteger(loanId) || loanId <= 0) {
      setError("Nieprawidłowe ID wypożyczenia");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const response = await pobierzWypozyczeniePoId(loanId);
        setWniosek(response);
        setForm(formZ(response));
      } catch (error) {
        setError(error instanceof Error ? error.message : "Błąd pobierania danych");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id, status, user?.rola]);

  const zapisz = async (method: "PATCH" | "PUT") => {
    if (!wniosek || saving) return;

    const body: LoanPatchBody = {
      data_od: form.data_od.trim(),
      data_do: form.data_do.trim(),
      status: form.status,
      data_zwrotu_rzeczywista:
        form.data_zwrotu_rzeczywista.trim() || null,
    };

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = method === "PATCH"
        ? await edytujWypozyczenie(wniosek.id, body)
        : await nadpiszWypozyczenie(wniosek.id, body);

      setWniosek(response);
      setForm(formZ(response));
      setEditing(false);
      setMessage("Zapisano zmiany");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  if (status !== "authenticated" || user?.rola !== "admin") {
    return <Redirect href="/(tabs)/user" />;
  }

  return (
    <PageLayout wide>
      <View style={styles.content}>
        <Text style={styles.title}>Szczegóły wypożyczenia</Text>

        {loading && <ActivityIndicator size="large" color="#176BDE" />}
        {error && <Text style={styles.error}>{error}</Text>}
        {message && <Text style={styles.success}>{message}</Text>}

        {!loading && wniosek && (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.cardTitle}>Wniosek #{wniosek.id}</Text>
              {!editing && (
                <Pressable
                  style={styles.editButton}
                  onPress={() => {
                    setForm(formZ(wniosek));
                    setEditing(true);
                  }}
                >
                  <Text style={styles.buttonText}>Edytuj</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.line}>Użytkownik ID: {wniosek.uzytkownik_id}</Text>
            <Text style={styles.line}>Numer wniosku: {wniosek.id}</Text>
            <Text style={styles.line}>Sprzęt ID: {wniosek.sprzet_id}</Text>
            <Text style={styles.line}>Data od: {wniosek.data_od}</Text>
            <Text style={styles.line}>Data do: {wniosek.data_do}</Text>
            <Text style={styles.line}>Status: {wniosek.status}</Text>

            {editing && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Edycja</Text>

                <Text>Data od</Text>
                <TextInput
                  style={styles.input}
                  value={form.data_od}
                  onChangeText={(value) => setForm({ ...form, data_od: value })}
                />

                <Text>Data do</Text>
                <TextInput
                  style={styles.input}
                  value={form.data_do}
                  onChangeText={(value) => setForm({ ...form, data_do: value })}
                />

                <Text>Status</Text>
                <View style={styles.statuses}>
                  {statusy.map((item) => (
                    <Pressable
                      key={item}
                      style={[
                        styles.statusButton,
                        form.status === item && styles.statusActive,
                      ]}
                      onPress={() => setForm({ ...form, status: item })}
                    >
                      <Text>{item}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text>Data rzeczywistego zwrotu (opcjonalna)</Text>
                <TextInput
                  style={styles.input}
                  value={form.data_zwrotu_rzeczywista}
                  onChangeText={(value) =>
                    setForm({ ...form, data_zwrotu_rzeczywista: value })
                  }
                />

                <View style={styles.actions}>
                  <Pressable
                    disabled={saving}
                    style={[styles.button, styles.patchButton]}
                    onPress={() => void zapisz("PATCH")}
                  >
                    <Text style={styles.buttonText}>Zapisz zmiany</Text>
                  </Pressable>

                  <Pressable
                    disabled={saving}
                    style={[styles.button, styles.putButton]}
                    onPress={() => void zapisz("PUT")}
                  >
                    <Text style={styles.buttonText}>Nadpisz zmiany</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setEditing(false)}
                  >
                    <Text>Anuluj</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
  },
  content: {
    width: "100%",
    marginTop: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 20,
  },
  card: {
    maxWidth: 900,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 22,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  line: {
    fontSize: 16,
    marginBottom: 10,
    color: "#334155",
  },
  error: {
    color: "#B91C1C",
    marginBottom: 12,
  },
  success: {
    color: "#15803D",
    marginBottom: 12,
  },
  form: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 14,
    paddingTop: 14,
  },
  formTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    marginBottom: 12,
  },
  statuses: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginVertical: 8,
  },
  statusButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 8,
  },
  statusActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  editButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    padding: 10,
  },
  patchButton: {
    backgroundColor: "#16A34A",
  },
  putButton: {
    backgroundColor: "#2563EB",
  },
  cancelButton: {
    backgroundColor: "#E2E8F0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
