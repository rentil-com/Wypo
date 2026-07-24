import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import PageLayout from "@components/shared/Layout/PageLayout";
import ProductCard from "@components/shared/Product/ProductCard";
import { pobierzUlubione } from "@features/favourites/fav.service";
import { pobierzPojedynczyProdukt, type ApiItem } from "@features/products";

import { pobierzMojeRecenzje } from "./reviews.services";
import type { ReviewResponse } from "./reviews.types";

export default function MyReviewsScreen() {
  const [recenzje,setRecenzje] = useState<ReviewResponse[]>([]);
  const [produkty,setProdukty] = useState<ApiItem[]>([]);
  const [ulubioneIds,setUlubioneIds] = useState<number[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string | null>(null);

  useEffect(() => {
    async function zaladujRecenzje() {
      setError(null);
      setLoading(true);

      try {
        const response = await pobierzMojeRecenzje();
        const pobraneProdukty: ApiItem[] = [];

        for (const recenzja of response.dane) {
          const produkt = await pobierzPojedynczyProdukt(recenzja.sprzet_id);
          pobraneProdukty.push(produkt);
        }

        const ulubione = await pobierzUlubione();
        setRecenzje(response.dane);
        setProdukty(pobraneProdukty);
        setUlubioneIds(ulubione);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Nie udało się pobrać recenzji");
      } finally {
        setLoading(false);
      }
    }

    void zaladujRecenzje();
  }, []);

  return (
    <PageLayout wide>
      <View style={styles.content}>
        <Text style={styles.title}>Moje recenzje</Text>

        {loading && (
          <View style={styles.message}>
            <ActivityIndicator size="large" color="#176BDE" />
            <Text style={styles.messageText}>Ładowanie recenzji...</Text>
          </View>
        )}

        {!loading && error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && recenzje.length === 0 && (
          <Text style={styles.messageText}>Nie masz jeszcze żadnych recenzji.</Text>
        )}

        {!loading && !error && recenzje.map((recenzja,index) => {
          const produkt = produkty[index];
          if (!produkt) return null;

          return (
            <View key={recenzja.id} style={styles.reviewRow}>
              <View style={styles.productWrapper}>
                <ProductCard
                  item={{
                    ...produkt,
                    opis: produkt.opis ?? "",
                    cena_po_promocji: produkt.czy_promocja ? produkt.cena_aktualna : null,
                    zdjecie_url: produkt.zdjecia_url["1"] ?? Object.values(produkt.zdjecia_url)[0] ?? "",
                  }}
                  initialCzyPolubione={ulubioneIds.includes(produkt.id)}
                />
              </View>

              <View style={styles.reviewCard}>
                <Text style={styles.reviewTitle}>Twoja recenzja</Text>
                <Text style={styles.rating}>★ {recenzja.gwiazdki}/5</Text>
                <Text style={styles.reviewText}>{recenzja.tresc ?? "Brak treści recenzji."}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    marginTop: 24,
    paddingBottom: 24,
  },
  title: {
    marginBottom: 24,
    color: "#111827",
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "900",
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
  reviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 20,
  },
  productWrapper: {
    width: 320,
    minHeight: 310,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  reviewCard: {
    flex: 1,
    minWidth: 260,
    minHeight: 180,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  reviewTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },
  rating: {
    color: "#F59E0B",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 14,
  },
  reviewText: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 23,
  },
});
