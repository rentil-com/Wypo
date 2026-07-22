import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import LoadingButton from "@components/shared/Form/LoadingButton";
import { startEmailChange } from "@features/account";
import { startPasswordReset } from "@features/password-reset";


export default function Start_Reset_Hasła() {
    const { width } = useWindowDimensions();
    const [email,setEmail] = useState("")
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

 
    const isMobile = width < 640;

    const wyslijKod = async ()=> {
        const poprawnyEmail = email.trim().toLowerCase()
        if(!poprawnyEmail){
            setError("Podaj adres e-mail.")
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(poprawnyEmail)){
            setError("Podaj poprawny adres e-mail.")
            return;
        }

        setError(null)
        setLoading(true)

        try {
            const response = await startPasswordReset(poprawnyEmail)
            router.push({pathname : "/password_reset_kod", params : {email : poprawnyEmail,
                challenge : response.challenge,
                expires_in : response.expires_in,
                max_attempts : response.max_attempts
            }})
        }
        catch(error){
            setError(error instanceof Error ? error.message : "Wystąpił nieznany błąd.")
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
                        <View style={[
                            styles.card,
                            isMobile && styles.mobileCard,
                        ]}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                                activeOpacity={0.75}
                            >
                                <Ionicons name="arrow-back-outline" size={18} color="#2563EB" />
                                <Text style={styles.backButtonText} >Wróć do logowania</Text>
                            </TouchableOpacity>

                            <View style={styles.heading}>
                                <View style={styles.headingIcon}>
                                    <Ionicons name="key-outline" size={28} color="#2563EB" />
                                </View>
                                <Text style={[
                                    styles.title,
                                    isMobile && styles.mobileTitle,
                                ]}>
                                    Zresetuj hasło
                                </Text>
                                <Text style={styles.subtitle}>
                                    Podaj adres e-mail przypisany do konta. Wyślemy na niego kod potrzebny do ustawienia nowego hasła.
                                </Text>
                            {error && (
                                <View style={styles.errorMessageWrapper}>
                                    <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
                                    <Text style={styles.errorMessagesText}>{error}</Text>
                                </View>
                            )}
</View>
                            <View style={styles.form}>
                          


                                <Text style={styles.label}>Adres e-mail</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={20} color="#7B88A4" />
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        style={styles.input}
                                        placeholder="np. jan@example.com"
                                        placeholderTextColor="#94A3B8"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="email-address"
                                        editable={!loading}
                                    />
                                </View>
                                <Text style={styles.helperText}>
                                    Jeśli konto istnieje, otrzymasz wiadomość z kodem weryfikacyjnym.
                                </Text>
                     

                                <LoadingButton
                                    loading={loading}
                                    loadingText="Wysyłanie..."
                                    label="Wyślij kod resetujący"
                                    onPress={() => wyslijKod()}
                                    icon={<Ionicons name="paper-plane-outline" size={19} color="#FFFFFF" />}
                                />
                            </View>
                        </View>
                             
                       
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
        maxWidth: 680,
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 34,
        paddingHorizontal: 64,
        paddingVertical: 48,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.1,
        shadowRadius: 40,
        elevation: 20,
    },
    mobileCard: {
        borderRadius: 24,
        paddingHorizontal: 22,
        paddingVertical: 28,
    },
    backButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 24,
    },
    backButtonText: {
        color: "#2563EB",
        fontSize: 14,
        fontWeight: "700",
    },
    heading: {
        width: "100%",
        alignItems: "center",
        marginBottom: 30,
    },
    headingIcon: {
        width: 58,
        height: 58,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#EEF6FF",
        marginBottom: 16,
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
        alignItems: "center",
    },
    emailCaption: {
        color: "#7B88A4",
        fontSize: 11,
        fontWeight: "700",
        marginBottom: 2,
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
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
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
        flex: 1,
        color: "#991B1B",
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
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
    inputWrapper: {
        width: "100%",
        height: 58,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#DDE5F0",
        borderRadius: 16,
        paddingHorizontal: 18,
        backgroundColor: "#FFFFFF",
        marginBottom: 20,
    },
    input: {
        flex: 1,
        height: "100%",
        paddingHorizontal: 12,
        color: "#0F172A",
        fontSize: 16,
        fontWeight: "500",
        outlineWidth: 0,
    },
    helperText: {
        color: "#7B88A4",
        fontSize: 13,
        lineHeight: 19,
        textAlign: "center",
        marginTop: -4,
    },
})

