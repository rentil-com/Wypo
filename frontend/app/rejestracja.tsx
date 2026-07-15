import { Tabs } from "expo-router";
import { router } from "expo-router";
import { useState } from "react";
import { Button, TextInput, View,StyleSheet,Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from "./components/themed-view";
import { ThemedText } from "./components/themed-text";
import { Header } from "@react-navigation/elements";

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
            router.replace("/(tabs)/user")
        }

       
    }
  return (
 
     <SafeAreaProvider style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
            <ThemedView style={styles.innerContainer}> 
                <ThemedText type="title" style={styles.title} > Utwórz konto</ThemedText>
        
            <View style={styles.socialContainer}>
                    <TouchableOpacity> 
                    <Image source={require('../assets/icons/facebook-icon.png')} style={styles.socialButton}>

                    </Image>
                        </TouchableOpacity>


                         <TouchableOpacity> 
                    <Image source={require('../assets/icons/apple-icon.png')} style={styles.socialButton}>

                    </Image>
                        </TouchableOpacity>


                         <TouchableOpacity> 
                    <Image source={require('../assets/icons/google-icon.png')} style={styles.socialButton}>

                    </Image>
                        </TouchableOpacity>
            </View>
        
                <View style={styles.form}>
          <label style={styles.labels}>Imie</label>
          <TextInput value={imie} onChangeText={val => setImie(val)}  style={styles.inputs}></TextInput>


          <label style={styles.labels}>Nazwisko</label>
          <TextInput value={nazwisko} onChangeText={val => setNazwisko(val)} style={styles.inputs}></TextInput>

          <label style={styles.labels}>Adres e-mail</label>
          <TextInput value={adres} onChangeText={val=> setAdres(val)} style={styles.inputs}></TextInput>
    
        <label style={styles.labels}>Hasło</label>
             <TextInput secureTextEntry={true} value={haslo} onChangeText={val=> setHaslo(val)} style={styles.inputs} ></TextInput>


       <TouchableOpacity style={styles.createButton} onPress={zakladanieKonta}>
    <Text style={styles.createButtonText}>ZAŁÓŻ KONTO</Text>
</TouchableOpacity>
        </View>
        </ThemedView>
        </SafeAreaView>
       </SafeAreaProvider>

  );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    safeArea: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginTop : 40,
        marginBottom: 40,
        textAlign: 'center',
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center'
    },
    labels: {
        fontSize: 15.5,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 9,
        marginLeft: 2,
        fontFamily : 'Arial'
    },
    inputs: {
        width: '100%',
        height: 54,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 20,
        fontSize: 16,
        backgroundColor: '#fff',
    },

    createButton: {
        backgroundColor: '#2563eb',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    createButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '600',
    },
    socialButton: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
},
socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
},

});