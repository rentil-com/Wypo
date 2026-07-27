import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import PageLayout from "@components/shared/Layout/PageLayout";
import ProductCard from "@components/shared/Product/ProductCard";
import { pobierzUlubione } from "@features/favourites/fav.service";
import { pobierzPojedynczyProdukt, type ApiItem } from "@features/products";
import { pobierzMojeWypozyczenia } from "./loans.service";
import type { LoanResponse } from "./loans.types";

function formatujDate(data: string) {
  return new Date(data).toLocaleDateString("pl-PL");
}

export default function MyLoansScreen() {
  const [wypozyczenia,setWypozyczenia] = useState<LoanResponse[]>([]);
  const [produkty,setProdukty] = useState<ApiItem[]>([]);
  const [ulubioneIds,setUlubioneIds] = useState<number[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string | null>(null);

  useEffect(() => {
    async function zaladujWypozyczenia() {
      setError(null);
      setLoading(true);

      try {
        const response = await pobierzMojeWypozyczenia();
        const pobraneProdukty: ApiItem[] = [];

        for (const wypozyczenia of response.dane) {
          const produkt = await pobierzPojedynczyProdukt(wypozyczenia.sprzet_id);
          pobraneProdukty.push(produkt);
        }

        const ulubione = await pobierzUlubione();
        setWypozyczenia(response.dane);
        setProdukty(pobraneProdukty);
        setUlubioneIds(ulubione);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Nie udało się pobrać wypożyczeń");
      } finally {
        setLoading(false);
      }
    }

    void zaladujWypozyczenia();
  }, []);

  return (
    <PageLayout wide>
      <View style={styles.content}>
        <Text style={styles.title}>Moje wypozyczenia</Text>

        {loading && (
          <View style={styles.message}>
            <ActivityIndicator size="large" color="#176BDE" />
            <Text style={styles.messageText}>Ładowanie wypożyczeń...</Text>
          </View>
        )}

        {!loading && error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && wypozyczenia.length === 0 && (
          <Text style={styles.messageText}>Nie masz jeszcze żadnych wypożyczeń.</Text>
        )}

        {!loading && !error && wypozyczenia.map((wypozyczenie,index) => {
          const produkt = produkty[index];
          if (!produkt) return null;

          return (
            <View key={wypozyczenie.id} style={styles.reviewRow}>
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
                <Text style={styles.reviewTitle}>
                  Wypożyczenie #{wypozyczenie.id}
                </Text>
                <Text style={styles.rating}>
                  Status: {wypozyczenie.status}
                </Text>
                <Text style={styles.reviewText}>
                  Termin: {formatujDate(wypozyczenie.data_od)} –{" "}
                  {formatujDate(wypozyczenie.data_do)}
                </Text>
                <Text style={styles.reviewText}>
                  Cena: {wypozyczenie.cena_koncowa.toFixed(2)} zł
                </Text>
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
