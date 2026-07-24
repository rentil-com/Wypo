import { MaterialIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import {
  Pressable,
  Text,
  View,
} from "react-native";

import { styles } from "./Breadcrumbs.styles";

type BreadcrumbItem = {
  label: string;
  href?: Href;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumbs({
  items,
}: BreadcrumbsProps) {
  return (
    <View style={styles.container}>
      {/* STRONA GŁÓWNA */}
      <Pressable
        style={styles.item}
        onPress={() => router.push("/(tabs)/user")}
      >
        <MaterialIcons
          name="home"
          size={20}
          color="#176BDE"
        />
      </Pressable>

      {/* KOLEJNE ELEMENTY ŚCIEŻKI */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <View
            key={`${item.label}-${index}`}
            style={styles.itemGroup}
          >
            <MaterialIcons
              name="chevron-right"
              size={18}
              color="#176BDE"
            />

            <Pressable
              style={styles.item}
              disabled={!item.href}
              onPress={() => {
                const href = item.href;

                if (href) {
                  router.push(href);
                }
              }}
            >
              <Text
                numberOfLines={1}
                style={
                  isLast
                    ? styles.lastText
                    : styles.text
                }
              >
                {item.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
