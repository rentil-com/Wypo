import { Tabs } from "expo-router";
import { router } from "expo-router";
import { useState } from "react";
import { Button, TextInput, View,StyleSheet,Text, TouchableOpacity, Image, Pressable } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from "./components/themed-view";
import { ThemedText } from "./components/themed-text";
import { Header } from "@react-navigation/elements";
import { useLocalSearchParams, useSearchParams } from "expo-router/build/hooks";
import { registerConfirm } from "./services/auth.service";


export default function Rejestracja() {
    const [kod,setKod] = useState("")
    const {email} = useLocalSearchParams<{email: string}>()
      const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sprawdzKod = async ()=>{
        if(loading){
            return
        }
        setError(null)
        setLoading(true)
        try {
            await registerConfirm(email,kod)
            alert("Udalo sie utworzyc konto")
            router.replace("/")
        }
        catch(error) {
            setError(error instanceof Error ? error.message : "Nieznany blad")
        }
        finally{
            setLoading(false)
        }
    }
  return (
 
     <SafeAreaProvider style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
            <ThemedView style={styles.innerContainer}> 
                <ThemedText type="title" style={styles.title} ></ThemedText>
                <TextInput value={email ?? ""} editable={false} />
                <TextInput value={kod} onChangeText={(val)=> setKod(val)} />
                <Pressable onPress={()=> sprawdzKod()}>
                    <ThemedText>Wyslij kod</ThemedText>
                </Pressable>
         
        
   
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
})

