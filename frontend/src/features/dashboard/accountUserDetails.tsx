import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@components/shared/Layout/PageLayout";
import {
  getAccountById,
  patchAccount,
  putAccount,
  usunKonto,
} from "@features/account";
import type {
  AccountDetails,
  AccountPatchBody,
} from "@features/account";
import type { UserRole } from "@features/auth";

type Form = {
  imie: string;
  nazwisko: string;
  email: string;
  password: string;
  rola: UserRole;
};

const pustyForm: Form = {
  imie: "",
  nazwisko: "",
  email: "",
  password: "",
  rola: "uzytkownik",
};

function formZ(account: AccountDetails): Form {
  return {
    imie: account.imie,
    nazwisko: account.nazwisko,
    email: account.email,
    password: "",
    rola: account.rola,
  };
}

export default function AccountUserDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, user } = useAuth();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [form, setForm] = useState<Form>(pustyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || user?.rola !== "admin") return;

    const accountId = Number(id);

    if (!Number.isInteger(accountId) || accountId <= 0) {
      setError("Nieprawidłowe ID użytkownika");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const response = await getAccountById(accountId);
        setAccount(response);
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
    if (!account || saving) return;

    const body: AccountPatchBody = {
      imie: form.imie.trim(),
      nazwisko: form.nazwisko.trim(),
      email: form.email.trim(),
      ...(form.password.trim() && { password: form.password }),
      ...(account.id !== user?.id && { rola: form.rola }),
    };

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = method === "PATCH"
        ? await patchAccount(account.id, body)
        : await putAccount(account.id, body);

      setAccount(response);
      setForm(formZ(response));
      setEditing(false);
      setMessage("Zapisano zmiany");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  const usun = async () => {
    if (!account || saving || account.id === user?.id) return;

    setSaving(true);
    setError(null);

    try {
      await usunKonto(account.id);
      setDeleteModal(false);
      router.replace("/(tabs)/accountUsers");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Błąd usuwania konta");
      setDeleteModal(false);
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
        <Text style={styles.title}>Szczegóły użytkownika</Text>

        {loading && <ActivityIndicator size="large" color="#176BDE" />}
        {error && <Text style={styles.error}>{error}</Text>}
        {message && <Text style={styles.success}>{message}</Text>}

        {!loading && account && (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.cardTitle}>Użytkownik #{account.id}</Text>

              <View style={styles.headerActions}>
                {!editing && (
                  <Pressable
                    style={styles.editButton}
                    onPress={() => {
                      setForm(formZ(account));
                      setEditing(true);
                    }}
                  >
                    <Text style={styles.buttonText}>Edytuj</Text>
                  </Pressable>
                )}

                <Pressable
                  disabled={account.id === user.id}
                  style={[
                    styles.deleteButton,
                    account.id === user.id && styles.disabled,
                  ]}
                  onPress={() => setDeleteModal(true)}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </Pressable>
              </View>
            </View>

            <Text style={styles.line}>Imię: {account.imie}</Text>
            <Text style={styles.line}>Nazwisko: {account.nazwisko}</Text>
            <Text style={styles.line}>E-mail: {account.email}</Text>
            <Text style={styles.line}>Rola: {account.rola}</Text>
            <Text style={styles.line}>
              2FA: {account.dwuetapowe ? "Włączone" : "Wyłączone"}
            </Text>
            <Text style={styles.line}>Utworzono: {account.data_utworzenia}</Text>

            {editing && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Edycja</Text>

                <Text>Imię</Text>
                <TextInput
                  style={styles.input}
                  value={form.imie}
                  onChangeText={(imie) => setForm({ ...form, imie })}
                />

                <Text>Nazwisko</Text>
                <TextInput
                  style={styles.input}
                  value={form.nazwisko}
                  onChangeText={(nazwisko) => setForm({ ...form, nazwisko })}
                />

                <Text>E-mail</Text>
                <TextInput
                  style={styles.input}
                  value={form.email}
                  autoCapitalize="none"
                  onChangeText={(email) => setForm({ ...form, email })}
                />

                <Text>Nowe hasło (opcjonalne)</Text>
                <TextInput
                  style={styles.input}
                  value={form.password}
                  secureTextEntry
                  onChangeText={(password) => setForm({ ...form, password })}
                />

                {account.id !== user.id && (
                  <View style={styles.roles}>
                    {(["uzytkownik", "admin"] as UserRole[]).map((rola) => (
                      <Pressable
                        key={rola}
                        style={[
                          styles.roleButton,
                          form.rola === rola && styles.roleActive,
                        ]}
                        onPress={() => setForm({ ...form, rola })}
                      >
                        <Text>{rola}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

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

      <Modal
        animationType="fade"
        transparent
        visible={deleteModal}
        onRequestClose={() => setDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="warning-outline" size={34} color="#DC2626" />
            <Text style={styles.modalTitle}>Czy chcesz usunąć konto?</Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModal(false)}
              >
                <Text>NIE</Text>
              </Pressable>
              <Pressable
                disabled={saving}
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={() => void usun()}
              >
                <Text style={styles.buttonText}>TAK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
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
  roles: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  roleButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 8,
  },
  roleActive: {
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
  deleteButton: {
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    padding: 9,
  },
  disabled: {
    opacity: 0.35,
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
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
  },
  modalActions: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
  },
  modalConfirm: {
    backgroundColor: "#DC2626",
  },
});
