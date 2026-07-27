import type { StyleProp, ViewStyle } from "react-native";
import { FlatList, View } from "react-native";

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
  const renderProductCard = (item: ApiItem) => (
    <ProductCard
      item={mapItem(item)}
      initialCzyPolubione={ulubioneIds.includes(item.id)}
      onFavouriteChange={onFavouriteChange}
      showAdminActions={showAdminActions}
      moznaUsunac={usuwalneProduktyIds.includes(item.id)}
      onDelete={() => onDeleteProduct?.(item)}
    />
  );

  if (scrollEnabled === false) {
    const rows = Array.from(
      { length: Math.ceil(data.length / numColumns) },
      (_, rowIndex) =>
        data.slice(rowIndex * numColumns, (rowIndex + 1) * numColumns),
    );

    return (
      <View style={contentContainerStyle}>
        {rows.map((row, rowIndex) => (
          <View
            key={`product-row-${rowIndex}`}
            style={[{ flexDirection: "row" }, columnWrapperStyle]}
          >
            {row.map((item) => (
              <View key={item.id} style={{ flex: 1, minWidth: 0 }}>
                {renderProductCard(item)}
              </View>
            ))}
            {Array.from({ length: numColumns - row.length }, (_, index) => (
              <View
                key={`product-placeholder-${rowIndex}-${index}`}
                style={{ flex: 1 }}
              />
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <FlatList
      key={`product-grid-${numColumns}`}
      data={data}
      keyExtractor={(item) => item.id.toString()}
      numColumns={numColumns}
      scrollEnabled={scrollEnabled}
      columnWrapperStyle={columnWrapperStyle}
      contentContainerStyle={contentContainerStyle}
      renderItem={({ item }) => renderProductCard(item)}
    />
  );
}
