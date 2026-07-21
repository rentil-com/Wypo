
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from "./components/themed-text";
import { ThemedView } from "./components/themed-view";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const {signIn, status, error : authError} = useAuth()


  const [errors, setErrors] = useState("");

  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null); // ref = przewijanie formularza
  const [adresEmail, setadresEmail] = useState(""); // email = adres e-mail
  const [haslo, setHaslo] = useState(""); // pass = haslo


  useEffect(()=> {
    if(status === "authenticated"){
      router.push("/(tabs)/user")
    }

  },[status])

  const sprawdzHaslo = async () => {
   setErrors("");
    if (!adresEmail.trim() || !haslo) {
    setErrors("Podaj adres e-mail i hasło");
    return;
  }
  await signIn(adresEmail,haslo)
  }

  const scrollToLoginForm = (offset: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: offset, animated: true });
    }, 80);
  }

  // WIDOK MOBILNY
  if (Platform.OS !== "web") {
    const mobileWidth = Math.min(width, 430); // szerokosc ekranu
    const heroImageWidth = mobileWidth * 0.92; // szerokosc grafiki
    const heroImageHeight = heroImageWidth * 1.333; // wysokosc grafiki
    const heroFrameHeight = heroImageHeight * 0.86; // ramka grafiki

    return (
      <SafeAreaProvider style={mobileStyles.container}>
        <SafeAreaView style={mobileStyles.safeArea}>
          <KeyboardAvoidingView
            style={mobileStyles.keyboardAvoidingView}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              ref={scrollRef}
              style={mobileStyles.scrollView}
              contentContainerStyle={mobileStyles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              automaticallyAdjustKeyboardInsets={true}
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
                    }
                  ]}
                  resizeMode="contain"
                />
              </View>

          <View style={mobileStyles.loginCard}>
          {/*ERRORY */}
          {errors !== "" && (
                  <View style={mobileStyles.mobileErrorMessageWrapper}>
                    <Text style={mobileStyles.mobileErrorMessagesText}>
                      {errors}
                    </Text>
                  </View>
                )}

                <Text style={mobileStyles.mobileTitle}>Zaloguj się</Text>

                <View style={mobileStyles.mobileForm}>
                  <Text style={mobileStyles.mobileLabel}>Adres e-mail</Text>
                  <View style={mobileStyles.mobileInputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#7B88A4" />
                    <TextInput
                      value={adresEmail}
                      onChangeText={val => setadresEmail(val)}
                      style={mobileStyles.mobileInput}
                      placeholder="Wprowadź adres e-mail"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onFocus={() => scrollToLoginForm(Math.max(150, heroFrameHeight - 54))}
                    />
                  </View>

                  <Text style={mobileStyles.mobileLabel}>Hasło</Text>
                  <View style={mobileStyles.mobileInputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#7B88A4" />
                    <TextInput
                      secureTextEntry={true}
                      value={haslo}
                      onChangeText={val => setHaslo(val)}
                      style={mobileStyles.mobileInput}
                      placeholder="Wprowadź hasło"
                      placeholderTextColor="#94A3B8"
                      onFocus={() => scrollToLoginForm(Math.max(190, heroFrameHeight - 18))}
                    />
                    <Ionicons name="eye-outline" size={20} color="#7B88A4" />
                  </View>

                  <View style={mobileStyles.mobileOptions}>
                    <TouchableOpacity style={mobileStyles.mobileRememberRow} activeOpacity={0.75}>
                      <View style={mobileStyles.mobileCheckbox} />
                      <Text style={mobileStyles.mobileRememberText} numberOfLines={1} adjustsFontSizeToFit>Zapamiętaj mnie</Text>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.75}>
                      <Text style={mobileStyles.mobileForgotPassword} numberOfLines={1} adjustsFontSizeToFit>Nie pamiętasz hasła?</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={mobileStyles.mobileLoginButton} onPress={sprawdzHaslo} activeOpacity={0.86}>
                    <Text style={mobileStyles.mobileLoginButtonText}>Zaloguj się</Text>
                  </TouchableOpacity>
                </View>

                <View style={mobileStyles.mobileDivider}>
                  <View style={mobileStyles.mobileDividerLine} />
                  <Text style={mobileStyles.mobileDividerText}>lub kontynuuj przez</Text>
                  <View style={mobileStyles.mobileDividerLine} />
                </View>

                <View style={mobileStyles.mobileSocialContainer}>
                  <TouchableOpacity style={mobileStyles.mobileSocialButton} activeOpacity={0.75}>
                    <Image source={require('../assets/icons/google-icon.png')} style={mobileStyles.mobileSocialIcon} resizeMode="contain" />
                    <Text style={mobileStyles.mobileSocialText}>Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={mobileStyles.mobileSocialButton} activeOpacity={0.75}>
                    <Image source={require('../assets/icons/facebook-icon.png')} style={mobileStyles.mobileSocialIcon} resizeMode="contain" />
                    <Text style={mobileStyles.mobileSocialText}>Facebook</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={mobileStyles.mobileSocialButton} activeOpacity={0.75}>
                    <Image source={require('../assets/icons/apple-icon.png')} style={mobileStyles.mobileSocialIcon} resizeMode="contain" />
                    <Text style={mobileStyles.mobileSocialText}>Apple</Text>
                  </TouchableOpacity>
                </View>

                <Link href="/rejestracja" dismissTo style={mobileStyles.mobileLink} onPress={()=> router.push("/rejestracja")}>
                  <Text style={mobileStyles.mobileLinkText}>
                    Nie masz jeszcze konta?{" "}
                    <Text style={mobileStyles.mobileLinkTextBlue}>Zarejestruj się</Text>
                  </Text>
                </Link>
              </View>
            </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }


  // WIDOK DESKTOPOWY
  return (
    <SafeAreaProvider style={styles.container}>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.loginPage}>
          {/* LEWA STRONA */}
        <View style={styles.leftSide}>
          <View style={styles.heroImageWrapper}> 
           <Image
              source={require("../assets/logos/rentil_im.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />

            </View>
        </View>

          {/* PRAWA STRONA */}
          <ThemedView style={styles.innerContainer}>
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <Image
                  source={require("../assets/logos/rentil.png")}
                  style={styles.cardLogo}
                  resizeMode="contain"
                />

      </View>
      { errors!= "" &&
        <View style={styles.errorMessageWrapper}>
         <ThemedText style={styles.errorMessagesText}>  {errors !=" " && errors} </ThemedText>
        </View>
}
         <ThemedText type="title" style={styles.title} >Zaloguj sie</ThemedText>

          <View style={styles.form}>
   <ThemedText style={styles.labels}>Adres e-mail</ThemedText>
      <TextInput value={adresEmail} onChangeText={val => setadresEmail(val)}   style={styles.inputs}  placeholder="Wprowadź adres e-mail"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address" />

    <ThemedText style={styles.labels}>Hasło</ThemedText>
      <TextInput secureTextEntry={true} value={haslo} onChangeText={val => setHaslo(val)} style={styles.inputs}   placeholder="Wprowadź hasło"
                  placeholderTextColor="#94A3B8" />
   
      {/* ODZYSKIWANIE KONTA, NIE PAMIETASZ HASLA ORAZ ZAPAMIETAJ MNIE */}
      <View style={styles.formOptions}>
        <TouchableOpacity style={styles.rememberRow}>
          <View style={styles.checkbox} />
            <Text style={styles.rememberText}>Zapamiętaj mnie</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={()=> router.push("/password_reset")}>
          <Text style={styles.forgotPassword}>
                      Nie pamiętasz hasła?
          </Text>
        </TouchableOpacity>
      </View>


      <TouchableOpacity style={styles.btnLogin} onPress={sprawdzHaslo}  activeOpacity={0.85}>
        <Text style={styles.btnLoginText}>ZALOGUJ SIE</Text>
    </TouchableOpacity>
      </View>

     <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>lub kontynuuj przez</Text>
                <View style={styles.dividerLine} />
    </View>


     <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialButtonWrapper}> 
                    <Image source={require('../assets/icons/facebook-icon.png')} style={styles.socialIcon} resizeMode="contain">

                    </Image>
                     <Text style={styles.socialText}>Facebook</Text>
                        </TouchableOpacity>


                         <TouchableOpacity style={styles.socialButtonWrapper}> 
                    <Image source={require('../assets/icons/apple-icon.png')} style={styles.socialIcon} resizeMode="contain">
                      
                    </Image>
                     <Text style={styles.socialText}>Apple</Text>
                        </TouchableOpacity >


                         <TouchableOpacity style={styles.socialButtonWrapper}> 
                    <Image source={require('../assets/icons/google-icon.png')} style={styles.socialIcon} resizeMode="contain">

                    </Image>
                     <Text style={styles.socialText}>Google</Text>
                        </TouchableOpacity>
                        
            </View>
         <Link href="/rejestracja" dismissTo style={styles.link}> 
         <Text style={styles.linkText}>
                  Nie masz jeszcze konta?{" "}
          <Text style={styles.linkTextBlue}>Zarejestruj się</Text>
          </Text>

      </Link>
      </View>
      
      </ThemedView>
       </View>
    </SafeAreaView>
   </SafeAreaProvider>
 



  );
};

const desktopStyles = StyleSheet.create({
    errorMessageWrapper : {
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
    gap: 10,
    marginBottom: 22,

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
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    innerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 48,
      paddingVertical: 40,
      backgroundColor: "#F8FBFF",
    },
    card: {
      width: "100%",
      maxWidth: 600,
      backgroundColor: "#FFFFFF",
      borderRadius: 34,
      paddingHorizontal: 62,
      paddingVertical: 58,

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
      fontSize: 36,
      lineHeight: 42,
      fontWeight: '900',
      textAlign: 'left',
      marginBottom: 32,
      color: "#071536",
      letterSpacing: -0.6,
    },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
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
    width: 22,
    height: 22,
    marginRight : 8,
  },
  form: {
    width: '100%',
  },
  labels: {
    fontSize: 16,
    fontWeight: '600',
    color: "#0F172A",
    marginBottom: 8,
    marginLeft: 2,
  },
  inputs: {
    width: '100%',
    height: 62,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    fontSize: 17,
    color: "#0F172A",
    backgroundColor: '#fff',
    outlineStyle: "none" as any,
  },
  btnLogin: {
    backgroundColor: "#2563EB",
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 12,
  
  },
  btnLoginText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  link: {
    marginTop: 4,
    alignItems: 'center',
     textAlign: 'center',
  },
   linkText: {
    fontSize: 15,
    color: "#7B88A4",
    fontWeight: "500",
    textAlign: "center",
  },

  linkTextBlue: {
    color: "#2563EB",
    fontWeight: "700",
  },
  loginPage: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F4F8FF",
    minHeight: "100%",
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
    minHeight: 720,
  },
   cardTop: {
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 34,
},

  cardLogo: {
   width: 220,
  height: 100,
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
  height: "100%",
  justifyContent: "center",
  alignItems: "center",
  },
  formOptions : {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -2,
    marginBottom: 22,
    gap: 12,
  },
   rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CDD7E5",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  rememberText: {
    fontSize: 14,
    color: "#66738F",
    fontWeight: "500",
  },

  forgotPassword: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
    divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 24,
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
  socialText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },


});

const mobileStyles = StyleSheet.create({
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
  gap: 8,
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
  loginCard: {
    marginHorizontal: 16,
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
  mobileTitle: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    color: "#071536",
    letterSpacing: 0,
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
  mobileOptions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -2,
    marginBottom: 13,
    gap: 8,
  },
  mobileRememberRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    maxWidth: "48%",
  },
  mobileCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#CDD7E5",
    backgroundColor: "#FFFFFF",
    marginRight: 7,
  },
  mobileRememberText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#66738F",
    fontWeight: "500",
  },
  mobileForgotPassword: {
    fontSize: 12,
    lineHeight: 17,
    color: "#2563EB",
    fontWeight: "600",
    textAlign: "right",
  },
  mobileLoginButton: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  mobileLoginButtonText: {
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
    marginBottom: 10,
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
  mobileLink: {
    alignItems: "center",
    textAlign: "center",
  },
  mobileLinkText: {
    fontSize: 14,
    lineHeight: 19,
    color: "#7B88A4",
    fontWeight: "500",
    textAlign: "center",
  },
  mobileLinkTextBlue: {
    color: "#2563EB",
    fontWeight: "700",
  },
});

const styles = desktopStyles;

    
    


