import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import PageLayout from '@components/shared/Layout/PageLayout';
import ProductGrid from '@components/shared/Product/ProductGrid';
import { pobierzUlubione } from '@features/favourites/fav.service';
import { pobierzPojedynczyProdukt, type ApiItem } from '@features/products';
import { useAuth } from '@/contexts/AuthContext';

export default function FavouritesScreen() {
  const { status } = useAuth();
  const [ulubioneIds, setUlubioneIds] = useState<number[]>([]);
  const [produkty, setProdukty] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (status !== "authenticated") {
      setUlubioneIds([]);
      setProdukty([]);
      setError(null);
      setLoading(status === "loading");
      return;
    }

    let active = true;

    setLoading(true);
    setError(null);

    async function load() {
      try {
        const ids = await pobierzUlubione();
        const items = await Promise.all(ids.map(pobierzPojedynczyProdukt));
        if (active) {
          setUlubioneIds(ids);
          setProdukty(items);
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Błąd pobierania');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [status]));

  function handleFavouriteChange(id: number, polubione: boolean) {
    if (polubione) return;
    setUlubioneIds((current) => current.filter((value) => value !== id));
    setProdukty((current) => current.filter((product) => product.id !== id));
  }

  if (status !== "loading" && status !== "authenticated") {
    return (
      <PageLayout wide>
        <View style={styles.authGate}>
          <View style={styles.authIcon}>
            <MaterialIcons name="lock-outline" size={30} color="#176BDE" />
          </View>
          <Text style={styles.authTitle}>Ulubione wymagają konta</Text>
          <Text style={styles.authDescription}>
            Zaloguj się, aby zapisywać produkty i zobaczyć swoją listę ulubionych.
          </Text>
          <Pressable
            style={styles.authButton}
            onPress={() => router.push({
              pathname: "/login",
              params: { reason: "Zaloguj się, aby zobaczyć ulubione produkty." },
            })}
          >
            <Text style={styles.authButtonText}>Przejdź do logowania</Text>
          </Pressable>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout wide>
      <View style={styles.content}>
        <Text style={styles.title}>Ulubione</Text>
        {loading && (
          <View style={styles.message}>
            <ActivityIndicator size={'large'} color={'#176BDE'} />
            <Text style={styles.messageText}>Ładowanie ulubionych...</Text>
          </View>
        )}
        {!loading && error && <Text style={styles.errorText}>{error}</Text>}
        {!loading && !error && produkty.length === 0 && (
          <Text style={styles.messageText}>Nie masz jeszcze ulubionych produktów.</Text>
        )}
        {!loading && !error && produkty.length > 0 && (
          <ProductGrid
            ulubioneIds={ulubioneIds}
            data={produkty}
            scrollEnabled={false}
            columnWrapperStyle={styles.productsRow}
            contentContainerStyle={styles.productsGrid}
            onFavouriteChange={handleFavouriteChange}
            mapItem={(item) => ({
              ...item,
              opis: item.opis ?? '',
              cena_po_promocji: item.czy_promocja ? item.cena_aktualna : null,
              zdjecie_url:
                item.zdjecia_url['1'] ??
                Object.values(item.zdjecia_url)[0] ??
                '',
            })}
          />
        )}
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  authGate: {
    width: "100%",
    maxWidth: 560,
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
    maxWidth: 420,
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
  content: {
    width: '100%',
    marginTop: 24,
  },
  title: {
    marginBottom: 24,
    color: '#111827',
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '900',
  },
  productsGrid: {
    gap: 16,
    paddingBottom: 24,
  },
  productsRow: {
    gap: 16,
  },
  message: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  messageText: {
    color: '#64748B',
    fontSize: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 16,
  },
});
