import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import {styles } from "./ProductCard.styles"

type StatusSprzetu =
  | "dostepny"
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
};

type ProductCardItem = {
  id: number;
  nazwa: string;
  opis: string;
  zdjecie_url: string;
  status: string;
};

type ProductCardProps = {
  item: ProductCardItem;
};

export default function ProductCard({
  item,
}: ProductCardProps) {
  const status =
    statusStyles[
      item.status as StatusSprzetu
    ];

  return (
    <View style={styles.productCard}>
      {/* DODAJ DO ULUBIONYCH */}
      <Pressable style={styles.favoriteButton}>
        <MaterialIcons
          name="favorite-border"
          size={23}
          color="#111827"
        />
      </Pressable>

      {/* KLIKALNA CZĘŚĆ KARTY */}
      <Pressable
        style={styles.productLink}
        onPress={() =>
          router.push(`../products/${item.id}`)
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
            99,99 zł
          </Text>

          <View style={styles.ratingRow}>
            <MaterialIcons
              name="star"
              size={17}
              color="#F59E0B"
            />

            <Text style={styles.ratingText}>
              4.8
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