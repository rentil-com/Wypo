import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser, updateAccount, usunKonto, wyłącz_2fa, włacz_2fa } from "@features/account";
import type { AccountDetails } from "@features/account";
import { useAuth } from "@/contexts/AuthContext";
import HeaderPanel from "@components/shared/Header/HeaderPanel";
import styles from "../styles/account.styles";
export default function AccountScreen() {
  const { width } = useWindowDimensions();
  const {status,clearSession} = useAuth();
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
  try {
    await usunKonto(id)
    clearSession()
    setDecyzja(false)
    alert("Pomyslnie usunieto konto")
    router.replace("/")
  }
  catch(error){
    setError(error instanceof Error ? error.message : "Nieznany bład")
  }
  finally {
    setLoading(false)
  }

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
                onPress={() => usuniecieKonta()}
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
