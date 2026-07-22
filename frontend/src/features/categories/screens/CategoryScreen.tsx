import { useLocalSearchParams } from "expo-router";
import CatalogView from "./CatalogScreen";

export default function CategoryPage() {
  const { kategoria_id, promocja } = useLocalSearchParams<{kategoria_id : string, promocja : string}>();

;

  return <CatalogView kategoriaId={kategoria_id}  promocja={promocja==="true"}/>;
}
