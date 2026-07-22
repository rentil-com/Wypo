import type { StyleProp, ViewStyle } from "react-native";
import { FlatList } from "react-native";

import type { ApiItem } from "@/types/product";

import ProductCard, { type ProductCardItem } from "./ProductCard";

type ProductGridProps = {
  data: ApiItem[];
  mapItem: (item: ApiItem) => ProductCardItem;
  columnWrapperStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
};

export default function ProductGrid({
  data,
  mapItem,
  columnWrapperStyle,
  contentContainerStyle,
  scrollEnabled,
}: ProductGridProps) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      numColumns={4}
      scrollEnabled={scrollEnabled}
      columnWrapperStyle={columnWrapperStyle}
      contentContainerStyle={contentContainerStyle}
      renderItem={({ item }) => <ProductCard item={mapItem(item)} />}
    />
  );
}
