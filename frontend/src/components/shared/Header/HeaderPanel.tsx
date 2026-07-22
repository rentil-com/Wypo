import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {  Image, Pressable, Text, TextInput, View } from "react-native";
import dane from "@/dane.json"
import { kategorieMap } from "@/constants/categories";
import {styles} from "./HeaderPanel.styles"
import { CategoryApiItem } from "@/types/categories";
import { pobierzKategorie } from "@/services/categories.service";
import { pobierzProdukty, szukajProdukty } from "@/services/products.service";
import { ApiItem, ItemsSearchResult } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUser } from "@features/account";
export default function HeaderPanel () { 
 
    const {signOut, status, error : authError} = useAuth()
  const [produkty,setProdukty] = useState<ApiItem[]>([])
  const [searchText,setsearchText] = useState("")
  const [showcategoryPanel,setshowcategoryPanel] = useState(false)
  const [kategorie,setKategorie] = useState<CategoryApiItem[]>([])
  const [suggestions,setSuggestions] = useState<ItemsSearchResult[]>([])
  const [loading,setLoading] = useState(true)
  const [error,setEror] = useState<string | null>(null)


 
useEffect(() => {
  const query = searchText.trim();

  if (query.length < 2) {
    setSuggestions([]);
    return;
  }

  const timeout = setTimeout(async () => {
    try {
      const response = await szukajProdukty({
        q: query,
      });

      setSuggestions(response);
    } catch (error) {
      setSuggestions([]);

      setEror(
        error instanceof Error
          ? error.message
          : "Nieznany błąd"
      );
    }
  }, 300);

  return () => clearTimeout(timeout);
}, [searchText]);
    

  useEffect(()=>{
 async function zaladujKategorie(){
      try {
        const response = await pobierzKategorie()
        

        setKategorie(response)
      }
      catch(error){
        setEror(error instanceof Error ? error.message : "Nieznany bład")
      }
      finally {
        setLoading(false)
      }
  
  }


  void zaladujKategorie()
}
,[])



const handleSearchSubmit = () => {
  const query = searchText.trim();

  if (!query) {
    return;
  }

  setSuggestions([]);

  router.push({
    pathname: "/catalog/catalog",
    params: {
      search: query,
    },
  });
};


const wylogujSie = async ()=>{ 
  await signOut()
}
const szczegolyKonta = ()=> {
  router.push("/(tabs)/account")
}

useEffect(()=>{ 
  if(status === "anonymous"){
    router.push("/")
  }
},[status])



   return ( 
   <View style={styles.header}>
    <Pressable onPress={()=> router.push("/(tabs)/user")}>
        <View>
        
         <Image source={{uri : "https://wypozyczalnia.calantris.com/logo.svg"}} style={styles.logo} />
        </View>
 </Pressable>
        {/*SEARCH BAR */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color="#8A96A8" />

          <TextInput
            value={searchText}
            onChangeText={(val) => setsearchText(val)}
            style={styles.searchText}
            returnKeyType="search"
           onSubmitEditing={handleSearchSubmit}
            placeholder="Wyszukaj produktów, marek i kategorii"
            placeholderTextColor="#9AA4B2"
          />
        </View>
{suggestions.length > 0 && searchText.trim().length > 0 &&
        <View style={styles.suggestionsPanel}>
          {/*SUGGESTIONS PANEL */}
        {suggestions.map((item)=>(
          <Pressable key={item.id} onPress={()=> router.push(`/products/${item.id}`)} style={styles.suggestionItem}>
             {item.zdjecie_url && <Image source={{uri : item.zdjecie_url}} style={styles.suggestionImage} /> }
              <View style={styles.suggestionInfo}>
        <Text style={styles.suggestionName} numberOfLines={1}>
          {item.nazwa_przedmiotu}
        </Text>

        <Text style={styles.suggestionPrice}>
          {item.cena} zł
        </Text>
      </View>
          </Pressable>
        ))}
        </View>
}
        {/*KONTROLKI -> KATEGORIE, KONTAKT, DLA FIRM , JAK TO DZIALA */}
        <View style={styles.categoryContainer}>
          <View
    style={styles.categoryWrapper}
    onPointerEnter={() => setshowcategoryPanel(true)}
    onPointerLeave={() => setshowcategoryPanel(false)}
  > 
         <View style={styles.headerSideActions}>
          {/*onHoverIn, onHoverOut - działaja tylko na web , do mobliek dodac onPressIn, onPressOut */}
                <View style={styles.headerInfo}   >
                  <Text style={styles.headerInfoText}>Kategorie</Text>
                </View>
             </View>
      {/*ROZWIJANY PANEL KATEGORII, NARAZIE NIE WSZYSTKIE KATEGORIE */}
      {/*przeniesienie do odpowiedniego widoku kategorii, dodac ikonki do poszczegółnych kategorii */}
      {showcategoryPanel && <View style={styles.categoryPanelPositioner} >
        <View style={styles.categoryPanel}>
          <View style={styles.categoryGrid}> 
          <Pressable style={[styles.panelCategoryItem,styles.panelCategoryItemActive]} onPress={()=>router.push(`/catalog/catalog`)}> 
            <View style={[styles.panelCategoryIcon,styles.panelCategoryIconActive]}>
                <MaterialIcons name="grid-view"size={25} color="#176BDE" />
              </View>

              <View style={styles.categoryTextContainer}>
                <Text style={[styles.panelCategoryName,styles.panelCategoryNameActive]} >
                  Wszystkie kategorie
                </Text>
              <Text style={styles.categoryDescription}>
                      Zobacz wszystkie produkty
                    </Text>
                </View>
                </Pressable>

                {/*kategorie z mapy */}

        {kategorie.map((item)=>  
        <Pressable key={item.id} style={styles.panelCategoryItem} onPress={()=>router.push(`/catalog/category/${item.id}`)}>
          <View style={styles.panelCategoryIcon}> 
            {/*ikonki */}
           <Image source={{uri: item.zdjecie_url}} style={styles.panelCategoryImage} />
            </View>
            <View style={styles.categoryTextContainer}> 
          <Text style={styles.panelCategoryName} >{item.nazwa}</Text>

            <Text style={styles.categoryDescription}>
            Sprzęt dostępny na wynajem
          </Text>
          
          </View>
            </Pressable>
      
        ) }
        
        </View>
        </View> 
  </View>
        }
        
        </View>
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

          <Pressable style={styles.headerAction}  onPress={()=> router.replace("/(tabs)/basket")}>
            <MaterialIcons name="shopping-cart" size={24} color="#111827" />
            <Text style={styles.headerActionText}>Koszyk</Text>
          </Pressable>

          <Pressable style={styles.headerAction} onPress={()=> szczegolyKonta()}>
            <MaterialIcons name="person-outline" size={25} color="#111827" />
            <Text style={styles.headerActionText}>Konto</Text>
          </Pressable>

           <Pressable style={styles.headerAction} onPress={()=> wylogujSie()}>
           <MaterialIcons name="logout" size={25} color="black" />
            <Text style={styles.headerActionText}>Wyloguj sie</Text>
          </Pressable>

        </View>
      </View>

    )}
