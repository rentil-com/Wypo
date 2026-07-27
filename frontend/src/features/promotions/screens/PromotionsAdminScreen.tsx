import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@components/shared/Layout/PageLayout";
import {
  pobierzKategorie,
  type CategoryApiItem,
} from "@features/categories";
import type { ApiItem } from "@features/products";

import {
  dodajPromocje,
  edytujPromocje,
  pobierzPromocje,
  pobierzWszystkichUzytkownikowPromocji,
  pobierzWszystkieProduktyPromocji,
  ustawAktywnoscPromocji,
  wygasPromocje,
} from "../admin-promotions.service";
import type {
  AdminPromotion,
  CreatePromotionBody,
  PromotionAccount,
  PromotionsQueryParams,
  PromotionState,
  PromotionType,
} from "../admin-promotions.types";
import styles from "./PromotionsAdminScreen.styles";

const PUSTE_FILTRY: PromotionsQueryParams = {
  nazwa: "",
  typ: "",
  stan: "",
  sprzet_id: null,
  kategoria_id: null,
  uzytkownik_id: null,
  pokaz_dzienne: false,
};

const ETYKIETY_STANOW: Record<PromotionState, string> = {
  aktywna: "Aktywna",
  zaplanowana: "Zaplanowana",
  wygasla: "Wygasła",
  wylaczona: "Wyłączona",
};

type SelectionOptionProps = {
  label: string;
  selected: boolean;
  mobile: boolean;
  onPress: () => void;
};

function SelectionOption({
  label,
  selected,
  mobile,
  onPress,
}: SelectionOptionProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.selectionOption,
        mobile && styles.selectionOptionMobile,
        selected && styles.selectionOptionSelected,
      ]}
    >
      <View
        style={[
          styles.selectionCheckbox,
          selected && styles.selectionCheckboxSelected,
        ]}
      >
        {selected && (
          <MaterialIcons name="check" size={15} color="#FFFFFF" />
        )}
      </View>
      <Text
        numberOfLines={2}
        style={[
          styles.selectionOptionText,
          selected && styles.selectionOptionTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function lokalnaDataZaDni(dni: number) {
  const data = new Date();

  data.setDate(data.getDate() + dni);
  data.setMinutes(data.getMinutes() - data.getTimezoneOffset());

  return data.toISOString().slice(0, 16);
}

function formatujDateDoPola(value: string) {
  const data = new Date(value);

  data.setMinutes(data.getMinutes() - data.getTimezoneOffset());

  return data.toISOString().slice(0, 16);
}

function formatujDate(value: string | null) {
  if (!value) {
    return "Bezterminowo";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatujWartosc(promocja: AdminPromotion) {
  const wartosc = promocja.wartosc.toString().replace(".", ",");

  return promocja.typ === "procentowa" ? `${wartosc}%` : `${wartosc} zł`;
}

function nazwaUzytkownika(uzytkownik: PromotionAccount) {
  const imieNazwisko = [uzytkownik.imie, uzytkownik.nazwisko]
    .filter(Boolean)
    .join(" ");

  return imieNazwisko
    ? `${imieNazwisko} · ${uzytkownik.email}`
    : uzytkownik.email;
}

function przelaczId(ids: number[], id: number) {
  return ids.includes(id)
    ? ids.filter((currentId) => currentId !== id)
    : [...ids, id];
}

export default function PromotionsAdminScreen() {
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const { status, user } = useAuth();
  const isAdmin = status === "authenticated" && user?.rola === "admin";

  const [promocje, setPromocje] = useState<AdminPromotion[]>([]);
  const [strona, setStrona] = useState(1);
  const [liczbaStron, setLiczbaStron] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtryRobocze, setFiltryRobocze] =
    useState<PromotionsQueryParams>(PUSTE_FILTRY);
  const [filtry, setFiltry] =
    useState<PromotionsQueryParams>(PUSTE_FILTRY);
  const [odswiezenie, setOdswiezenie] = useState(0);

  const [kategorie, setKategorie] = useState<CategoryApiItem[]>([]);
  const [produkty, setProdukty] = useState<ApiItem[]>([]);
  const [uzytkownicy, setUzytkownicy] = useState<PromotionAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOpcji, setLoadingOpcji] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingId, setChangingId] = useState<number | null>(null);
  const [wygaszanaPromocjaId, setWygaszanaPromocjaId] = useState<number | null>(null);
  const [promocjaDoWygaszenia, setPromocjaDoWygaszenia] =
    useState<AdminPromotion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formularzWidoczny, setFormularzWidoczny] = useState(false);
  const [edytowanaPromocjaId, setEdytowanaPromocjaId] = useState<number | null>(null);
  const [scrollToTopKey, setScrollToTopKey] = useState(0);

  const [nazwa, setNazwa] = useState("");
  const [opis, setOpis] = useState("");
  const [typ, setTyp] = useState<PromotionType>("procentowa");
  const [wartosc, setWartosc] = useState("");
  const [dataOd, setDataOd] = useState(lokalnaDataZaDni(0));
  const [dataDo, setDataDo] = useState(lokalnaDataZaDni(7));
  const [bezterminowa, setBezterminowa] = useState(false);
  const [aktywna, setAktywna] = useState(true);
  const [wszystkieSprzety, setWszystkieSprzety] = useState(true);
  const [kategorieIds, setKategorieIds] = useState<number[]>([]);
  const [sprzetyIds, setSprzetyIds] = useState<number[]>([]);
  const [wszyscyUzytkownicy, setWszyscyUzytkownicy] = useState(true);
  const [uzytkownicyIds, setUzytkownicyIds] = useState<number[]>([]);
  const [szukanaKategoria, setSzukanaKategoria] = useState("");
  const [szukanySprzet, setSzukanySprzet] = useState("");
  const [szukanyUzytkownik, setSzukanyUzytkownik] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let cancelled = false;

    async function zaladujOpcje() {
      setLoadingOpcji(true);
      setError(null);

      try {
        const [categoryResponse, productsResponse, usersResponse] =
          await Promise.all([
            pobierzKategorie(),
            pobierzWszystkieProduktyPromocji(),
            pobierzWszystkichUzytkownikowPromocji(),
          ]);

        if (!cancelled) {
          setKategorie(categoryResponse);
          setProdukty(productsResponse);
          setUzytkownicy(usersResponse);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nie udało się pobrać danych formularza",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingOpcji(false);
        }
      }
    }

    void zaladujOpcje();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let cancelled = false;

    async function zaladujPromocje() {
      setLoading(true);
      setError(null);

      try {
        const response = await pobierzPromocje({
          ...filtry,
          strona,
        });

        if (!cancelled) {
          setPromocje(response.dane);
          setTotal(response.total);
          setLiczbaStron(Math.max(response.liczbaStron, 1));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nie udało się pobrać promocji",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void zaladujPromocje();

    return () => {
      cancelled = true;
    };
  }, [filtry, isAdmin, odswiezenie, strona]);

  const kategorieMap = useMemo(
    () => new Map(kategorie.map((kategoria) => [kategoria.id, kategoria.nazwa])),
    [kategorie],
  );
  const produktyMap = useMemo(
    () => new Map(produkty.map((produkt) => [produkt.id, produkt.nazwa])),
    [produkty],
  );
  const uzytkownicyMap = useMemo(
    () => new Map(
      uzytkownicy.map((uzytkownik) => [
        uzytkownik.id,
        nazwaUzytkownika(uzytkownik),
      ]),
    ),
    [uzytkownicy],
  );

  const widoczneKategorie = useMemo(() => {
    const query = szukanaKategoria.trim().toLowerCase();

    return kategorie
      .filter((kategoria) => kategoria.nazwa.toLowerCase().includes(query))
      .slice(0, 20);
  }, [kategorie, szukanaKategoria]);

  const widoczneProdukty = useMemo(() => {
    const query = szukanySprzet.trim().toLowerCase();

    return produkty
      .filter((produkt) => produkt.nazwa.toLowerCase().includes(query))
      .slice(0, 20);
  }, [produkty, szukanySprzet]);

  const widoczniUzytkownicy = useMemo(() => {
    const query = szukanyUzytkownik.trim().toLowerCase();

    return uzytkownicy
      .filter((uzytkownik) =>
        nazwaUzytkownika(uzytkownik).toLowerCase().includes(query),
      )
      .slice(0, 20);
  }, [szukanyUzytkownik, uzytkownicy]);

  if (status === "loading") {
    return (
      <View style={styles.stateScreen}>
        <ActivityIndicator size="large" color="#176BDE" />
      </View>
    );
  }

  if (!isAdmin) {
    return <Redirect href="/(tabs)/user" />;
  }

  function wyczyscFormularz() {
    setNazwa("");
    setOpis("");
    setTyp("procentowa");
    setWartosc("");
    setDataOd(lokalnaDataZaDni(0));
    setDataDo(lokalnaDataZaDni(7));
    setBezterminowa(false);
    setAktywna(true);
    setWszystkieSprzety(true);
    setKategorieIds([]);
    setSprzetyIds([]);
    setWszyscyUzytkownicy(true);
    setUzytkownicyIds([]);
    setSzukanaKategoriePuste();
    setEdytowanaPromocjaId(null);
  }

  function setSzukanaKategoriePuste() {
    setSzukanaKategoria("");
    setSzukanySprzet("");
    setSzukanyUzytkownik("");
  }

  function rozpocznijEdycje(promocja: AdminPromotion) {
    setError(null);
    setSuccess(null);
    setNazwa(promocja.nazwa);
    setOpis(promocja.opis ?? "");
    setTyp(promocja.typ);
    setWartosc(promocja.wartosc.toString().replace(".", ","));
    setDataOd(formatujDateDoPola(promocja.data_od));
    setDataDo(
      promocja.data_do
        ? formatujDateDoPola(promocja.data_do)
        : lokalnaDataZaDni(7),
    );
    setBezterminowa(promocja.data_do === null);
    setAktywna(promocja.aktywna);
    setWszystkieSprzety(promocja.zakres_sprzetow.wszystkie);
    setKategorieIds([...promocja.zakres_sprzetow.kategorie_ids]);
    setSprzetyIds([...promocja.zakres_sprzetow.sprzety_ids]);
    setWszyscyUzytkownicy(promocja.zakres_uzytkownikow.wszyscy);
    setUzytkownicyIds([...promocja.zakres_uzytkownikow.uzytkownicy_ids]);
    setSzukanaKategoriePuste();
    setEdytowanaPromocjaId(promocja.id);
    setFormularzWidoczny(true);
    setScrollToTopKey((value) => value + 1);
  }

  function zastosujFiltry() {
    setStrona(1);
    setFiltry({ ...filtryRobocze });
  }

  function wyczyscFiltry() {
    setStrona(1);
    setFiltryRobocze({ ...PUSTE_FILTRY });
    setFiltry({ ...PUSTE_FILTRY });
  }

  function opisZakresuSprzetow(promocja: AdminPromotion) {
    if (promocja.zakres_sprzetow.wszystkie) {
      return "Wszystkie sprzęty";
    }

    const nazwyKategorii = promocja.zakres_sprzetow.kategorie_ids
      .map((id) => kategorieMap.get(id) || `Kategoria #${id}`);
    const nazwySprzetow = promocja.zakres_sprzetow.sprzety_ids
      .map((id) => produktyMap.get(id) || `Sprzęt #${id}`);
    const zakres = [...nazwyKategorii, ...nazwySprzetow];

    return zakres.length <= 2
      ? zakres.join(", ")
      : `${zakres.slice(0, 2).join(", ")} +${zakres.length - 2}`;
  }

  function opisZakresuUzytkownikow(promocja: AdminPromotion) {
    if (promocja.zakres_uzytkownikow.wszyscy) {
      return "Wszyscy użytkownicy";
    }

    const nazwy = promocja.zakres_uzytkownikow.uzytkownicy_ids
      .map((id) => uzytkownicyMap.get(id) || `Użytkownik #${id}`);

    return nazwy.length <= 2
      ? nazwy.join(", ")
      : `${nazwy.slice(0, 2).join(", ")} +${nazwy.length - 2}`;
  }

  async function zapiszPromocje() {
    setError(null);
    setSuccess(null);

    const poprawnaNazwa = nazwa.trim();
    const poprawnaWartosc = Number(wartosc.trim().replace(",", "."));
    const poczatek = new Date(dataOd);
    const koniec = bezterminowa ? null : new Date(dataDo);

    if (!poprawnaNazwa) {
      setError("Nazwa promocji jest wymagana");
      return;
    }

    if (!Number.isFinite(poprawnaWartosc) || poprawnaWartosc <= 0) {
      setError("Wartość promocji musi być większa od zera");
      return;
    }

    if (typ === "procentowa" && poprawnaWartosc > 100) {
      setError("Rabat procentowy nie może przekraczać 100%");
      return;
    }

    if (Number.isNaN(poczatek.getTime())) {
      setError("Podaj prawidłową datę rozpoczęcia");
      return;
    }

    if (
      koniec &&
      (Number.isNaN(koniec.getTime()) || koniec.getTime() <= poczatek.getTime())
    ) {
      setError("Data zakończenia musi być późniejsza od daty rozpoczęcia");
      return;
    }

    if (
      !wszystkieSprzety &&
      kategorieIds.length === 0 &&
      sprzetyIds.length === 0
    ) {
      setError("Wybierz co najmniej jedną kategorię lub jeden sprzęt");
      return;
    }

    if (!wszyscyUzytkownicy && uzytkownicyIds.length === 0) {
      setError("Wybierz co najmniej jednego użytkownika");
      return;
    }

    const body: CreatePromotionBody = {
      nazwa: poprawnaNazwa,
      typ,
      wartosc: poprawnaWartosc,
      aktywna,
      data_od: poczatek.toISOString(),
      data_do: koniec?.toISOString() ?? null,
      zakres_sprzetow: {
        wszystkie: wszystkieSprzety,
        kategorie_ids: wszystkieSprzety ? [] : kategorieIds,
        sprzety_ids: wszystkieSprzety ? [] : sprzetyIds,
      },
      zakres_uzytkownikow: {
        wszyscy: wszyscyUzytkownicy,
        uzytkownicy_ids: wszyscyUzytkownicy ? [] : uzytkownicyIds,
      },
    };

    if (opis.trim() || edytowanaPromocjaId !== null) {
      body.opis = opis.trim();
    }

    setSaving(true);
    const edytowanyId = edytowanaPromocjaId;

    try {
      if (edytowanyId !== null) {
        await edytujPromocje(edytowanyId, body);
      } else {
        await dodajPromocje(body);
      }

      wyczyscFormularz();
      setFormularzWidoczny(false);

      if (edytowanyId === null) {
        setFiltryRobocze({ ...PUSTE_FILTRY });
        setFiltry({ ...PUSTE_FILTRY });
        setStrona(1);
      }

      setOdswiezenie((value) => value + 1);
      setSuccess(
        edytowanyId === null
          ? "Promocja została dodana"
          : "Zmiany promocji zostały zapisane",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : edytowanyId === null
            ? "Nie udało się dodać promocji"
            : "Nie udało się zapisać zmian promocji",
      );
    } finally {
      setSaving(false);
    }
  }

  async function zmienAktywnosc(promocja: AdminPromotion) {
    setChangingId(promocja.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await ustawAktywnoscPromocji(
        promocja.id,
        !promocja.aktywna,
      );

      setPromocje((currentPromotions) =>
        currentPromotions.map((currentPromotion) =>
          currentPromotion.id === response.id ? response : currentPromotion,
        ),
      );
      setSuccess(
        response.aktywna
          ? "Promocja została włączona"
          : "Promocja została wyłączona",
      );
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Nie udało się zmienić promocji",
      );
    } finally {
      setChangingId(null);
    }
  }

  async function wygasPromocjeTeraz() {
    const promocja = promocjaDoWygaszenia;

    if (!promocja) {
      return;
    }

    setWygaszanaPromocjaId(promocja.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await wygasPromocje(promocja.id);

      setPromocje((currentPromotions) =>
        currentPromotions.map((currentPromotion) =>
          currentPromotion.id === response.id ? response : currentPromotion,
        ),
      );
      setPromocjaDoWygaszenia(null);
      setSuccess("Promocja została wygaszona");
    } catch (expireError) {
      setPromocjaDoWygaszenia(null);
      setError(
        expireError instanceof Error
          ? expireError.message
          : "Nie udało się wygasić promocji",
      );
    } finally {
      setWygaszanaPromocjaId(null);
    }
  }

  return (
    <PageLayout wide scrollToTopKey={scrollToTopKey}>
      <View style={[styles.content, mobile && styles.contentMobile]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={19} color="#1D4ED8" />
          <Text style={styles.backButtonText}>Wróć</Text>
        </Pressable>

        <View style={[styles.hero, mobile && styles.heroMobile]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>ADMIN · PROMOCJE</Text>
            <Text style={[styles.title, mobile && styles.titleMobile]}>
              Panel promocji
            </Text>
            <Text style={styles.description}>
              Przeglądaj i filtruj promocje oraz twórz rabaty dla sprzętów,
              kategorii i wybranych użytkowników.
            </Text>
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              mobile && styles.fullWidthButton,
            ]}
            onPress={() => {
              setError(null);
              setSuccess(null);

              if (formularzWidoczny) {
                wyczyscFormularz();
                setFormularzWidoczny(false);
                return;
              }

              wyczyscFormularz();
              setFormularzWidoczny(true);
              setScrollToTopKey((value) => value + 1);
            }}
          >
            <MaterialIcons
              name={formularzWidoczny ? "close" : "add"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.primaryButtonText}>
              {formularzWidoczny ? "Zamknij formularz" : "Dodaj promocję"}
            </Text>
          </Pressable>
        </View>

        {error && (
          <View style={[styles.message, styles.errorMessage]}>
            <MaterialIcons name="error-outline" size={20} color="#B91C1C" />
            <Text style={styles.errorMessageText}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={[styles.message, styles.successMessage]}>
            <MaterialIcons name="check-circle" size={20} color="#047857" />
            <Text style={styles.successMessageText}>{success}</Text>
          </View>
        )}

        {formularzWidoczny && (
          <View style={[styles.panel, styles.formPanel]}>
            <View style={styles.panelHeading}>
              <View>
                <Text style={styles.panelTitle}>
                  {edytowanaPromocjaId === null
                    ? "Nowa promocja"
                    : `Edytuj promocję #${edytowanaPromocjaId}`}
                </Text>
                <Text style={styles.panelDescription}>
                  Pola oznaczone gwiazdką są wymagane.
                </Text>
              </View>
              <View style={styles.formStepBadge}>
                <MaterialIcons
                  name={edytowanaPromocjaId === null ? "local-offer" : "edit"}
                  size={18}
                  color="#176BDE"
                />
                <Text style={styles.formStepBadgeText}>
                  {edytowanaPromocjaId === null ? "Konfiguracja" : "Edycja"}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Podstawowe informacje</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nazwa promocji *</Text>
              <TextInput
                value={nazwa}
                onChangeText={setNazwa}
                style={styles.input}
                placeholder="Np. Weekend z elektronarzędziami"
                placeholderTextColor="#94A3B8"
                maxLength={100}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Opis</Text>
              <TextInput
                value={opis}
                onChangeText={setOpis}
                style={[styles.input, styles.textArea]}
                placeholder="Krótko opisz zasady promocji"
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={[styles.fieldsRow, mobile && styles.fieldsRowMobile]}>
              <View style={styles.rowField}>
                <Text style={styles.fieldLabel}>Rodzaj rabatu *</Text>
                <View style={styles.segmentedControl}>
                  <Pressable
                    style={[
                      styles.segment,
                      typ === "procentowa" && styles.segmentActive,
                    ]}
                    onPress={() => setTyp("procentowa")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        typ === "procentowa" && styles.segmentTextActive,
                      ]}
                    >
                      Procentowy
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.segment,
                      typ === "kwotowa" && styles.segmentActive,
                    ]}
                    onPress={() => setTyp("kwotowa")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        typ === "kwotowa" && styles.segmentTextActive,
                      ]}
                    >
                      Kwotowy
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.rowField}>
                <Text style={styles.fieldLabel}>
                  Wartość rabatu ({typ === "procentowa" ? "%" : "zł"}) *
                </Text>
                <TextInput
                  value={wartosc}
                  onChangeText={setWartosc}
                  style={styles.input}
                  placeholder={typ === "procentowa" ? "Np. 20" : "Np. 25,00"}
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={[styles.fieldsRow, mobile && styles.fieldsRowMobile]}>
              <View style={styles.rowField}>
                <Text style={styles.fieldLabel}>Data rozpoczęcia *</Text>
                <TextInput
                  value={dataOd}
                  onChangeText={setDataOd}
                  style={styles.input}
                  placeholder="RRRR-MM-DDTGG:MM"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.rowField}>
                <Text style={styles.fieldLabel}>Data zakończenia</Text>
                <TextInput
                  value={dataDo}
                  onChangeText={setDataDo}
                  editable={!bezterminowa}
                  style={[
                    styles.input,
                    bezterminowa && styles.inputDisabled,
                  ]}
                  placeholder="RRRR-MM-DDTGG:MM"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={[styles.switchesRow, mobile && styles.switchesRowMobile]}>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: bezterminowa }}
                style={styles.switchOption}
                onPress={() => setBezterminowa((value) => !value)}
              >
                <View
                  style={[
                    styles.switchTrack,
                    bezterminowa && styles.switchTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      bezterminowa && styles.switchThumbActive,
                    ]}
                  />
                </View>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchLabel}>Bez daty zakończenia</Text>
                  <Text style={styles.switchDescription}>
                    Promocja pozostanie aktywna do ręcznego wyłączenia.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: aktywna }}
                style={styles.switchOption}
                onPress={() => setAktywna((value) => !value)}
              >
                <View
                  style={[
                    styles.switchTrack,
                    aktywna && styles.switchTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      aktywna && styles.switchThumbActive,
                    ]}
                  />
                </View>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchLabel}>Promocja włączona</Text>
                  <Text style={styles.switchDescription}>
                    Zadziała automatycznie w wybranym terminie.
                  </Text>
                </View>
              </Pressable>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Zakres sprzętów i kategorii</Text>

            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: wszystkieSprzety }}
              style={styles.allScopeOption}
              onPress={() => setWszystkieSprzety((value) => !value)}
            >
              <View style={styles.allScopeIcon}>
                <MaterialIcons name="inventory-2" size={23} color="#176BDE" />
              </View>
              <View style={styles.switchCopy}>
                <Text style={styles.switchLabel}>Wszystkie sprzęty</Text>
                <Text style={styles.switchDescription}>
                  Wyłącz, aby wskazać konkretne kategorie lub produkty.
                </Text>
              </View>
              <View
                style={[
                  styles.switchTrack,
                  wszystkieSprzety && styles.switchTrackActive,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    wszystkieSprzety && styles.switchThumbActive,
                  ]}
                />
              </View>
            </Pressable>

            {!wszystkieSprzety && (
              <>
                <View style={styles.selectionGroup}>
                  <View style={styles.selectionHeading}>
                    <Text style={styles.selectionTitle}>Kategorie</Text>
                    <Text style={styles.selectionCount}>
                      Wybrano: {kategorieIds.length}
                    </Text>
                  </View>
                  <TextInput
                    value={szukanaKategoria}
                    onChangeText={setSzukanaKategoria}
                    style={styles.input}
                    placeholder="Szukaj kategorii"
                    placeholderTextColor="#94A3B8"
                  />
                  <View style={styles.selectionGrid}>
                    {widoczneKategorie.map((kategoria) => (
                      <SelectionOption
                        key={kategoria.id}
                        label={kategoria.nazwa}
                        selected={kategorieIds.includes(kategoria.id)}
                        mobile={mobile}
                        onPress={() =>
                          setKategorieIds((ids) =>
                            przelaczId(ids, kategoria.id),
                          )
                        }
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.selectionGroup}>
                  <View style={styles.selectionHeading}>
                    <Text style={styles.selectionTitle}>Sprzęty</Text>
                    <Text style={styles.selectionCount}>
                      Wybrano: {sprzetyIds.length}
                    </Text>
                  </View>
                  <TextInput
                    value={szukanySprzet}
                    onChangeText={setSzukanySprzet}
                    style={styles.input}
                    placeholder="Szukaj sprzętu"
                    placeholderTextColor="#94A3B8"
                  />
                  <View style={styles.selectionGrid}>
                    {widoczneProdukty.map((produkt) => (
                      <SelectionOption
                        key={produkt.id}
                        label={produkt.nazwa}
                        selected={sprzetyIds.includes(produkt.id)}
                        mobile={mobile}
                        onPress={() =>
                          setSprzetyIds((ids) =>
                            przelaczId(ids, produkt.id),
                          )
                        }
                      />
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Odbiorcy promocji</Text>

            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: wszyscyUzytkownicy }}
              style={styles.allScopeOption}
              onPress={() => setWszyscyUzytkownicy((value) => !value)}
            >
              <View style={styles.allScopeIcon}>
                <MaterialIcons name="groups" size={24} color="#176BDE" />
              </View>
              <View style={styles.switchCopy}>
                <Text style={styles.switchLabel}>Wszyscy użytkownicy</Text>
                <Text style={styles.switchDescription}>
                  Wyłącz, aby ograniczyć promocję do wybranych kont.
                </Text>
              </View>
              <View
                style={[
                  styles.switchTrack,
                  wszyscyUzytkownicy && styles.switchTrackActive,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    wszyscyUzytkownicy && styles.switchThumbActive,
                  ]}
                />
              </View>
            </Pressable>

            {!wszyscyUzytkownicy && (
              <View style={styles.selectionGroup}>
                <View style={styles.selectionHeading}>
                  <Text style={styles.selectionTitle}>Użytkownicy</Text>
                  <Text style={styles.selectionCount}>
                    Wybrano: {uzytkownicyIds.length}
                  </Text>
                </View>
                <TextInput
                  value={szukanyUzytkownik}
                  onChangeText={setSzukanyUzytkownik}
                  style={styles.input}
                  placeholder="Szukaj po imieniu, nazwisku lub e-mailu"
                  placeholderTextColor="#94A3B8"
                />
                <View style={styles.selectionGrid}>
                  {widoczniUzytkownicy.map((uzytkownik) => (
                    <SelectionOption
                      key={uzytkownik.id}
                      label={nazwaUzytkownika(uzytkownik)}
                      selected={uzytkownicyIds.includes(uzytkownik.id)}
                      mobile={mobile}
                      onPress={() =>
                        setUzytkownicyIds((ids) =>
                          przelaczId(ids, uzytkownik.id),
                        )
                      }
                    />
                  ))}
                </View>
              </View>
            )}

            {loadingOpcji && (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color="#176BDE" />
                <Text style={styles.inlineLoadingText}>
                  Pobieranie kategorii, sprzętów i użytkowników...
                </Text>
              </View>
            )}

            <View style={[styles.formActions, mobile && styles.formActionsMobile]}>
              <Pressable
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => {
                  wyczyscFormularz();
                  setFormularzWidoczny(false);
                }}
              >
                <Text style={styles.secondaryButtonText}>Anuluj</Text>
              </Pressable>
              <Pressable
                disabled={saving || loadingOpcji}
                style={[
                  styles.actionButton,
                  styles.primaryButton,
                  (saving || loadingOpcji) && styles.buttonDisabled,
                ]}
                onPress={() => void zapiszPromocje()}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialIcons
                    name={edytowanaPromocjaId === null ? "add" : "save"}
                    size={19}
                    color="#FFFFFF"
                  />
                )}
                <Text style={styles.primaryButtonText}>
                  {saving
                    ? "Zapisywanie..."
                    : edytowanaPromocjaId === null
                      ? "Dodaj promocję"
                      : "Zapisz zmiany"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <View>
              <Text style={styles.panelTitle}>Promocje</Text>
              <Text style={styles.panelDescription}>
                {total === 1 ? "1 wynik" : `${total} wyników`}
              </Text>
            </View>
            <View style={styles.resultBadge}>
              <MaterialIcons name="tune" size={17} color="#475569" />
              <Text style={styles.resultBadgeText}>Filtry</Text>
            </View>
          </View>

          <View style={[styles.filtersGrid, mobile && styles.filtersGridMobile]}>
            <View style={[styles.filterField, mobile && styles.filterFieldMobile]}>
              <Text style={styles.fieldLabel}>Nazwa</Text>
              <TextInput
                value={filtryRobocze.nazwa}
                onChangeText={(value) =>
                  setFiltryRobocze((current) => ({
                    ...current,
                    nazwa: value,
                  }))
                }
                style={styles.input}
                placeholder="Szukaj promocji"
                placeholderTextColor="#94A3B8"
                returnKeyType="search"
                onSubmitEditing={zastosujFiltry}
              />
            </View>

            <View style={[styles.filterField, mobile && styles.filterFieldMobile]}>
              <Text style={styles.fieldLabel}>Stan</Text>
              <View style={styles.selectWrapper}>
                <Picker
                  selectedValue={filtryRobocze.stan || ""}
                  onValueChange={(value) =>
                    setFiltryRobocze((current) => ({
                      ...current,
                      stan: value as PromotionState | "",
                    }))
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Wszystkie" value="" />
                  <Picker.Item label="Aktywne" value="aktywna" />
                  <Picker.Item label="Zaplanowane" value="zaplanowana" />
                  <Picker.Item label="Wygasłe" value="wygasla" />
                  <Picker.Item label="Wyłączone" value="wylaczona" />
                </Picker>
              </View>
            </View>

            <View style={[styles.filterField, mobile && styles.filterFieldMobile]}>
              <Text style={styles.fieldLabel}>Rodzaj</Text>
              <View style={styles.selectWrapper}>
                <Picker
                  selectedValue={filtryRobocze.typ || ""}
                  onValueChange={(value) =>
                    setFiltryRobocze((current) => ({
                      ...current,
                      typ: value as PromotionType | "",
                    }))
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Wszystkie" value="" />
                  <Picker.Item label="Procentowe" value="procentowa" />
                  <Picker.Item label="Kwotowe" value="kwotowa" />
                </Picker>
              </View>
            </View>

            <View style={[styles.filterField, mobile && styles.filterFieldMobile]}>
              <Text style={styles.fieldLabel}>Sprzęt</Text>
              <View style={styles.selectWrapper}>
                <Picker
                  selectedValue={filtryRobocze.sprzet_id?.toString() || ""}
                  onValueChange={(value) =>
                    setFiltryRobocze((current) => ({
                      ...current,
                      sprzet_id: value ? Number(value) : null,
                    }))
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Wszystkie sprzęty" value="" />
                  {produkty.map((produkt) => (
                    <Picker.Item
                      key={produkt.id}
                      label={produkt.nazwa}
                      value={produkt.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={[styles.filterField, mobile && styles.filterFieldMobile]}>
              <Text style={styles.fieldLabel}>Kategoria</Text>
              <View style={styles.selectWrapper}>
                <Picker
                  selectedValue={filtryRobocze.kategoria_id?.toString() || ""}
                  onValueChange={(value) =>
                    setFiltryRobocze((current) => ({
                      ...current,
                      kategoria_id: value ? Number(value) : null,
                    }))
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Wszystkie kategorie" value="" />
                  {kategorie.map((kategoria) => (
                    <Picker.Item
                      key={kategoria.id}
                      label={kategoria.nazwa}
                      value={kategoria.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={[styles.filterField, mobile && styles.filterFieldMobile]}>
              <Text style={styles.fieldLabel}>Użytkownik</Text>
              <View style={styles.selectWrapper}>
                <Picker
                  selectedValue={filtryRobocze.uzytkownik_id?.toString() || ""}
                  onValueChange={(value) =>
                    setFiltryRobocze((current) => ({
                      ...current,
                      uzytkownik_id: value ? Number(value) : null,
                    }))
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Wszyscy użytkownicy" value="" />
                  {uzytkownicy.map((uzytkownik) => (
                    <Picker.Item
                      key={uzytkownik.id}
                      label={nazwaUzytkownika(uzytkownik)}
                      value={uzytkownik.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={[styles.filterField, mobile && styles.filterFieldMobile]}>
              <Text style={styles.fieldLabel}>Promocje dzienne</Text>
              <SelectionOption
                label='Pokaż rekordy „Dzienna promocja”'
                selected={Boolean(filtryRobocze.pokaz_dzienne)}
                mobile
                onPress={() =>
                  setFiltryRobocze((current) => ({
                    ...current,
                    pokaz_dzienne: !current.pokaz_dzienne,
                  }))
                }
              />
            </View>
          </View>

          <View style={[styles.filterActions, mobile && styles.filterActionsMobile]}>
            <Pressable
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={wyczyscFiltry}
            >
              <MaterialIcons name="refresh" size={18} color="#475569" />
              <Text style={styles.secondaryButtonText}>Wyczyść</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={zastosujFiltry}
            >
              <MaterialIcons name="filter-alt" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Zastosuj filtry</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.promotionsList}>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#176BDE" />
              <Text style={styles.emptyStateText}>Pobieranie promocji...</Text>
            </View>
          ) : promocje.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <MaterialIcons name="sell" size={30} color="#176BDE" />
              </View>
              <Text style={styles.emptyStateTitle}>Brak promocji</Text>
              <Text style={styles.emptyStateText}>
                Zmień filtry albo dodaj pierwszą promocję.
              </Text>
            </View>
          ) : (
            promocje.map((promocja) => (
              <View
                key={promocja.id}
                style={[styles.promotionCard, mobile && styles.promotionCardMobile]}
              >
                <View style={styles.promotionMain}>
                  <View style={styles.promotionTitleRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        styles[`status_${promocja.stan}`],
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          styles[`statusDot_${promocja.stan}`],
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          styles[`statusText_${promocja.stan}`],
                        ]}
                      >
                        {ETYKIETY_STANOW[promocja.stan]}
                      </Text>
                    </View>
                    <Text style={styles.promotionId}>#{promocja.id}</Text>
                  </View>

                  <Text style={styles.promotionName}>{promocja.nazwa}</Text>
                  {promocja.opis && (
                    <Text style={styles.promotionDescription} numberOfLines={2}>
                      {promocja.opis}
                    </Text>
                  )}

                  <View style={styles.scopeList}>
                    <View style={styles.scopeRow}>
                      <MaterialIcons
                        name="inventory-2"
                        size={18}
                        color="#64748B"
                      />
                      <Text style={styles.scopeText}>
                        {opisZakresuSprzetow(promocja)}
                      </Text>
                    </View>
                    <View style={styles.scopeRow}>
                      <MaterialIcons
                        name="group"
                        size={18}
                        color="#64748B"
                      />
                      <Text style={styles.scopeText}>
                        {opisZakresuUzytkownikow(promocja)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.promotionDetails,
                    mobile && styles.promotionDetailsMobile,
                  ]}
                >
                  <View style={styles.discountValue}>
                    <Text style={styles.discountValueText}>
                      {formatujWartosc(promocja)}
                    </Text>
                    <Text style={styles.discountType}>
                      {promocja.typ === "procentowa"
                        ? "rabat procentowy"
                        : "rabat kwotowy"}
                    </Text>
                  </View>

                  <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>Od</Text>
                    <Text style={styles.dateValue}>
                      {formatujDate(promocja.data_od)}
                    </Text>
                    <Text style={[styles.dateLabel, styles.dateLabelEnd]}>
                      Do
                    </Text>
                    <Text style={styles.dateValue}>
                      {formatujDate(promocja.data_do)}
                    </Text>
                  </View>

                  <View style={styles.promotionActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Edytuj promocję ${promocja.nazwa}`}
                      disabled={saving}
                      style={[
                        styles.togglePromotionButton,
                        styles.editPromotionButton,
                        saving && styles.buttonDisabled,
                      ]}
                      onPress={() => rozpocznijEdycje(promocja)}
                    >
                      <MaterialIcons name="edit" size={18} color="#1D4ED8" />
                      <Text
                        style={[
                          styles.togglePromotionButtonText,
                          styles.editPromotionButtonText,
                        ]}
                      >
                        Edytuj
                      </Text>
                    </Pressable>

                    {promocja.stan === "aktywna" && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Wygaś promocję ${promocja.nazwa}`}
                        disabled={wygaszanaPromocjaId === promocja.id}
                        style={[
                          styles.togglePromotionButton,
                          styles.expirePromotionButton,
                          wygaszanaPromocjaId === promocja.id &&
                            styles.buttonDisabled,
                        ]}
                        onPress={() => setPromocjaDoWygaszenia(promocja)}
                      >
                        <MaterialIcons
                          name="event-busy"
                          size={18}
                          color="#B45309"
                        />
                        <Text
                          style={[
                            styles.togglePromotionButtonText,
                            styles.expirePromotionButtonText,
                          ]}
                        >
                          Wygaś
                        </Text>
                      </Pressable>
                    )}

                  <Pressable
                    disabled={changingId === promocja.id}
                    style={[
                      styles.togglePromotionButton,
                      promocja.aktywna
                        ? styles.disablePromotionButton
                        : styles.enablePromotionButton,
                      changingId === promocja.id && styles.buttonDisabled,
                    ]}
                    onPress={() => void zmienAktywnosc(promocja)}
                  >
                    {changingId === promocja.id ? (
                      <ActivityIndicator
                        size="small"
                        color={promocja.aktywna ? "#B91C1C" : "#047857"}
                      />
                    ) : (
                      <MaterialIcons
                        name={promocja.aktywna ? "pause-circle" : "play-circle"}
                        size={19}
                        color={promocja.aktywna ? "#B91C1C" : "#047857"}
                      />
                    )}
                    <Text
                      style={[
                        styles.togglePromotionButtonText,
                        promocja.aktywna
                          ? styles.disablePromotionButtonText
                          : styles.enablePromotionButtonText,
                      ]}
                    >
                      {promocja.aktywna ? "Wyłącz" : "Włącz"}
                    </Text>
                  </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <Modal
          transparent
          animationType="fade"
          visible={promocjaDoWygaszenia !== null}
          onRequestClose={() => {
            if (wygaszanaPromocjaId === null) {
              setPromocjaDoWygaszenia(null);
            }
          }}
        >
          <View style={styles.expireModalOverlay}>
            <View
              accessibilityRole="alert"
              accessibilityLabel="Potwierdzenie wygaszenia promocji"
              style={styles.expireModalCard}
            >
              <View style={styles.expireModalIcon}>
                <MaterialIcons name="event-busy" size={27} color="#B45309" />
              </View>
              <Text style={styles.expireModalTitle}>
                Wygasić promocję?
              </Text>
              <Text style={styles.expireModalDescription}>
                Promocja{" "}
                <Text style={styles.expireModalPromotionName}>
                  {promocjaDoWygaszenia?.nazwa}
                </Text>{" "}
                zakończy się natychmiast. Aby uruchomić ją ponownie, ustaw nową
                datę zakończenia w edycji.
              </Text>

              <View
                style={[
                  styles.expireModalActions,
                  mobile && styles.expireModalActionsMobile,
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  disabled={wygaszanaPromocjaId !== null}
                  style={[
                    styles.expireModalButton,
                    styles.expireModalCancelButton,
                    mobile && styles.expireModalButtonMobile,
                    wygaszanaPromocjaId !== null && styles.buttonDisabled,
                  ]}
                  onPress={() => setPromocjaDoWygaszenia(null)}
                >
                  <Text style={styles.expireModalCancelButtonText}>Anuluj</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={wygaszanaPromocjaId !== null}
                  style={[
                    styles.expireModalButton,
                    styles.expireModalConfirmButton,
                    mobile && styles.expireModalButtonMobile,
                    wygaszanaPromocjaId !== null && styles.buttonDisabled,
                  ]}
                  onPress={() => void wygasPromocjeTeraz()}
                >
                  {wygaszanaPromocjaId !== null ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="event-busy" size={18} color="#FFFFFF" />
                      <Text style={styles.expireModalConfirmButtonText}>Wygaś</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {!loading && total > 0 && (
          <View style={[styles.pagination, mobile && styles.paginationMobile]}>
            <Pressable
              disabled={strona <= 1}
              style={[
                styles.paginationButton,
                strona <= 1 && styles.paginationButtonDisabled,
              ]}
              onPress={() => setStrona((value) => Math.max(1, value - 1))}
            >
              <MaterialIcons name="chevron-left" size={21} color="#1D4ED8" />
              <Text style={styles.paginationButtonText}>Poprzednia</Text>
            </Pressable>

            <Text style={styles.paginationText}>
              Strona {strona} z {liczbaStron}
            </Text>

            <Pressable
              disabled={strona >= liczbaStron}
              style={[
                styles.paginationButton,
                strona >= liczbaStron && styles.paginationButtonDisabled,
              ]}
              onPress={() =>
                setStrona((value) => Math.min(liczbaStron, value + 1))
              }
            >
              <Text style={styles.paginationButtonText}>Następna</Text>
              <MaterialIcons name="chevron-right" size={21} color="#1D4ED8" />
            </Pressable>
          </View>
        )}
      </View>
    </PageLayout>
  );
}
