
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.loginPage}>
      {/* LEWA STRONA  */}
        <View style={styles.leftSide}>
          <View style={styles.heroImageWrapper}> 
           <Image
              source={require("../assets/logos/rentil_image.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />

            </View>
        </View>

      {/* PRAWA STRONA */}
      <ThemedView style={styles.innerContainer} >
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <Image
                  source={require("../assets/logos/rentil.png")}
                  style={styles.cardLogo}
                  resizeMode="contain"
                />

      </View>

         <ThemedText type="title" style={styles.title} >Zaloguj sie</ThemedText>

     <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialButtonWrapper}> 
                    <Image source={require('../assets/icons/facebook-icon.png')} style={styles.socialButton}>

                    </Image>
                        </TouchableOpacity>


                         <TouchableOpacity style={styles.socialButtonWrapper}> 
                    <Image source={require('../assets/icons/apple-icon.png')} style={styles.socialButton}>

                    </Image>
                        </TouchableOpacity >


                         <TouchableOpacity style={styles.socialButtonWrapper}> 
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
       </View>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 56,
    paddingVertical: 40,
    backgroundColor: "#F8FBFF",
  },
  card: {
     width: "100%",
    maxWidth: 520,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingHorizontal: 52,
    paddingVertical: 50,

    shadowColor: "#0F172A",
    shadowOffset: {
    width: 0,
    height: 24,
  },
  shadowOpacity: 0.09,
    shadowRadius: 40,
    elevation: 20,
},
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'left',
    marginBottom: 28,
    color: '#0f172a',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 34,
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
  loginPage: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F4F8FF",
  },

  leftSide: {
    flex: 1.15,
    backgroundColor: "#EEF6FF",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    minHeight: 760,
    objectFit: "contain" as any,
    objectPosition: "center center" as any,
  },
   cardTop: {
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  marginBottom: 34,
},

  cardLogo: {
   width: 180,
  height: 90,
  },
  socialButtonWrapper: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDE5F0",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
   safeArea: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },
  heroImageWrapper: {
  width: "100%",
  height: "92%",
  justifyContent: "center",
  alignItems: "center",
},
});

    
    


