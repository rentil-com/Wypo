import { router } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from "expo-router/build/hooks";
import { startEmailChange } from "@/services/auth.service";


export default function Zmiana_Maila() {
    const { width } = useWindowDimensions();
    const {email} = useLocalSearchParams<{email: string}>()
    const [nowyEMail,setNowyEmail] = useState("")
    const [haslo,setHaslo] = useState("")
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

 
    const isMobile = width < 640;


    const wyslijKod = async ()=> {
        setError("")
        const poprawnyEmail = nowyEMail.trim()

        if(!poprawnyEmail || !haslo){
            setError("Email  oraz haslo nie moze byc puste")
            return;
        }
        setLoading(true)
        try {
           const response = await startEmailChange(poprawnyEmail,haslo)
           setHaslo("")
           router.push({pathname: "/(tabs)/account_kod", params : {
            challenge : response.challenge,
            email : poprawnyEmail
           }})
        }
        catch(error){
            setError(error instanceof Error ? error.message : "Nieznany blad")
        }
        finally {
            setLoading(false)
        }
    }
    return (
        <SafeAreaProvider style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={[
                            styles.content,
                            isMobile && styles.mobileContent,
                        ]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        automaticallyAdjustKeyboardInsets
                    >
                            <Text>Stary email {email}</Text>
                          


                           <Text>Nowy email</Text>
                           <TextInput value={nowyEMail} onChangeText={val => setNowyEmail(val)} />


                            <Text>Hasło</Text>
                            <TextInput secureTextEntry={true} value={haslo} onChangeText={val => setHaslo(val)} />
                     

                                    <Text style={styles.sendButtonText} onPress={()=> wyslijKod()} disabled={loading}>
                                        WYŚLIJ KOD
                                    </Text>
                             
                       
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F8FF",
    },
    safeArea: {
        flex: 1,
        backgroundColor: "#F4F8FF",
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        backgroundColor: "#F4F8FF",
    },
    content: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        paddingVertical: 40,
    },
    mobileContent: {
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    card: {
        width: "100%",
        maxWidth: 720,
        minHeight: 470,
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 34,
        paddingHorizontal: 72,
        paddingVertical: 58,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.1,
        shadowRadius: 40,
        elevation: 20,
    },
    mobileCard: {
        minHeight: 0,
        borderRadius: 24,
        paddingHorizontal: 22,
        paddingVertical: 34,
    },
    heading: {
        width: "100%",
        alignItems: "center",
        marginBottom: 30,
    },
    title: {
        fontSize: 36,
        lineHeight: 43,
        fontWeight: "900",
        color: "#071536",
        textAlign: "center",
        letterSpacing: -0.6,
        marginBottom: 12,
    },
    mobileTitle: {
        fontSize: 27,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 23,
        color: "#7B88A4",
        fontWeight: "500",
        textAlign: "center",
        marginBottom: 10,
    },
    emailWrapper: {
        maxWidth: "100%",
        borderRadius: 12,
        backgroundColor: "#EEF6FF",
        paddingHorizontal: 16,
        paddingVertical: 9,
    },
    emailText: {
        fontSize: 15,
        lineHeight: 21,
        color: "#2563EB",
        fontWeight: "700",
        textAlign: "center",
    },
    errorMessageWrapper: {
        width: "100%",
        minHeight: 52,
        justifyContent: "center",
        backgroundColor: "#FEF2F2",
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#FECACA",
        paddingHorizontal: 16,
        paddingVertical: 11,
        marginBottom: 20,
        shadowColor: "#DC2626",
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
        elevation: 3,
    },
    errorMessagesText: {
        color: "#991B1B",
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        textAlign: "center",
    },
    form: {
        width: "100%",
        maxWidth: 520,
        alignSelf: "center",
    },
    label: {
        fontSize: 15,
        lineHeight: 21,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 8,
        marginLeft: 2,
    },
    input: {
        width: "100%",
        height: 62,
        borderWidth: 1,
        borderColor: "#DDE5F0",
        borderRadius: 16,
        paddingHorizontal: 20,
        backgroundColor: "#FFFFFF",
        color: "#0F172A",
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        letterSpacing: 3,
        outlineStyle: "none" as any,
    },
    sendButton: {
        width: "100%",
        height: 62,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#2563EB",
        marginTop: 20,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 9 },
        shadowOpacity: 0.3,
        shadowRadius: 18,
        elevation: 11,
    },
    sendButtonText: {
        color: "#FFFFFF",
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "700",
    },
})

