
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

        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} >
            <Text style={styles.headerActionText}>Kategorie</Text>
          </Pressable>
       </View>


        
        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} >
            <Text style={styles.headerActionText}>Jak to działa?</Text>
          </Pressable>
       </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} >
            <Text style={styles.headerActionText}>Dla firm</Text>
          </Pressable>
       </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} >
            <Text style={styles.headerActionText}>Kontakt</Text>
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

    }
})