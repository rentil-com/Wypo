import { Tabs } from "expo-router";
import { View ,Text,Image, FlatList,StyleSheet} from "react-native";
import  {useState,useEffect} from "react"
import dane from  "../dane.json"

export default function User() {
  const [katalog,setKatalog] = useState(dane)
  const kategorieMap = new Map();
  kategorieMap.set("Komputery i monitory",1)
  kategorieMap.set("Smartfony i tablety",2)
  kategorieMap.set("Drukarki i skanery",3)
  kategorieMap.set("Audio i video",4)
  kategorieMap.set("Projektory i prezentacje",5)
  kategorieMap.set("Pamięci masowe",6)
  kategorieMap.set("Sieć i internet",7)
  kategorieMap.set("Akcesoria komputerowe",8)
  kategorieMap.set("Zasilanie i akcesoria",9)



  const path = "wypozyczalnia.calantris.com/"
  return (
    <View style={{ flex: 1, padding: 10 }}>
<FlatList
      data={dane}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Image
            source={{ uri: item.zdjecie_url }}
            style={styles.image}
            resizeMode="cover"
          />
          
          <View >
            <Text >{item.nazwa}</Text>
            <Text >{item.status}</Text>
            <Text numberOfLines={2}>{item.opis}</Text>
          </View>
        </View>
      )}
    />
    </View>
  );
  
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 250,
  },
});