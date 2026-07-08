import { Tabs, useLocalSearchParams } from "expo-router";
import { View ,Text, FlatList,Image, StyleSheet} from "react-native";
import { Stack } from 'expo-router';
import { ThemedText } from "@/components/themed-text";
import  dane from "../dane.json"

export default function TabsLayout() {
    const {id} = useLocalSearchParams();
    const selected_category = dane.filter((item)=> item.kategoria_id.toString() === id)
  return (
   

    <View>
      <FlatList data={dane} keyExtractor={(item)=>item.id.toString()}  numColumns={4} scrollEnabled={false} renderItem={({item})=> (

        <View>
            <ThemedText>{item.id}</ThemedText>
              <ThemedText>{item.nazwa}</ThemedText>
               <Image
                source={{ uri: item.zdjecie_url }}
                style={styles.productImage}
                resizeMode="contain"
              />
        </View>

      )}>

      </FlatList>
    </View>

  );
}

const styles = StyleSheet.create({
    productImage : {
    width: "100%",
    height: "100%",
    }
})