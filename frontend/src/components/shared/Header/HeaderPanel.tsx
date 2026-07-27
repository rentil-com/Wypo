import { MaterialIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { pobierzKategorie, type CategoryApiItem } from "@features/categories";
import { szukajProdukty, type ItemsSearchResult } from "@features/products";

import { styles } from "./HeaderPanel.styles";
import { responsiveStyles } from "./HeaderPanel.responsive.styles";

type ProtectedRoute = "/(tabs)/account" | "/(tabs)/wishlist";

export default function HeaderPanel() {
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const { signOut, status, user } = useAuth();
  const isAuthenticated = status === "authenticated";

  const [searchText, setSearchText] = useState("");
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [kategorie, setKategorie] = useState<CategoryApiItem[]>([]);
  const [suggestions, setSuggestions] = useState<ItemsSearchResult[]>([]);

  useEffect(() => {
    const query = searchText.trim();

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await szukajProdukty({ q: query });
        setSuggestions(response);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchText]);

  useEffect(() => {
    let cancelled = false;

    async function zaladujKategorie() {
      try {
        const response = await pobierzKategorie();

        if (!cancelled) {
          setKategorie(response);
        }
      } catch {
        if (!cancelled) {
          setKategorie([]);
        }
      }
    }

    void zaladujKategorie();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchSubmit = () => {
    const query = searchText.trim();

    if (!query) {
      return;
    }

    setSuggestions([]);
    router.push({
      pathname: "/catalog" as never,
      params: { search: query },
    });
  };

  const pokazLogowanie = (reason: string) => {
    router.push({
      pathname: "/login",
      params: { reason },
    });
  };

  const przejdzDoChronionejStrefy = (
    destination: ProtectedRoute,
    reason: string,
  ) => {
    if (isAuthenticated) {
      router.push(destination);
      return;
    }

    pokazLogowanie(reason);
  };

  const wylogujSie = async () => {
    await signOut();
    router.replace("/login");
  };

  const szczegolyKonta = () => {
    przejdzDoChronionejStrefy(
      "/(tabs)/account",
      "Zaloguj się, aby przejść do swojego konta.",
    );
  };

  const przejdzDoKatalogu = () => {
    setShowCategoryPanel(false);
    router.push("/catalog" as never);
  };

  const searchArea = (
    <View
      style={[
        responsiveStyles.searchArea,
        mobile
          ? responsiveStyles.searchAreaMobile
          : responsiveStyles.searchAreaDesktop,
      ]}
    >
      <View
        style={[
          styles.searchBar,
          mobile
            ? responsiveStyles.searchBarMobile
            : responsiveStyles.searchBarDesktop,
        ]}
      >
        <MaterialIcons name="search" size={22} color="#8A96A8" />
        <TextInput
          accessibilityLabel="Wyszukaj produkty"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchText}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
          placeholder="Wyszukaj produkty, marki i kategorie"
          placeholderTextColor="#9AA4B2"
        />
      </View>

      {suggestions.length > 0 && searchText.trim().length > 0 && (
        <View
          style={[
            styles.suggestionsPanel,
            mobile && responsiveStyles.suggestionsPanelMobile,
          ]}
        >
          {suggestions.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setSuggestions([]);
                router.push(`/products/${item.id}`);
              }}
              style={styles.suggestionItem}
            >
              {item.zdjecie_url ? (
                <Image
                  source={{ uri: item.zdjecie_url }}
                  style={styles.suggestionImage}
                />
              ) : null}
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName} numberOfLines={1}>
                  {item.nazwa_przedmiotu}
                </Text>
                <Text style={styles.suggestionPrice}>{item.cena} zł</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  const logo = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Strona główna"
      onPress={() => router.push("/")}
    >
      <ExpoImage
        source="https://wypozyczalnia.calantris.com/logo.svg"
        contentFit="contain"
        accessibilityLabel="Rentil"
        style={[
          styles.logo,
          mobile && responsiveStyles.logoMobile,
        ]}
      />
    </Pressable>
  );

  if (mobile) {
    return (
      <View style={[styles.header, responsiveStyles.headerMobile]}>
        <View style={responsiveStyles.mobileTopRow}>
          {logo}

          <View
            style={[
              styles.headerActions,
              responsiveStyles.headerActionsMobile,
            ]}
          >
            {user?.rola === "admin" && (
              <Pressable
                accessibilityLabel="Dashboard"
                style={responsiveStyles.mobileHeaderAction}
                onPress={() => router.push("/(tabs)/dashboard")}
              >
                <MaterialIcons name="dashboard" size={22} color="#111827" />
              </Pressable>
            )}

            <Pressable
              accessibilityLabel="Ulubione"
              style={responsiveStyles.mobileHeaderAction}
              onPress={() =>
                przejdzDoChronionejStrefy(
                  "/(tabs)/wishlist",
                  "Zaloguj się, aby zobaczyć ulubione produkty.",
                )
              }
            >
              <MaterialIcons name="favorite-border" size={23} color="#111827" />
            </Pressable>

            <Pressable
              accessibilityLabel="Konto"
              style={responsiveStyles.mobileHeaderAction}
              onPress={szczegolyKonta}
            >
              <MaterialIcons name="person-outline" size={24} color="#111827" />
            </Pressable>

            <Pressable
              accessibilityLabel={isAuthenticated ? "Wyloguj się" : "Zaloguj się"}
              style={responsiveStyles.mobileHeaderAction}
              onPress={() =>
                isAuthenticated
                  ? void wylogujSie()
                  : pokazLogowanie("Zaloguj się, aby korzystać z funkcji konta.")
              }
            >
              <MaterialIcons
                name={isAuthenticated ? "logout" : "login"}
                size={24}
                color="#111827"
              />
            </Pressable>
          </View>
        </View>

        {searchArea}

        <View style={responsiveStyles.mobileNavigation}>
          <Pressable
            style={responsiveStyles.mobileNavigationItem}
            onPress={przejdzDoKatalogu}
          >
            <MaterialIcons name="grid-view" size={19} color="#176BDE" />
            <Text style={responsiveStyles.mobileNavigationText}>Kategorie</Text>
          </Pressable>

          <Pressable
            style={responsiveStyles.mobileNavigationItem}
            onPress={() => router.push("/(tabs)/howItWorks")}
          >
            <MaterialIcons name="help-outline" size={20} color="#176BDE" />
            <Text style={responsiveStyles.mobileNavigationText}>Jak to działa?</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      {logo}
      {searchArea}

      <View style={styles.categoryContainer}>
        <View
          style={styles.categoryWrapper}
          onPointerEnter={() => setShowCategoryPanel(true)}
          onPointerLeave={() => setShowCategoryPanel(false)}
        >
          <Pressable
            style={styles.headerInfo}
            onPress={() => setShowCategoryPanel((current) => !current)}
          >
            <Text style={styles.headerInfoText}>Kategorie</Text>
          </Pressable>

          {showCategoryPanel && (
            <View style={styles.categoryPanelPositioner}>
              <View style={styles.categoryPanel}>
                <View style={styles.categoryGrid}>
                  <Pressable
                    style={[
                      styles.panelCategoryItem,
                      styles.panelCategoryItemActive,
                    ]}
                    onPress={przejdzDoKatalogu}
                  >
                    <View
                      style={[
                        styles.panelCategoryIcon,
                        styles.panelCategoryIconActive,
                      ]}
                    >
                      <MaterialIcons name="grid-view" size={25} color="#176BDE" />
                    </View>
                    <View style={styles.categoryTextContainer}>
                      <Text
                        style={[
                          styles.panelCategoryName,
                          styles.panelCategoryNameActive,
                        ]}
                      >
                        Wszystkie kategorie
                      </Text>
                      <Text style={styles.categoryDescription}>
                        Zobacz wszystkie produkty
                      </Text>
                    </View>
                  </Pressable>

                  {kategorie.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.panelCategoryItem}
                      onPress={() => {
                        setShowCategoryPanel(false);
                        router.push(`/catalog/category/${item.id}`);
                      }}
                    >
                      <View style={styles.panelCategoryIcon}>
                        <Image
                          source={{ uri: item.zdjecie_url }}
                          resizeMode="contain"
                          style={styles.panelCategoryImage}
                        />
                      </View>
                      <View style={styles.categoryTextContainer}>
                        <Text style={styles.panelCategoryName}>{item.nazwa}</Text>
                        <Text style={styles.categoryDescription}>
                          Sprzęt dostępny na wynajem
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.headerSideActions}>
        <Pressable
          style={styles.headerInfo}
          onPress={() => router.push("/(tabs)/howItWorks")}
        >
          <Text style={styles.headerInfoText}>Jak to działa?</Text>
        </Pressable>
      </View>

      <View style={styles.headerActions}>
        {user?.rola === "admin" && (
          <Pressable
            style={styles.headerAction}
            onPress={() => router.push("/(tabs)/dashboard")}
          >
            <MaterialIcons name="dashboard" size={24} color="#111827" />
            <Text style={styles.headerActionText}>Dashboard</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.headerAction}
          onPress={() =>
            przejdzDoChronionejStrefy(
              "/(tabs)/wishlist",
              "Zaloguj się, aby zobaczyć ulubione produkty.",
            )
          }
        >
          <MaterialIcons name="favorite-border" size={24} color="#111827" />
          <Text style={styles.headerActionText}>Ulubione</Text>
        </Pressable>

        <Pressable style={styles.headerAction} onPress={szczegolyKonta}>
          <MaterialIcons name="person-outline" size={25} color="#111827" />
          <Text style={styles.headerActionText}>Konto</Text>
        </Pressable>

        <Pressable
          style={styles.headerAction}
          onPress={() =>
            isAuthenticated
              ? void wylogujSie()
              : pokazLogowanie("Zaloguj się, aby korzystać z funkcji konta.")
          }
        >
          <MaterialIcons
            name={isAuthenticated ? "logout" : "login"}
            size={25}
            color="#111827"
          />
          <Text style={styles.headerActionText}>
            {isAuthenticated ? "Wyloguj się" : "Zaloguj się"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
