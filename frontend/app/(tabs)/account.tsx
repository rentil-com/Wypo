import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser, updateAccount, wyłącz_2fa, włacz_2fa } from "@/services/auth.service";
import type { AccountDetails } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";
import HeaderPanel from "@/components/shared/Header/HeaderPanel";
import { apiPatch, apiPost } from "@/services/api";
export default function AccountScreen() {
  const { width } = useWindowDimensions();
  const {status} = useAuth();
  const [account, setAccount] =
    useState<AccountDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [edytowanie,setEdytowanie] = useState(false)
  const [imie,setImie] = useState("")
  const [nazwisko,setNazwisko] =  useState("")
  const [id,setId] = useState(0)
  const [email,setEmail] = useState("")
  const [decyzja,setDecyzja] = useState(false)
  const [twoFa,settwoFa] = useState(false) //2fa
  useEffect(() => {
     if (status !== "authenticated") {
    return;
  }
    async function loadAccount() {
      try {

        const response = await getCurrentUser();
        setAccount(response);
        setImie(response?.imie.toString())
        setNazwisko(response?.nazwisko.toString())
        setEmail(response.email)
        setId(response.id)
        settwoFa(response.dwuetapowe)
        
        
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać konta"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAccount();
  }, [status]);

  const zapisDanych = async ()=> {
    setError("")
   
    if(!imie || !nazwisko){
      setError("Imie i nazwisko nie moga byc puste")
      return;
    }
     setLoading(true)
    try {
   await updateAccount(id,imie, nazwisko)
   setImie(imie)
   setNazwisko(nazwisko)
   setEdytowanie(false)
    }
    catch(error) {
      setError(error instanceof Error ?  error.message : "Nieznany blad")
    }
    finally{
      setLoading(false)
    }
  }

  const anulujZapisDanych = ()=> {
    if(!account) return;
    setEdytowanie(false)
    setImie(account.imie)
    setNazwisko(account.nazwisko)
    setEmail(account.email)
    setError(null)
  }


if (status === "loading") {
  return (
    <SafeAreaView style={styles.stateScreen}>
      <View style={styles.stateCard}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateTitle}>Sprawdzanie sesji...</Text>
      </View>
    </SafeAreaView>
  );
}

if (status === "anonymous") {
  return (
    <SafeAreaView style={styles.stateScreen}>
      <View style={styles.stateCard}>
        <View style={styles.stateIcon}>
          <Ionicons name="lock-closed-outline" size={30} color="#2563EB" />
        </View>
        <Text style={styles.stateTitle}>Musisz się zalogować</Text>
        <Text style={styles.stateDescription}>
          Zaloguj się, aby zobaczyć informacje o swoim koncie.
        </Text>
      </View>
    </SafeAreaView>
  );
}

if (status === "awaiting_2fa") {
  return (
    <SafeAreaView style={styles.stateScreen}>
      <View style={styles.stateCard}>
        <View style={styles.stateIcon}>
          <Ionicons name="shield-checkmark-outline" size={30} color="#2563EB" />
        </View>
        <Text style={styles.stateTitle}>Dokończ logowanie kodem 2FA</Text>
      </View>
    </SafeAreaView>
  );
}

if (loading) {
  return (
    <SafeAreaView style={styles.stateScreen}>
      <View style={styles.stateCard}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.stateTitle}>Pobieranie danych konta...</Text>
      </View>
    </SafeAreaView>
  );
}

if (error) {
  return (
    <SafeAreaView style={styles.stateScreen}>
      <View style={styles.stateCard}>
        <View style={[styles.stateIcon, styles.errorStateIcon]}>
          <Ionicons name="alert-circle-outline" size={30} color="#DC2626" />
        </View>
        <Text style={[styles.stateTitle, styles.errorStateText]}>{error}</Text>
      </View>
    </SafeAreaView>
  );
}

if (!account) {
  return (
    <SafeAreaView style={styles.stateScreen}>
      <View style={styles.stateCard}>
        <View style={styles.stateIcon}>
          <Ionicons name="person-outline" size={30} color="#2563EB" />
        </View>
        <Text style={styles.stateTitle}>Brak danych konta</Text>
      </View>
    </SafeAreaView>
  );
}


const set_2fa = async ()=> {
  setError(null)
  if(!account) return;
  setLoading(true)
  try {
    if(!twoFa){
    const response = await włacz_2fa()
    settwoFa(response.dwuetapowe)
    alert(`${response.message}`)
    }
    else{
      const response = await wyłącz_2fa()
      settwoFa(response.dwuetapowe)
        alert(`${response.message}`)
    }
  }
  catch(error){
    setError(error instanceof Error ? error.message : "Nieznany bład")
  }
  finally {
    setLoading(false)
  }
}

const usuniecieKonta  = async () =>{
  setError(null)
  if(!account) return;
  setLoading(true)

}

  const isMobile = width < 720;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[
        styles.headerShell,
        isMobile && styles.mobileHeaderShell,
      ]}>
        <View style={styles.headerInner}>
          {isMobile ? (
            <View style={styles.mobileTopBar}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.push("/(tabs)/user")}
              >
                <Ionicons name="arrow-back" size={21} color="#1D4ED8" />
                <Text style={styles.backButtonText}>Wróć</Text>
              </Pressable>
              <Text style={styles.mobileTopBarTitle}>Konto</Text>
              <View style={styles.mobileTopBarSpacer} />
            </View>
          ) : (
            <HeaderPanel />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.mobileScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <View pointerEvents="none" style={styles.backgroundDecorations}>
            <View style={styles.backgroundOrbOne} />
            <View style={styles.backgroundOrbTwo} />
          </View>

          <LinearGradient
            colors={["#1D4ED8", "#2563EB", "#60A5FA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.hero,
              isMobile && styles.mobileHero,
            ]}
          >
            <View style={styles.heroGlowTop} />
            <View style={styles.heroGlowBottom} />
            <Ionicons
              name="person-circle-outline"
              size={215}
              color="rgba(255,255,255,0.12)"
              style={styles.heroWatermark}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroLabel}>
                <Ionicons name="person-circle-outline" size={17} color="#DBEAFE" />
                <Text style={styles.heroLabelText}>PROFIL UŻYTKOWNIKA</Text>
              </View>
              <Text style={[
                styles.heroTitle,
                isMobile && styles.mobileHeroTitle,
              ]}>
                Twoje konto
              </Text>
              <Text style={styles.heroSubtitle}>
                Wszystkie najważniejsze informacje w jednym miejscu.
              </Text>
            </View>
          </LinearGradient>

          <View style={[
            styles.accountCard,
            isMobile && styles.mobileAccountCard,
          ]}>
            <View style={[
              styles.profileHeader,
              isMobile && styles.mobileProfileHeader,
            ]}>
              <View style={styles.avatar}>
                <Ionicons name="person-outline" size={42} color="#2563EB" />
              </View>

              <View style={[
                styles.identity,
                isMobile && styles.mobileIdentity,
              ]}>
                <Text style={[
                  styles.name,
                  isMobile && styles.mobileName,
                ]}>
                  {imie} {nazwisko}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {account.email}
                </Text>
              </View>
            
               <Pressable
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => setDecyzja(true)}
                  >
                    <Ionicons name="trash-outline" size={17} color="#1D4ED8" />
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>
                      USUŃ KONTO
                    </Text>
                  </Pressable>
              <View style={[
                styles.profileActions,
                isMobile && styles.mobileProfileActions,
              ]}>
                {edytowanie ? (
                  <>
                    <Pressable
                      style={[styles.actionButton, styles.saveButton]}
                      onPress={() => void zapisDanych()}
                    >
                      <Ionicons name="checkmark-outline" size={17} color="#FFFFFF" />
                      <Text style={[styles.actionButtonText, styles.saveButtonText]}>
                        Zapisz
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={anulujZapisDanych}
                    >
                      <Ionicons name="close-outline" size={18} color="#475569" />
                      <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                        Anuluj
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => setEdytowanie(true)}
                  >
                    <Ionicons name="create-outline" size={17} color="#1D4ED8" />
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>
                      Edytuj konto
                    </Text>
                  </Pressable>
                )}
              </View>
             

              <View style={[
                styles.accountBadge,
                isMobile && styles.mobileAccountBadge,
              ]}>
                <View style={styles.accountBadgeDot} />
                <Text style={styles.accountBadgeText}>AKTYWNE KONTO</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionEyebrow}>TWOJE DANE</Text>
              <Text style={styles.sectionTitle}>Informacje o koncie</Text>
            </View>
            <View style={[
              styles.detailsGrid,
              isMobile && styles.mobileDetailsGrid,
            ]}>
              <View style={styles.detailCard}>
                <View style={styles.detailIcon}>
                  <Ionicons name="person-outline" size={22} color="#2563EB" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Imię</Text>
                  <TextInput style={[styles.detailValue, edytowanie && styles.editableDetailValue]} numberOfLines={1} editable={edytowanie} value={imie} onChangeText={val => setImie(val)} />
                </View>
              </View>
              <View style={styles.detailCard}>
                <View style={styles.detailIcon}>
                  <Ionicons name="id-card-outline" size={22} color="#2563EB" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Nazwisko</Text>
                  <TextInput style={[styles.detailValue, edytowanie && styles.editableDetailValue]} numberOfLines={1} editable={edytowanie} value={nazwisko} onChangeText={val => setNazwisko(val)} />
                </View>
              </View>
            </View>

            <View style={[
              styles.detailsGrid,
              isMobile && styles.mobileDetailsGrid,
            ]}>
              
              <View style={styles.detailCard}>
                <View style={styles.detailIcon}>
                  <Ionicons name="mail-outline" size={22} color="#2563EB" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Adres e-mail</Text>
                  <TextInput  style={styles.detailValue} numberOfLines={1} editable={edytowanie} value={email} />
                  <Pressable
                    style={({ pressed }) => [
                      styles.emailChangeButton,
                      pressed && styles.emailChangeButtonPressed,
                    ]}
                    onPress={() => router.push({
                      pathname: "/(tabs)/account_change_email",
                      params: { email: email.trim().toLowerCase() },
                    })}
                  >
                    <Ionicons name="create-outline" size={16} color="#1D4ED8" />
                    <Text style={styles.emailChangeButtonText}>
                      Zmień adres e-mail
                    </Text>
                    <Ionicons name="chevron-forward-outline" size={15} color="#1D4ED8" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.detailCard}>
                <View style={styles.detailIcon}>
                  <Ionicons name="key-outline" size={22} color="#2563EB" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Rola konta</Text>
                  <Text style={[styles.detailValue, styles.roleValue]}>
                    {account.rola}
                  </Text>
                </View>
              </View>
            </View>
            

            <View style={[
              styles.securityCard,
              isMobile && styles.mobileSecurityCard,
            ]}>
              <View style={[
                styles.securityInfo,
                isMobile && styles.mobileSecurityInfo,
              ]}>
                <View style={[
                  styles.securityIcon,
                  twoFa && styles.securityIconEnabled,
                ]}>
                  <Ionicons
                    name={twoFa ? "shield-checkmark-outline" : "shield-outline"}
                    size={25}
                    color={twoFa ? "#15803D" : "#64748B"}
                  />
                </View>
                <View style={styles.securityText}>
                  <Text style={styles.securityTitle}>
                    Weryfikacja dwuetapowa
                  </Text>
                  <Text style={styles.securityDescription}>
                    Dodatkowa ochrona podczas logowania do konta.
                    
                  </Text>
                </View>
              </View>
                <Pressable onPress={()=> set_2fa()}>   
              <View style={[
                styles.twoFactorBadge,
                twoFa
                  ? styles.twoFactorBadgeEnabled
                  : styles.twoFactorBadgeDisabled,
              ]}>
                <View style={[
                  styles.twoFactorDot,
                  twoFa
                    ? styles.twoFactorDotEnabled
                    : styles.twoFactorDotDisabled,
                ]} />
                <Text style={[
                  styles.twoFactorText,
                  twoFa
                    ? styles.twoFactorTextEnabled
                    : styles.twoFactorTextDisabled,
                ]}>
                  2FA: {twoFa
                    ? "włączone"
                    : "wyłączone"}
                </Text>
              </View>
              </Pressable>
            </View>

          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={decyzja}
        onRequestClose={() => setDecyzja(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="warning-outline" size={30} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>Czy chcesz usunąć konto?</Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setDecyzja(false)}
              >
                <Text style={styles.modalCancelButtonText}>NIE</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => setDecyzja(false)}
              >
                <Text style={styles.modalConfirmButtonText}>TAK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },
  headerShell: {
    width: "100%",
    backgroundColor: "#F4F8FF",
    paddingHorizontal: 32,
    paddingTop: 18,
    paddingBottom: 8,
    position: "relative",
    zIndex: 50,
  },
  mobileHeaderShell: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerInner: {
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
  },
  mobileTopBar: {
    width: "100%",
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5ECF5",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  backButton: {
    minWidth: 76,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: "#EEF6FF",
    paddingHorizontal: 10,
  },
  backButtonText: {
    color: "#1D4ED8",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  mobileTopBarTitle: {
    color: "#0F172A",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
  },
  mobileTopBarSpacer: {
    width: 76,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 34,
    paddingTop: 18,
    paddingBottom: 46,
  },
  mobileScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },
  page: {
    width: "100%",
    maxWidth: 1080,
    position: "relative",
  },
  backgroundDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  backgroundOrbOne: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(147,197,253,0.16)",
    left: -185,
    top: 150,
  },
  backgroundOrbTwo: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(191,219,254,0.22)",
    right: -150,
    bottom: -40,
  },
  hero: {
    minHeight: 240,
    borderRadius: 34,
    overflow: "hidden",
    paddingHorizontal: 58,
    paddingVertical: 40,
  },
  mobileHero: {
    minHeight: 240,
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: 590,
  },
  heroWatermark: {
    position: "absolute",
    right: 54,
    bottom: -42,
    transform: [{ rotate: "-7deg" }],
  },
  heroGlowTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.10)",
    right: -65,
    top: -95,
  },
  heroGlowBottom: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
    right: 150,
    bottom: -120,
  },
  heroLabel: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(219,234,254,0.42)",
    backgroundColor: "rgba(30,64,175,0.24)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 17,
  },
  heroLabelText: {
    color: "#EFF6FF",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 42,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  mobileHeroTitle: {
    fontSize: 32,
    lineHeight: 39,
  },
  heroSubtitle: {
    color: "#DBEAFE",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  accountCard: {
    width: "auto",
    minHeight: 440,
    marginHorizontal: 38,
    marginTop: 22,
    paddingHorizontal: 46,
    paddingTop: 38,
    paddingBottom: 42,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.11,
    shadowRadius: 38,
    elevation: 18,
    position: "relative",
    zIndex: 3,
  },
  mobileAccountCard: {
    marginHorizontal: 8,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 24,
    borderRadius: 23,
  },
  profileHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  mobileProfileHeader: {
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    marginRight: 20,
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  mobileIdentity: {
    width: "100%",
    alignItems: "center",
    marginTop: 14,
  },
  profileActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 16,
  },
  mobileProfileActions: {
    marginLeft: 0,
    marginTop: 14,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },
  editButton: {
    backgroundColor: "#EFF6FF",
  },
  editButtonText: {
    color: "#1D4ED8",
  },
  saveButton: {
    backgroundColor: "#2563EB",
  },
  saveButtonText: {
    color: "#FFFFFF",
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
  },
  cancelButtonText: {
    color: "#475569",
  },
  name: {
    color: "#071536",
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    marginBottom: 4,
  },
  mobileName: {
    fontSize: 23,
    lineHeight: 30,
    textAlign: "center",
  },
  email: {
    color: "#7B88A4",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginLeft: 20,
  },
  mobileAccountBadge: {
    marginLeft: 0,
    marginTop: 16,
  },
  accountBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 7,
  },
  accountBadgeText: {
    color: "#15803D",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E8EEF7",
    marginTop: 28,
    marginBottom: 28,
  },
  sectionHeading: {
    marginBottom: 18,
  },
  sectionEyebrow: {
    color: "#2563EB",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 5,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "800",
  },
  detailsGrid: {
    width: "100%",
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  mobileDetailsGrid: {
    flexDirection: "column",
  },
  detailCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FBFDFF",
    paddingHorizontal: 17,
    paddingVertical: 15,
  },
  detailIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF6FF",
    marginRight: 13,
  },
  detailContent: {
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    marginBottom: 3,
  },
  detailValue: {
    color: "#0F172A",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },
  editableDetailValue: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    outlineWidth: 0,
  },
  emailChangeButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
    borderRadius: 10,
    backgroundColor: "#EEF6FF",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  emailChangeButtonPressed: {
    opacity: 0.7,
  },
  emailChangeButtonText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
  },
  roleValue: {
    textTransform: "capitalize",
  },
  securityCard: {
    width: "100%",
    minHeight: 94,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 20,
  },
  mobileSecurityCard: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 16,
  },
  securityInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  mobileSecurityInfo: {
    width: "100%",
  },
  securityIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    marginRight: 14,
  },
  securityIconEnabled: {
    backgroundColor: "#DCFCE7",
  },
  securityText: {
    flex: 1,
    minWidth: 0,
  },
  securityTitle: {
    color: "#0F172A",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
    marginBottom: 2,
  },
  securityDescription: {
    color: "#7B88A4",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  twoFactorBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  twoFactorBadgeEnabled: {
    backgroundColor: "#DCFCE7",
  },
  twoFactorBadgeDisabled: {
    backgroundColor: "#E2E8F0",
  },
  twoFactorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },
  twoFactorDotEnabled: {
    backgroundColor: "#22C55E",
  },
  twoFactorDotDisabled: {
    backgroundColor: "#94A3B8",
  },
  twoFactorText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  twoFactorTextEnabled: {
    color: "#15803D",
  },
  twoFactorTextDisabled: {
    color: "#475569",
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    paddingVertical: 30,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 18,
  },
  modalIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#FEF2F2",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#0F172A",
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800",
    textAlign: "center",
  },
  modalActions: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  modalCancelButton: {
    backgroundColor: "#F1F5F9",
  },
  modalConfirmButton: {
    backgroundColor: "#DC2626",
  },
  modalCancelButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
  },
  modalConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  stateScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F8FF",
    paddingHorizontal: 20,
  },
  stateCard: {
    width: "100%",
    maxWidth: 520,
    minHeight: 220,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 30,
    paddingVertical: 36,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.09,
    shadowRadius: 30,
    elevation: 14,
  },
  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF6FF",
    marginBottom: 17,
  },
  stateTitle: {
    color: "#071536",
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 16,
  },
  stateDescription: {
    color: "#7B88A4",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },
  errorStateIcon: {
    backgroundColor: "#FEF2F2",
  },
  errorStateText: {
    color: "#991B1B",
    marginTop: 0,
  },
});
