import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
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
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { emailChangeConfirm, passwordResetConfirm } from "@/services/auth.service";



export default function Zmiana_Maila_Kod() {
    const { width } = useWindowDimensions();
    const [kod,setKod] = useState("")
    const [hasło, setHasło] = useState("")
    const [potwierdzenieHasła, setpotwierdzenieHasła] = useState("")
    const {email = "", challenge = "", expires_in = "", max_attempts = "" } = useLocalSearchParams<{
        email?: string;
        challenge?: string;
        expires_in? : string
        max_attempts? : string
    
    }>()
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sprawdzKod = async ()=> {
        if(loading){
            return
        }
        setError(null)
        const poprawnyKod = kod.trim()
        if (!challenge) {
            setError("Brak aktywnego resetowania hasła.")
            return;
        }

        if (!/^\d{6}$/.test(poprawnyKod)) {
            setError("Kod musi składać się z 6 cyfr.")
            return;
        }
        const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
        if(!passwordRegex.test(hasło)){
            setError("Hasło nie spełnia wymaganych zasad bezpieczeństwa.")
            return;
        }
        if(potwierdzenieHasła !== hasło){
            setError("Oba hasła muszą być takie same.")
            return;
        }


        setLoading(true)
        try {
            await passwordResetConfirm(challenge,poprawnyKod,hasło)
            setHasło("")
            setKod("")
            setpotwierdzenieHasła("")
            router.replace("/")
            
        }
        catch(error){
            setError(error instanceof Error ? error.message : "Wystąpił nieznany błąd.")
        }
        finally {
            setLoading(false)
        }
    }
  
    const isMobile = width < 640;

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
                        <ThemedView
                            style={[
                                styles.card,
                                isMobile && styles.mobileCard,
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                                activeOpacity={0.75}
                            >
                                <Ionicons name="arrow-back-outline" size={18} color="#2563EB" />
                                <Text style={styles.backButtonText}>Wróć do podania e-maila</Text>
                            </TouchableOpacity>

                            <View style={styles.heading}>
                                <View style={styles.stepBadge}>
                                    <Text style={styles.stepBadgeText}>KROK 2 Z 2</Text>
                                </View>
                                <View style={styles.verificationIcon}>
                                    <Ionicons name="key-outline" size={30} color="#2563EB" />
                                </View>
                                <ThemedText type="title" style={[
                                    styles.title,
                                    isMobile && styles.mobileTitle,
                                ]}>
                                    Ustaw nowe hasło
                                </ThemedText>
                                <Text style={styles.subtitle}>
                                    Wpisz kod resetowania wysłany na adres:
                                </Text>
                                <View style={styles.emailWrapper}>
                                    <Ionicons name="mail-outline" size={17} color="#2563EB" />
                                    <Text style={styles.emailText}>
                                        {email || "Brak adresu"}
                                    </Text>
                                </View>
                            </View>

                            {error && (
                                <View style={styles.errorMessageWrapper}>
                                    <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
                                    <Text style={styles.errorMessagesText}>
                                        {error}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.form}>
                                <ThemedText style={styles.label}>
                                    Nowe hasło
                                </ThemedText>
                                <TextInput
                                    value={hasło}
                                    secureTextEntry={true}
                                    onChangeText={val => setHasło(val)}
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Wprowadź nowe hasło"
                                    placeholderTextColor="#94A3B8"
                                       editable={!loading}
                                    autoCapitalize="none"
                                   
                                />
                                <ThemedText style={styles.label}>
                                    Powtórz nowe hasło
                                </ThemedText>
                                <TextInput
                                    value={potwierdzenieHasła}
                                    secureTextEntry={true}
                                    onChangeText={val => setpotwierdzenieHasła(val)}
                                    editable={!loading}
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Powtórz nowe hasło"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="none"
                                   
                                />
                                <ThemedText style={styles.label}>
                                    Kod weryfikacyjny
                                </ThemedText>
                                <TextInput
                                    value={kod}
                                    onChangeText={setKod}
                                    style={styles.input}
                                    placeholder="000000"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="none"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!loading}
                                />

                                <View style={styles.securityHint}>
                                    <Ionicons name="time-outline" size={16} color="#7B88A4" />
                                    <Text style={styles.securityHintText}>
                                        Kod wygaśnie za {expires_in} s.
                                    </Text>
                                     <Text style={styles.securityHintText}>
                                        Maksymalna liczba prób: {max_attempts}.
                                    </Text>
                                    
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.sendButton,
                                        loading && styles.sendButtonDisabled,
                                    ]}
                                    onPress={() =>  sprawdzKod()}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    {loading ? (
                                        <>
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                            <Text style={styles.sendButtonText}>Zapisywanie...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                                            <Text style={styles.sendButtonText}>Zapisz nowe hasło</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ThemedView>
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
        maxWidth: 680,
        minHeight: 520,
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
        paddingVertical: 30,
    },
    backButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 18,
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
    stepBadge: {
        borderRadius: 999,
        backgroundColor: "#EFF6FF",
        paddingHorizontal: 11,
        paddingVertical: 5,
        marginBottom: 13,
    },
    stepBadgeText: {
        color: "#2563EB",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.8,
    },
    verificationIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#EEF6FF",
        borderWidth: 1,
        borderColor: "#DBEAFE",
        marginBottom: 17,
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
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
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
        letterSpacing: 10,
        outlineWidth: 0,
    },
    passwordInput: {
        fontSize: 16,
        fontWeight: "500",
        textAlign: "left",
        letterSpacing: 0,
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
    sendButton: {
        width: "100%",
        height: 62,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 9,
        backgroundColor: "#2563EB",
        marginTop: 20,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 9 },
        shadowOpacity: 0.3,
        shadowRadius: 18,
        elevation: 11,
    },
    sendButtonDisabled: {
        opacity: 0.7,
    },
    sendButtonText: {
        color: "#FFFFFF",
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "700",
    },
})

