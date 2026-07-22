import { router } from "expo-router";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import FormScreenLayout from "@components/shared/Form/FormScreenLayout";
import StatusMessage from "@components/shared/Feedback/StatusMessage";
import { ThemedView } from "@components/themed-view";
import { ThemedText } from "@components/themed-text";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { registerConfirm } from "@features/registration";
import { Ionicons } from "@expo/vector-icons";

export default function Rejestracja() {
    const { width } = useWindowDimensions();
    const [kod,setKod] = useState("")
    const {email} = useLocalSearchParams<{email: string}>()
    const {message = "",expires_in = "", max_attempts = ""} = useLocalSearchParams<{message? : string,expires_in? : string, max_attempts? : string}>()
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
    const isMobile = width < 640;

    return (
        <FormScreenLayout
            contentContainerStyle={[
                styles.content,
                isMobile && styles.mobileContent,
            ]}
        >
                        <ThemedView
                            style={[
                                styles.card,
                                isMobile && styles.mobileCard,
                            ]}
                        >
                            <View style={styles.heading}>
                                <ThemedText type="title" style={[
                                    styles.title,
                                    isMobile && styles.mobileTitle,
                                ]}>
                                    Wpisz kod z e-maila
                                </ThemedText>
                                <Text style={styles.subtitle}>
                                    {message}
                                </Text>
                                <View style={styles.emailWrapper}>
                                    <Text style={styles.emailText}>
                                        {email ?? ""}
                                    </Text>
                                </View>
                            </View>

                            <StatusMessage
                                message={error}
                                containerStyle={styles.errorMessageWrapper}
                                textStyle={styles.errorMessagesText}
                            />

                            <View style={styles.form}>
                                <ThemedText style={styles.label}>
                                    Kod weryfikacyjny
                                </ThemedText>
                                <TextInput
                                    value={kod}
                                    onChangeText={(val)=> setKod(val)}
                                    style={styles.input}
                                    placeholder="Wprowadź kod"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="none"
                                    keyboardType="number-pad"
                                />
                                  <View style={styles.securityHint}>
                                    <Ionicons name="time-outline" size={16} color="#7B88A4" />
                                    <Text style={styles.securityHintText}>
                                        Kod jest ważny tylko przez {expires_in} s.
                                    </Text>
                                     <Text style={styles.securityHintText}>
                                        Masz tylko {max_attempts} prób.
                                    </Text>
                                    
                                </View>

                                <TouchableOpacity
                                    style={styles.sendButton}
                                    onPress={()=> sprawdzKod()}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.sendButtonText}>
                                        WYŚLIJ KOD
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ThemedView>
        </FormScreenLayout>
    );
}
const styles = StyleSheet.create({
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
    securityHint: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 13,
    },
    securityHintText: {
        color: "#7B88A4",
        fontSize: 12,
        lineHeight: 17,
    },
})
