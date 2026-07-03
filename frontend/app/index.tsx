
import { router } from "expo-router";
import { useState } from "react";
import { Button, TextInput, View,StyleSheet,Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from "./components/themed-view";
import { ThemedText } from "./components/themed-text";
import { Link } from 'expo-router';
export default function LoginScreen() {
  const [login,setLogin] =  useState("")
  const [haslo,setHaslo] = useState("")
  const testLogin = "admin"
  const testHaslo = "admin"

  const sprawdzDane =()=> {
    console.log(login,haslo)
  }


  const sprawdzHaslo =()=> {
    if(login === testLogin && haslo === testHaslo){
      router.replace("/(tabs)/home")
    }
    if(login !== testLogin || haslo !== testHaslo){
      alert('Login lub haslo jest nieprawidlowe')
    }
    
  }


  return (
    <ThemedView >
   <SafeAreaProvider style={styles.container}>
    <SafeAreaView>
      <label>Login</label>
      <TextInput value={login} onChangeText={val => setLogin(val)}  style={styles.inputy}></TextInput>
      <label>Hasło</label>
      <TextInput secureTextEntry={true} value={haslo} onChangeText={val => setHaslo(val)} style={styles.inputy}></TextInput>
      <TextInput></TextInput>

      <Button
        title="Zaloguj"
        onPress={()=> sprawdzHaslo()}
      />
         <Link href="/rejestracja" dismissTo style={styles.link}>
        <ThemedText type="link">Nie masz konta?</ThemedText>
      </Link>
    </SafeAreaView>
   </SafeAreaProvider>
 
   {/*  <Button
        title="Zaloguj"
        onPress={() => router.replace("/home")}
      />
      */}
    </ThemedView>


  );
};

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

    
    


