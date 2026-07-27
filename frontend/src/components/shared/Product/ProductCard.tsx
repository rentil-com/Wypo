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
import { useAuth } from "@/contexts/AuthContext";
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
  recenzje_srednia : string | null
};



type ProductCardProps = {
  item: ProductCardItem;
  initialCzyPolubione: boolean;
  onFavouriteChange?: (id: number, polubione: boolean) => void;
  showAdminActions?: boolean;
  moznaUsunac?: boolean;
  onDelete?: () => void;
};




export default function ProductCard({
  item,
  initialCzyPolubione,
  onFavouriteChange,
  showAdminActions = false,
  moznaUsunac = false,
  onDelete,
}: ProductCardProps) {
  const { status: authStatus } = useAuth();
  const status =
    statusStyles[
      item.status as StatusSprzetu
    ];
  const finalPrice = item.cena_po_promocji ?? item.cena;



    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [czyPolubione,setczyPolubione] = useState(initialCzyPolubione)

  useEffect(() => {
    setczyPolubione(initialCzyPolubione);
  }, [initialCzyPolubione]);
    const polub = async ()=> {
      if (authStatus !== "authenticated") {
        router.push({
          pathname: "/login",
          params: { reason: "Zaloguj się, aby dodawać produkty do ulubionych." },
        });
        return;
      }

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
          <Pressable
            style={[styles.adminActionButton, styles.editButton]}
            onPress={() =>
              router.push({
                pathname: "/products/[id]",
                params: { id: item.id.toString(), edit: "true" },
              })
            }
          >
            <MaterialIcons name="edit" size={17} color="#176BDE" />
          </Pressable>
          <Pressable style={[styles.adminActionButton, styles.deleteButton]} disabled={!moznaUsunac} onPress={onDelete}>
            <MaterialIcons name="delete-outline" size={18} color={moznaUsunac ? "#DC2626" : "#94A3B8"} />
          </Pressable>
        </View>
      )}

      {/* KLIKALNA CZĘŚĆ KARTY */}
      <Pressable
        style={styles.productLink}
        accessibilityRole="link"
        accessibilityLabel={`Zobacz produkt: ${item.nazwa}`}
        onPress={() =>
          router.push({
            pathname: "/products/[id]",
            params: { id: item.id.toString() },
          })
        }
      >
        {/* ZDJĘCIE PRODUKTU */}
        <View style={styles.productImageBox}>
          {item.zdjecie_url ? (
            <Image
              source={{ uri: item.zdjecie_url }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <MaterialIcons name="inventory-2" size={54} color="#94A3B8" />
          )}
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
            {finalPrice.toLocaleString("pl-PL", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} zł
          </Text>

          <View style={styles.ratingRow}>
            <MaterialIcons
              name="star"
              size={17}
              color="#F59E0B"
            />

            <Text style={styles.ratingText}>
              {item.recenzje_srednia ?? "Brak opinii"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
