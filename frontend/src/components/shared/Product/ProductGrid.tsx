import type { StyleProp, ViewStyle } from "react-native";
import { FlatList } from "react-native";

import type { ApiItem } from "@features/products";

import ProductCard, {
  type ProductCardItem,
} from "./ProductCard";

type ProductGridProps = {
  ulubioneIds : number[]
  data: ApiItem[];
  mapItem: (item: ApiItem) => ProductCardItem;
  numColumns?: number;
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
  numColumns = 4,
  onFavouriteChange,
  columnWrapperStyle,
  contentContainerStyle,
  scrollEnabled,
  showAdminActions = false,
  usuwalneProduktyIds = [],
  onDeleteProduct,
}: ProductGridProps) {
  return (
    <FlatList
      key={`product-grid-${numColumns}`}
      data={data}
      keyExtractor={(item) => item.id.toString()}
      numColumns={numColumns}
      scrollEnabled={scrollEnabled}
      columnWrapperStyle={columnWrapperStyle}
      contentContainerStyle={contentContainerStyle}
      renderItem={({ item }) => (
        <ProductCard
          item={mapItem(item)}
          initialCzyPolubione={ulubioneIds.includes(item.id)}
          onFavouriteChange={onFavouriteChange}
          showAdminActions={showAdminActions}
          moznaUsunac={usuwalneProduktyIds.includes(item.id)}
          onDelete={() => onDeleteProduct?.(item)}
        />
      )}
    />
  );
}
