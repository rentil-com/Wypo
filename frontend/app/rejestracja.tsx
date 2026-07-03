import { Tabs } from "expo-router";
import { router } from "expo-router";
import { useState } from "react";
import { Button, TextInput, View,StyleSheet,Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from "./components/themed-view";
import { ThemedText } from "./components/themed-text";

export default function Rejestracja() {
    const [imie,setImie] =  useState('')
    const [nazwisko,setNazwisko] = useState('')
    const [adres,setAdres] = useState('')
    const [haslo,setHaslo] = useState('')


    const walidacja_adresu_email =()=>{
         const adres_dowalidacji = adres.trim().toLowerCase()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   
        if(adres !=""){

        if(!emailRegex.test(adres)){
                alert( 'Podaj poprawny adres email');
                return false
        }
        return true;
    }

    else {
 alert('Email jest wymagany')
 return false;
    }

    }


    const walidacja_hasla =()=> {
    
        const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

    if(haslo.length < 8){
            alert("Haslo powinno zawierac conajmniej 8 znakow")
            return false
        }
    else{
       if(!passwordRegex.test(haslo)){
        return false;
        alert("Haslo jest niepoprawne")
        
       }
       else {
        return true;
       }
    }
        return true
    }

    const zakladanieKonta =()=> {
        if(walidacja_adresu_email() === true && walidacja_hasla() === true){
            alert('Pomyslnie zalozenie konta')
        }

       
    }
  return (
  <ThemedText>
     <SafeAreaProvider style={styles.container}>
        <SafeAreaView>
          <label>Imie</label>
          <TextInput value={imie} onChangeText={val => setImie(val)} ></TextInput>


          <label>Nazwisko</label>
          <TextInput value={nazwisko} onChangeText={val => setNazwisko(val)}></TextInput>

          <label>Adres e-mail</label>
          <TextInput value={adres} onChangeText={val=> setAdres(val)}></TextInput>
    
        <label>Hasło</label>
             <TextInput secureTextEntry={true} value={haslo} onChangeText={val=> setHaslo(val)} ></TextInput>


        <Button title="Zaloz konto" onPress={()=> zakladanieKonta()}></Button>
        </SafeAreaView>
       </SafeAreaProvider>
  </ThemedText>
  );
}


const styles = StyleSheet.create({inputy : {
      height : 40,
      margin: 12,
    borderWidth: 1,
    borderColor : '#000',
    padding: 10,
    
    },


    container : {
       flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    },

    link : {
       marginTop: 15,
    paddingVertical: 15,
    }
  })