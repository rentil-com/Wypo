import type { StyleProp, ViewStyle } from "react-native";
import { FlatList } from "react-native";
import { useEffect, useState } from "react";

import type { ApiItem } from "@features/products";
import { pobierzWszystkieRecenzjeProduktu } from "@features/reviews/reviews.services";

import ProductCard, {
  type ProductCardItem,
  type ProductRatingSummary,
} from "./ProductCard";

type ProductGridProps = {
  ulubioneIds : number[]
  data: ApiItem[];
  mapItem: (item: ApiItem) => ProductCardItem;
  onFavouriteChange?: (id: number, polubione: boolean) => void;
  columnWrapperStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
  showAdminActions?: boolean;
  usuwalneProduktyIds?: number[];
  onDeleteProduct?: (produkt: ApiItem) => void;
};

export default function ProductGrid({
  ulubioneIds,
  data,
  mapItem,
  onFavouriteChange,
  columnWrapperStyle,
  contentContainerStyle,
  scrollEnabled,
  showAdminActions = false,
  usuwalneProduktyIds = [],
  onDeleteProduct,
}: ProductGridProps) {
  const [ratingsByProduct, setRatingsByProduct] = useState<
    Record<number, ProductRatingSummary>
  >({});
  const [ratingsLoading, setRatingsLoading] = useState(false);

  useEffect(() => {
    async function zaladujOceny() {
      setRatingsLoading(true);

      try {
        const oceny: Record<number, ProductRatingSummary> = {};

        for (const item of data) {
          const response = await pobierzWszystkieRecenzjeProduktu(item.id);
          oceny[item.id] = {
            srednia_ocen: response.srednia_ocen,
            liczba_recenzji: response.liczba_recenzji,
          };
        }

        setRatingsByProduct(oceny);
      } catch {
        setRatingsByProduct({});
      } finally {
        setRatingsLoading(false);
      }
    }

    void zaladujOceny();
  }, [data]);

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      numColumns={4}
      scrollEnabled={scrollEnabled}
      columnWrapperStyle={columnWrapperStyle}
      contentContainerStyle={contentContainerStyle}
      renderItem={({ item }) => (
        <ProductCard
          item={mapItem(item)}
          initialCzyPolubione={ulubioneIds.includes(item.id)}
          rating={ratingsByProduct[item.id] ?? null}
          ratingLoading={ratingsLoading}
          onFavouriteChange={onFavouriteChange}
          showAdminActions={showAdminActions}
          moznaUsunac={usuwalneProduktyIds.includes(item.id)}
          onDelete={() => onDeleteProduct?.(item)}
        />
      )}
    />
  );
}
