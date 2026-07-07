
import { View ,Text,ScrollView,StyleSheet} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { TextInput } from "react-native";
import { Pressable } from "react-native";
export default function TabsLayout() {
    const [searchText,setsearchText] = useState("")
  return (
   

    <View style={screen}>
       <ScrollView
            style={styles.scroll}
         contentContainerStyle={styles.scrollContent}
         showsVerticalScrollIndicator={false} >
       
   
       <View style={styles.page}>
       <View style={styles.header}>
       <View style={styles.headerName}>
           <ThemedText style={styles.headerText}>Wypożyczalnia</ThemedText>
       </View>
   

    {/*WIDOK SEARCHBARU*/}
       <View style={styles.searchBar}>
           <MaterialIcons name="search" size={22} color="#8A96A8" />
             <TextInput
            value={searchText}
            onChangeText={(val) => setsearchText(val)}
            style={styles.searchText}
            placeholder="Wyszukaj produktów, marek i kategorii"
            placeholderTextColor="#9AA4B2"
          />
       </View>
        {/*KONTROLKI -> KATEGORIE, KONTAKT, DLA FIRM , JAK TO DZIALA */}

        <View style={styles.headerSideActions}>
          <Pressable style={styles.headerInfo} >
            <Text style={styles.headerInfoText}>Kategorie</Text>
          </Pressable>
       </View>


        
        <View style={styles.headerSideActions}>
          <Pressable style={styles.headerInfo} >
            <Text style={styles.headerInfoText}>Jak to działa?</Text>
          </Pressable>
       </View>

        <View style={styles.headerSideActions}>
          <Pressable style={styles.headerInfo} >
            <Text style={styles.headerInfoText}>Dla firm</Text>
          </Pressable>
       </View>

        <View style={styles.headerSideActions}>
          <Pressable style={styles.headerInfo} >
            <Text style={styles.headerInfoText}>Kontakt</Text>
          </Pressable>
       </View>



        {/*CONTROLS */}
        {/*Przenoszenie do odpowiednich widokow */}
        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} onPress={()=> router.replace("/(tabs)/wishlist")}>
            <MaterialIcons name="favorite-border" size={24} color="#111827"/>
            <Text style={styles.headerActionText}>Ulubione</Text>
          </Pressable>
       </View>

            <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} onPress={()=> router.replace("/(tabs)/basket")}>
            <MaterialIcons name="shopping-cart" size={24} color="#111827"/>
            <Text style={styles.headerActionText}>Koszyk</Text>
          </Pressable>
       </View>


          <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} onPress={()=> router.replace("/(tabs)/basket")}>
            <MaterialIcons name="person-outline" size={24} color="#111827"/>
            <Text style={styles.headerActionText}>Konto</Text>
          </Pressable>
       </View>
   
       </View>
    </View>
       </ScrollView>
       </View>
  );
}


const styles = StyleSheet.create({ 
    screen : {
        flex: 1,
        backgroundColor: "#F4F8FF",
        paddingTop: 24,     
    },
    page : {
        width: "100%",
        maxWidth: 1440,
        alignSelf: "center",
        paddingHorizontal: 32,
        paddingBottom: 40
    },
    header : { 
        width: "100%",
        minHeight: 72,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        paddingHorizontal: 24,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 24,

        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 4,
    },
    headerText : {
        fontSize: 24,
        fontWeight: "900",
        color: "#111827",
    },
    searchBar : {
        flex: 1,
        height: 48,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 999,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    }
})