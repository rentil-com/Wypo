import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { styles } from "./ProductCard.styles";
import { useState,useEffect } from "react";
import { polubPrzedmiot, usunPolubienie } from "@features/favourites/fav.service";
type StatusSprzetu =
  | "dostepny"
  | "niedostepny"
  | "wypozyczony"
  | "w_naprawie";

type StatusStyle = {
  label: string;
  backgroundColor: string;
  textColor: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const statusStyles: Record<
  StatusSprzetu,
  StatusStyle
> = {
  dostepny: {
    label: "Dostępny",
    backgroundColor: "#DCFCE7",
    textColor: "#166534",
    icon: "check-circle",
  },

  wypozyczony: {
    label: "Wypożyczony",
    backgroundColor: "#DBEAFE",
    textColor: "#1E40AF",
    icon: "hourglass-empty",
  },

  w_naprawie: {
    label: "W naprawie",
    backgroundColor: "#FEF3C7",
    textColor: "#92400E",
    icon: "build",
  },
  niedostepny: {
  label: "Niedostępny",
  backgroundColor: "#FEE2E2",
  textColor: "#991B1B",
  icon: "cancel",
},
};

export type ProductCardItem = {
  id: number;
  nazwa: string;
  opis: string;
  zdjecie_url: string;
  status: string;
  cena: number;
  cena_po_promocji: number | null;
};

export type ProductRatingSummary = {
  srednia_ocen: number;
  liczba_recenzji: number;
};

type ProductCardProps = {
  item: ProductCardItem;
  initialCzyPolubione: boolean;
  rating: ProductRatingSummary | null;
  ratingLoading?: boolean;
  onFavouriteChange?: (id: number, polubione: boolean) => void;
  showAdminActions?: boolean;
};




export default function ProductCard({
  item,
  initialCzyPolubione,
  rating,
  ratingLoading = false,
  onFavouriteChange,
  showAdminActions = false,
}: ProductCardProps) {
  const status =
    statusStyles[
      item.status as StatusSprzetu
    ];



    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [czyPolubione,setczyPolubione] = useState(initialCzyPolubione)

  useEffect(() => {
    setczyPolubione(initialCzyPolubione);
  }, [initialCzyPolubione]);
    const polub = async ()=> {
      setError(null)
      setLoading(true)

      try {
        if (czyPolubione) {
          const response = await usunPolubienie(item.id)
          setczyPolubione(response.polubione)
          onFavouriteChange?.(response.id, response.polubione)
        }
        else{
        const response =  await polubPrzedmiot(item.id)
        setczyPolubione(response.polubione)
        onFavouriteChange?.(response.id, response.polubione)
        }
      }
      catch(error){
        setError(error instanceof Error ? error.message : "Nieznany błąd")
      }
      finally{
        setLoading(false)
      }


    }

  return (
    <View style={styles.productCard}>
      {/* DODAJ DO ULUBIONYCH */}
      {!showAdminActions && (
        <Pressable
          style={styles.favoriteButton}
          onPress={() => polub()}
          disabled={loading}
          accessibilityHint={error ?? undefined}
        >
          {!czyPolubione && (
            <MaterialIcons
              name="favorite-border"
              size={23}
              color="#111827"
            />
          )}
          {czyPolubione && (
            <MaterialIcons name="favorite" size={23} color="#111827" />
          )}
        </Pressable>
      )}

      {showAdminActions && (
        <View style={styles.adminActions}>
          <Pressable style={[styles.adminActionButton, styles.editButton]}>
            <MaterialIcons name="edit" size={17} color="#176BDE" />
          </Pressable>
          <Pressable style={[styles.adminActionButton, styles.deleteButton]}>
            <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
          </Pressable>
        </View>
      )}

      {/* KLIKALNA CZĘŚĆ KARTY */}
      <Pressable
        style={styles.productLink}
        onPress={() =>
          router.push(`/products/${item.id}`)
        }
      >
        {/* ZDJĘCIE PRODUKTU */}
        <View style={styles.productImageBox}>
          <Image
            source={{
              uri: item.zdjecie_url,
            }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        {/* INFORMACJE O PRODUKCIE */}
        <View style={styles.productInfo}>
          <Text
            style={styles.productName}
            numberOfLines={1}
          >
            {item.nazwa}
          </Text>

          {/* STATUS PRODUKTU */}
          <View
            style={[
              styles.productStatusBadge,
              {
                backgroundColor:
                  status.backgroundColor,
              },
            ]}
          >
            <MaterialIcons
              name={status.icon}
              size={14}
              color={status.textColor}
            />

            <Text
              style={[
                styles.productStatusText,
                {
                  color: status.textColor,
                },
              ]}
            >
              {status.label}
            </Text>
          </View>

          {/* OPIS PRODUKTU */}
          <Text
            style={styles.productDescription}
            numberOfLines={2}
          >
            {item.opis}
          </Text>
        </View>
      </Pressable>

      {/* CENA I OCENA */}
      <View style={styles.productBottom}>
        <View>
          <Text style={styles.productPrice}>
            {/*dodac skreslona poprzednia cene */}
          {item.cena_po_promocji !=null ? item.cena_po_promocji + "zł" : item.cena + "zł"}
          </Text>

          <View style={styles.ratingRow}>
            <MaterialIcons
              name="star"
              size={17}
              color="#F59E0B"
            />

            <Text style={styles.ratingText}>
              {ratingLoading
                ? "..."
                : rating && rating.liczba_recenzji > 0
                  ? `${rating.srednia_ocen.toFixed(1)} (${rating.liczba_recenzji})`
                  : "Brak opinii"}
            </Text>
          </View>
        </View>

        {/* DODAJ DO KOSZYKA */}
        <Pressable style={styles.addButton}>
          <MaterialIcons
            name="add"
            size={24}
            color="#176BDE"
          />
        </Pressable>
      </View>
    </View>
  );
}
