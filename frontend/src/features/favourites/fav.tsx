import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import PageLayout from '@components/shared/Layout/PageLayout';
import ProductGrid from '@components/shared/Product/ProductGrid';
import { pobierzUlubione } from '@features/favourites/fav.service';
import { pobierzPojedynczyProdukt, type ApiItem } from '@features/products';

export default function FavouritesScreen() {
  const [ulubioneIds, setUlubioneIds] = useState<number[]>([]);
  const [produkty, setProdukty] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
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
  }, []));

  function handleFavouriteChange(id: number, polubione: boolean) {
    if (polubione) return;
    setUlubioneIds((current) => current.filter((value) => value !== id));
    setProdukty((current) => current.filter((product) => product.id !== id));
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
