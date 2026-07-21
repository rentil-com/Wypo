import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Image,
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
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "./components/themed-text";
import { ThemedView } from "./components/themed-view";
import { register } from "./services/auth.service";

export default function Rejestracja() {
    const { width } = useWindowDimensions();
    const [imie,setImie] =  useState('')
    const [nazwisko,setNazwisko] = useState('')
    const [adres,setAdres] = useState('')
    const [haslo,setHaslo] = useState('')
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const walidacja_adresu_email =()=>{
        const adres_dowalidacji = adres.trim().toLowerCase()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   
        if(adres !=""){

        if(!emailRegex.test(adres_dowalidacji)){
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
        
       }
       else {
        return true;
       }
    }
        return true
    }

    const zakladanieKonta = async ()=> {
        if(loading){
            return
        }
        setError(null)
        setLoading(true)
        const poprawnyEmail = walidacja_adresu_email();
        const poprawneHaslo = walidacja_hasla();

        if (!poprawnyEmail || !poprawneHaslo) {
            return;
        }
        setLoading(true)

        try {
            const response =await register(imie,nazwisko,adres,haslo)

            router.push({pathname : "/rejestracja_kod", params : {email : adres.trim().toLowerCase()}})
        }
        catch(error){
            setError(error instanceof Error ? error.message : "Nieznany blad")
        }
        finally {
            setLoading(false)
        }
       
    }

    if (Platform.OS !== "web") {
        const mobileWidth = Math.min(width, 430);
        const heroImageWidth = mobileWidth * 0.92;
        const heroImageHeight = heroImageWidth * 1.333;
        const heroFrameHeight = heroImageHeight * 0.86;

        return (
            <SafeAreaProvider style={mobileStyles.container}>
                <SafeAreaView style={mobileStyles.safeArea}>
                    <KeyboardAvoidingView
                        style={mobileStyles.keyboardAvoidingView}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                    >
                        <ScrollView
                            style={mobileStyles.scrollView}
                            contentContainerStyle={mobileStyles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                            automaticallyAdjustKeyboardInsets
                        >
                            <View style={[mobileStyles.mobilePage, { maxWidth: mobileWidth }]}>
                                <View style={[mobileStyles.mobileHero, { height: heroFrameHeight }]}>
                                    <Image
                                        source={require("../assets/logos/rentil_im.png")}
                                        style={[
                                            mobileStyles.mobileHeroImage,
                                            {
                                                width: heroImageWidth,
                                                height: heroImageHeight,
                                            },
                                        ]}
                                        resizeMode="contain"
                                    />
                                </View>

                                <View style={mobileStyles.registrationCard}>
                                    {error && (
                                        <View style={mobileStyles.mobileErrorMessageWrapper}>
                                            <Text style={mobileStyles.mobileErrorMessagesText}>
                                                {error}
                                            </Text>
                                        </View>
                                    )}

                                    <Text style={mobileStyles.mobileTitle}>Załóż konto</Text>

                                    <View style={mobileStyles.mobileForm}>
                                        <Text style={mobileStyles.mobileLabel}>Imię</Text>
                                        <View style={mobileStyles.mobileInputWrapper}>
                                            <Ionicons name="person-outline" size={20} color="#7B88A4" />
                                            <TextInput
                                                value={imie}
                                                onChangeText={val => setImie(val)}
                                                style={mobileStyles.mobileInput}
                                                placeholder="Wprowadź imię"
                                                placeholderTextColor="#94A3B8"
                                            />
                                        </View>

                                        <Text style={mobileStyles.mobileLabel}>Nazwisko</Text>
                                        <View style={mobileStyles.mobileInputWrapper}>
                                            <Ionicons name="person-outline" size={20} color="#7B88A4" />
                                            <TextInput
                                                value={nazwisko}
                                                onChangeText={val => setNazwisko(val)}
                                                style={mobileStyles.mobileInput}
                                                placeholder="Wprowadź nazwisko"
                                                placeholderTextColor="#94A3B8"
                                            />
                                        </View>

                                        <Text style={mobileStyles.mobileLabel}>Adres e-mail</Text>
                                        <View style={mobileStyles.mobileInputWrapper}>
                                            <Ionicons name="mail-outline" size={20} color="#7B88A4" />
                                            <TextInput
                                                value={adres}
                                                onChangeText={val => setAdres(val)}
                                                style={mobileStyles.mobileInput}
                                                placeholder="Wprowadź adres e-mail"
                                                placeholderTextColor="#94A3B8"
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                            />
                                        </View>

                                        <Text style={mobileStyles.mobileLabel}>Hasło</Text>
                                        <View style={mobileStyles.mobileInputWrapper}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#7B88A4" />
                                            <TextInput
                                                secureTextEntry
                                                value={haslo}
                                                onChangeText={val => setHaslo(val)}
                                                style={mobileStyles.mobileInput}
                                                placeholder="Wprowadź hasło"
                                                placeholderTextColor="#94A3B8"
                                            />
                                            <Ionicons name="eye-outline" size={20} color="#7B88A4" />
                                        </View>

                                        <TouchableOpacity
                                            style={mobileStyles.mobileCreateButton}
                                            onPress={zakladanieKonta}
                                            activeOpacity={0.86}
                                        >
                                            <Text style={mobileStyles.mobileCreateButtonText}>
                                                ZAŁÓŻ KONTO
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={mobileStyles.mobileDivider}>
                                        <View style={mobileStyles.mobileDividerLine} />
                                        <Text style={mobileStyles.mobileDividerText}>
                                            lub kontynuuj przez
                                        </Text>
                                        <View style={mobileStyles.mobileDividerLine} />
                                    </View>

                                    <View style={mobileStyles.mobileSocialContainer}>
                                        <TouchableOpacity style={mobileStyles.mobileSocialButton} activeOpacity={0.75}>
                                            <Image
                                                source={require("../assets/icons/google-icon.png")}
                                                style={mobileStyles.mobileSocialIcon}
                                                resizeMode="contain"
                                            />
                                            <Text style={mobileStyles.mobileSocialText}>Google</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={mobileStyles.mobileSocialButton} activeOpacity={0.75}>
                                            <Image
                                                source={require("../assets/icons/facebook-icon.png")}
                                                style={mobileStyles.mobileSocialIcon}
                                                resizeMode="contain"
                                            />
                                            <Text style={mobileStyles.mobileSocialText}>Facebook</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={mobileStyles.mobileSocialButton} activeOpacity={0.75}>
                                            <Image
                                                source={require("../assets/icons/apple-icon.png")}
                                                style={mobileStyles.mobileSocialIcon}
                                                resizeMode="contain"
                                            />
                                            <Text style={mobileStyles.mobileSocialText}>Apple</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.registrationPage}>
                    <View style={styles.leftSide}>
                        <View style={styles.heroImageWrapper}>
                            <Image
                                source={require("../assets/logos/rentil_im.png")}
                                style={styles.heroImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    <ThemedView style={styles.rightSide}>
                        <ScrollView
                            style={styles.rightScroll}
                            contentContainerStyle={styles.rightScrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.card}>
                                <View style={styles.cardTop}>
                                    <Image
                                        source={require("../assets/logos/rentil.png")}
                                        style={styles.cardLogo}
                                        resizeMode="contain"
                                    />
                                </View>

                                {error && (
                                    <View style={styles.errorMessageWrapper}>
                                        <ThemedText style={styles.errorMessagesText}>
                                            {error}
                                        </ThemedText>
                                    </View>
                                )}

                                <ThemedText type="title" style={styles.title}>
                                    Załóż konto
                                </ThemedText>

                                <View style={styles.form}>
                                    <ThemedText style={styles.labels}>Imię</ThemedText>
                                    <TextInput
                                        value={imie}
                                        onChangeText={val => setImie(val)}
                                        style={styles.inputs}
                                        placeholder="Wprowadź imię"
                                        placeholderTextColor="#94A3B8"
                                    />

                                    <ThemedText style={styles.labels}>Nazwisko</ThemedText>
                                    <TextInput
                                        value={nazwisko}
                                        onChangeText={val => setNazwisko(val)}
                                        style={styles.inputs}
                                        placeholder="Wprowadź nazwisko"
                                        placeholderTextColor="#94A3B8"
                                    />

                                    <ThemedText style={styles.labels}>Adres e-mail</ThemedText>
                                    <TextInput
                                        value={adres}
                                        onChangeText={val => setAdres(val)}
                                        style={styles.inputs}
                                        placeholder="Wprowadź adres e-mail"
                                        placeholderTextColor="#94A3B8"
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />

                                    <ThemedText style={styles.labels}>Hasło</ThemedText>
                                    <TextInput
                                        secureTextEntry
                                        value={haslo}
                                        onChangeText={val => setHaslo(val)}
                                        style={styles.inputs}
                                        placeholder="Wprowadź hasło"
                                        placeholderTextColor="#94A3B8"
                                    />

                                    <TouchableOpacity
                                        style={styles.createButton}
                                        onPress={zakladanieKonta}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.createButtonText}>ZAŁÓŻ KONTO</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>lub kontynuuj przez</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <View style={styles.socialContainer}>
                                    <TouchableOpacity style={styles.socialButtonWrapper}>
                                        <Image
                                            source={require("../assets/icons/facebook-icon.png")}
                                            style={styles.socialIcon}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.socialText}>Facebook</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.socialButtonWrapper}>
                                        <Image
                                            source={require("../assets/icons/apple-icon.png")}
                                            style={styles.socialIcon}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.socialText}>Apple</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.socialButtonWrapper}>
                                        <Image
                                            source={require("../assets/icons/google-icon.png")}
                                            style={styles.socialIcon}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.socialText}>Google</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </ThemedView>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const desktopStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F8FF",
    },
    safeArea: {
        flex: 1,
        backgroundColor: "#F4F8FF",
    },
    registrationPage: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#F4F8FF",
        minHeight: "100%",
    },
    leftSide: {
        flex: 1.05,
        backgroundColor: "#EEF6FF",
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
    },
    heroImageWrapper: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    heroImage: {
        width: "100%",
        height: "100%",
        minHeight: 720,
    },
    rightSide: {
        flex: 1.2,
        backgroundColor: "#F8FBFF",
    },
    rightScroll: {
        flex: 1,
    },
    rightScrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 42,
        paddingVertical: 30,
    },
    card: {
        width: "100%",
        maxWidth: 680,
        backgroundColor: "#FFFFFF",
        borderRadius: 34,
        paddingHorizontal: 58,
        paddingVertical: 42,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.09,
        shadowRadius: 40,
        elevation: 20,
    },
    cardTop: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    cardLogo: {
        width: 200,
        height: 82,
    },
    errorMessageWrapper: {
        width: "100%",
        minHeight: 54,
        backgroundColor: "#FEF2F2",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#FECACA",
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
        shadowColor: "#DC2626",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    errorMessagesText: {
        flex: 1,
        color: "#991B1B",
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
    },
    title: {
        fontSize: 34,
        lineHeight: 40,
        fontWeight: "900",
        textAlign: "left",
        marginBottom: 24,
        color: "#071536",
        letterSpacing: -0.6,
    },
    form: {
        width: "100%",
    },
    labels: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0F172A",
        marginBottom: 7,
        marginLeft: 2,
    },
    inputs: {
        width: "100%",
        height: 56,
        borderWidth: 1,
        borderColor: "#DDE5F0",
        borderRadius: 16,
        paddingHorizontal: 20,
        marginBottom: 16,
        fontSize: 16,
        color: "#0F172A",
        backgroundColor: "#FFFFFF",
        outlineStyle: "none" as any,
    },
    createButton: {
        backgroundColor: "#2563EB",
        height: 62,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.32,
        shadowRadius: 18,
        elevation: 12,
    },
    createButtonText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 26,
        marginBottom: 20,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E2E8F0",
    },
    dividerText: {
        fontSize: 14,
        color: "#94A3B8",
        fontWeight: "500",
    },
    socialContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
    },
    socialButtonWrapper: {
        flex: 1,
        height: 58,
        borderRadius: 15,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        borderWidth: 1,
        borderColor: "#DDE5F0",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    socialIcon: {
        width: 22,
        height: 22,
        marginRight: 8,
    },
    socialText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1E293B",
    },
});

const mobileStyles = StyleSheet.create({
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
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingBottom: 18,
    },
    mobilePage: {
        width: "100%",
        alignSelf: "center",
        backgroundColor: "#F4F8FF",
    },
    mobileHero: {
        width: "100%",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: "#EEF6FF",
        overflow: "hidden",
    },
    mobileHeroImage: {
        alignSelf: "center",
    },
    registrationCard: {
        marginHorizontal: 12,
        marginTop: -15,
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.09,
        shadowRadius: 30,
        elevation: 12,
    },
    mobileErrorMessageWrapper: {
        width: "100%",
        minHeight: 46,
        backgroundColor: "#FEF2F2",
        borderRadius: 13,
        borderWidth: 1,
        borderColor: "#FECACA",
        paddingHorizontal: 12,
        paddingVertical: 9,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        shadowColor: "#DC2626",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
    },
    mobileErrorMessagesText: {
        flex: 1,
        color: "#991B1B",
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
    },
    mobileTitle: {
        fontSize: 23,
        lineHeight: 28,
        fontWeight: "900",
        color: "#071536",
        marginBottom: 8,
    },
    mobileForm: {
        width: "100%",
    },
    mobileLabel: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 4,
    },
    mobileInputWrapper: {
        width: "100%",
        height: 42,
        borderWidth: 1,
        borderColor: "#D7DFEA",
        borderRadius: 11,
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 13,
        marginBottom: 8,
    },
    mobileInput: {
        flex: 1,
        height: "100%",
        color: "#0F172A",
        fontSize: 14,
        fontWeight: "500",
        paddingHorizontal: 11,
        paddingVertical: 0,
    },
    mobileCreateButton: {
        width: "100%",
        height: 44,
        borderRadius: 12,
        backgroundColor: "#2563EB",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 4,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 9 },
        shadowOpacity: 0.28,
        shadowRadius: 18,
        elevation: 10,
    },
    mobileCreateButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        lineHeight: 21,
        fontWeight: "700",
    },
    mobileDivider: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 10,
        gap: 9,
    },
    mobileDividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E2E8F0",
    },
    mobileDividerText: {
        fontSize: 12,
        lineHeight: 17,
        color: "#94A3B8",
        fontWeight: "500",
    },
    mobileSocialContainer: {
        width: "100%",
        flexDirection: "row",
        gap: 7,
    },
    mobileSocialButton: {
        flex: 1,
        minWidth: 0,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DDE5F0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    mobileSocialIcon: {
        width: 18,
        height: 18,
        marginRight: 4,
    },
    mobileSocialText: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: "600",
        color: "#1E293B",
    },
});

const styles = desktopStyles;
