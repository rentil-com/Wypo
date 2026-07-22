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
import { confirm2FA } from "@features/auth";
import { registerConfirm } from "@features/registration";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "./contexts/AuthContext";
export default function Rejestracja() {
    const { width } = useWindowDimensions();
    const [kod,setKod] = useState("")
    const {expires_in = "", max_attempts = ""} = useLocalSearchParams<{expires_in? : string, max_attempts? : string}>()
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const {challenge,verify2FA,error: authError} = useAuth()
    const isMobile = width < 640;


    const sprawdzKod = async ()=> {
        setError(null)
                setLoading(true)
        try{
            const poprawnyKod = kod.trim()
        if (!/^\d{6}$/.test(poprawnyKod)) {
        setError("Kod 2FA musi składać się z 6 cyfr.")
        return;
        }
            await verify2FA(kod)
        }
        catch(error){
            setError(error instanceof Error ? error.message : "Nieznany bład")
        }
        finally {
            setLoading(false)
        }
    }

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
                                    Weryfikacja dwuetapowa (2FA)
                                </ThemedText>
                                <Text style={styles.subtitle}>
                                    Aby dokończyć logowanie, wpisz sześciocyfrowy kod wysłany na Twój adres e-mail.
                                </Text>
                                <Ionicons name="shield-checkmark-outline" size={30} color="#2563EB" />
                                
                            </View>

                            <StatusMessage
                                message={error || authError}
                                containerStyle={styles.errorMessageWrapper}
                                textStyle={styles.errorMessagesText}
                            />

                            <View style={styles.form}>
                                <ThemedText style={styles.label}>
                                    Kod logowania 2FA
                                </ThemedText>
                                <TextInput
                                    value={kod}
                                    onChangeText={(val)=> setKod(val)}
                                    style={styles.input}
                                    placeholder="000000"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="none"
                                    keyboardType="number-pad"
                                />
                                  <View style={styles.securityHint}>
                                    <Ionicons name="time-outline" size={16} color="#7B88A4" />
                                    <Text style={styles.securityHintText}>
                                        Kod 2FA jest ważny tylko przez {expires_in} s.
                                    </Text>
                                     <Text style={styles.securityHintText}>
                                        Pozostała liczba prób: {max_attempts}.
                                    </Text>
                                    
                                </View>

                                <TouchableOpacity
                                    style={styles.sendButton}
                                    onPress={()=> sprawdzKod()}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.sendButtonText}>
                                        POTWIERDŹ LOGOWANIE
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
        paddingHorizontal: 32,
        paddingVertical: 32,
    },
    mobileContent: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    card: {
        width: "100%",
        maxWidth: 650,
        minHeight: 450,
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "#E5EDF7",
        paddingHorizontal: 64,
        paddingVertical: 52,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.08,
        shadowRadius: 32,
        elevation: 14,
    },
    mobileCard: {
        minHeight: 0,
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 30,
    },
    heading: {
        width: "100%",
        alignItems: "center",
        marginBottom: 26,
    },
    title: {
        fontSize: 34,
        lineHeight: 41,
        fontWeight: "900",
        color: "#071536",
        textAlign: "center",
        letterSpacing: -0.6,
        marginBottom: 12,
    },
    mobileTitle: {
        fontSize: 26,
        lineHeight: 33,
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
        borderRadius: 11,
        backgroundColor: "#EEF6FF",
        paddingHorizontal: 14,
        paddingVertical: 8,
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
        height: 68,
        borderWidth: 1,
        borderColor: "#BFDBFE",
        borderRadius: 16,
        paddingHorizontal: 20,
        backgroundColor: "#F8FBFF",
        color: "#0F172A",
        fontSize: 24,
        fontWeight: "800",
        textAlign: "center",
        letterSpacing: 9,
        outlineStyle: "none" as any,
    },
    sendButton: {
        width: "100%",
        height: 58,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#2563EB",
        marginTop: 18,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
        elevation: 8,
    },
    sendButtonText: {
        color: "#FFFFFF",
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "700",
    },
    securityHint: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        columnGap: 6,
        rowGap: 3,
        marginTop: 13,
    },
    securityHintText: {
        color: "#7B88A4",
        fontSize: 12,
        lineHeight: 17,
    },
})

