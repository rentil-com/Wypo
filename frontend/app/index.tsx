
import { router } from "expo-router";
import { useState } from "react";
import { Button, TextInput, View,StyleSheet,Text,TouchableOpacity, Image } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Header } from "@react-navigation/elements";
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
    
   <SafeAreaProvider style={styles.container}>
    <SafeAreaView>
      <ThemedView style={styles.innerContainer} >
        <View style={styles.card}>
         <ThemedText type="title" style={styles.title} >Zaloguj sie</ThemedText>

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
   <ThemedText style={styles.labels}>Login</ThemedText>
      <TextInput value={login} onChangeText={val => setLogin(val)}   style={styles.inputs}></TextInput>
    <ThemedText style={styles.labels}>Hasło</ThemedText>
      <TextInput secureTextEntry={true} value={haslo} onChangeText={val => setHaslo(val)} style={styles.inputs}></TextInput>
   

      <TouchableOpacity style={styles.btnLogin} onPress={sprawdzHaslo}>
        <Text style={styles.btnLoginText}>ZALOGUJ SIE</Text>
    </TouchableOpacity>
      </View>
         <Link href="/rejestracja" dismissTo style={styles.link}> 
        <ThemedText>Nie masz konta? <ThemedText type="link">Zaloz konto</ThemedText> </ThemedText>
      </Link>
      </View>
      </ThemedView>
      
    </SafeAreaView>
   </SafeAreaProvider>
 



  );
};

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,          
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 40,
    paddingTop: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 35,
    elevation: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
    color: '#0f172a',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  socialButton: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  socialIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  form: {
    width: '100%',
  },
  labels: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputs: {
    width: '100%',
    height: 58,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    fontSize: 17,
    backgroundColor: '#fff',
  },
  btnLogin: {
    backgroundColor: '#3b82f6',
    height: 62,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  btnLoginText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    marginTop: 28,
    alignItems: 'center',
  },
});

    
    


