import { useEffect, useState } from "react";
import {
  
  Text,
  View,
} from "react-native";

import { getCurrentUser } from "@/services/auth.service";
import type { AccountDetails } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";
export default function AccountScreen() {
  const {status} = useAuth();
  const [account, setAccount] =
    useState<AccountDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
     if (status !== "authenticated") {
    return;
  }
    async function loadAccount() {
      try {

        const response = await getCurrentUser();
        setAccount(response);
        
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


if (status === "loading") {
  return <Text>Sprawdzanie sesji...</Text>;
}

if (status === "anonymous") {
  return <Text>Musisz się zalogować</Text>;
}

if (status === "awaiting_2fa") {
  return <Text>Dokończ logowanie kodem 2FA</Text>;
}

if (loading) {
  return <Text>Pobieranie danych konta...</Text>;
}

if (error) {
  return <Text>{error}</Text>;
}

if (!account) {
  return <Text>Brak danych konta</Text>;
}

  return (
    <View>
      <Text>TWOJE DANE</Text>
      <Text>
        {account.imie} {account.nazwisko}
      </Text>

      <Text>{account.email}</Text>
      <Text>Rola: {account.rola}</Text>

      <Text>
        2FA: {account.dwuetapowe
          ? "włączone"
          : "wyłączone"}
      </Text>
    </View>
  );
}