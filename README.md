# Rentil — frontend wypożyczalni sprzętu

Rentil to aplikacja Expo/React Native do przeglądania i wypożyczania sprzętu. Działa w przeglądarce oraz na Androidzie i iOS. Użytkownik może składać wnioski o wypożyczenie, zarządzać ulubionymi i dodawać recenzje, a administrator obsługuje wnioski, sprzęt, konta, promocje i stan systemu.

## Uruchomiona aplikacja

Wersja deweloperska jest dostępna pod adresem:

**[https://rentil-dev.calantris.com](https://rentil-dev.calantris.com)**

## Konta testowe

| Rola | E-mail | Hasło |
| --- | --- | --- |
| Użytkownik | `syzyf_test@test.pl` | `@Test356!` |
| Administrator | `pankracy_test@test.pl` | `@Test357!` |

Są to wyłącznie konta testowe — nie należy używać tych danych w środowisku produkcyjnym.

## Jak korzystać z aplikacji

### Użytkownik

1. Zaloguj się lub utwórz konto i potwierdź rejestrację kodem z wiadomości e-mail.
2. W katalogu wyszukuj i filtruj sprzęt według kategorii, ceny, statusu i promocji. Szczegóły produktu zawierają opis, specyfikację, zdjęcia oraz recenzje.
3. Dodaj produkt do ulubionych albo wybierz **Wypożycz teraz**, podaj datę od i do, a następnie złóż wniosek.
4. W **Konto → Moje wypożyczenia** sprawdzaj termin, cenę i status. Aktywne wypożyczenie można zwrócić, a po zwrocie dodać jedną recenzję produktu.
5. W ustawieniach konta można zmienić dane, rozpocząć zmianę adresu e-mail, włączyć lub wyłączyć e-mailowe 2FA oraz usunąć konto.

Cykl wypożyczenia: `oczekujacy → zaakceptowany → aktywny → zwrocony`. Administrator może również odrzucić oczekujący wniosek. Aktywacja oznacza wydanie sprzętu, a zwrot ponownie ustawia go jako dostępny.

### Administrator

Po zalogowaniu konto administratora otrzymuje pozycję **Dashboard**. Dostępne są:

- **Panel Wniosków** — filtrowanie wypożyczeń, akceptacja, odrzucenie, aktywacja, zwrot, ręczna edycja oraz wysyłanie przypomnień.
- **Panel Użytkowników** — lista i filtrowanie kont, szczegóły, edycja oraz usuwanie innych kont.
- **Panel Promocji** — tworzenie, edycja, aktywacja i wygaszanie promocji.
- **Panel Recenzji** — filtrowanie recenzji oraz ich ukrywanie, odkrywanie i logiczne usuwanie.
- **Stan Systemu** — kontrola połączenia z API, bazą danych i S3.
- Formularze dodawania i edycji produktów oraz kategorii.

Kafelki wniosków, użytkowników i recenzji są klikalne. Kliknięcie wybranego kafelka otwiera osobny ekran szczegółów danego wypożyczenia, konta albo recenzji wraz z dostępnymi dla niego akcjami administratora.

## Wiadomości e-mail

E-maile wysyła backend; frontend jedynie uruchamia odpowiednie operacje i obsługuje kody:

- potwierdzenie rejestracji — kod ważny 15 minut, maksymalnie 5 prób;
- logowanie 2FA — kod ważny 10 minut, maksymalnie 5 prób;
- reset hasła — kod ważny 15 minut, maksymalnie 5 prób, a po zmianie wysyłane jest powiadomienie;
- zmiana adresu e-mail — kod trafia na nowy adres, a informacja o zmianie na poprzedni;
- włączenie lub wyłączenie 2FA — powiadomienie o zmianie zabezpieczeń;
- przypomnienie o odbiorze, zbliżającym się zwrocie albo przeterminowanym zwrocie wypożyczenia — wysyłane ręcznie przez administratora z Panelu Wniosków.

Domyślne miejsce i godziny odbioru, miejsce zwrotu oraz adres kontaktowy są ustawiane po stronie backendu przez `MAIL_PICKUP_LOCATION`, `MAIL_PICKUP_HOURS`, `MAIL_RETURN_LOCATION` i `MAIL_CONTACT`.

## Struktura projektu

| Katalog/plik | Przeznaczenie |
| --- | --- |
| `app/` | Trasy Expo Router: strona główna, logowanie, rejestracja, katalog i formularze. |
| `app/(tabs)/` | Ekrany konta, wypożyczeń oraz panelu administratora. |
| `app/services/api.ts` | Wspólny klient HTTP, adres API i wysyłanie ciasteczka sesji. |
| `app/contexts/AuthContext.tsx` | Stan sesji, logowanie, wylogowanie i 2FA. |
| `src/features/` | Logika domenowa podzielona m.in. na `products`, `categories`, `loans`, `reviews`, `account`, `promotions` i `dashboard`. |
| `src/features/*/*.service.ts` | Połączenia z endpointami backendu. |
| `src/features/*/*.types.ts` | Typy żądań i odpowiedzi API. |
| `src/components/shared/` | Wspólne elementy interfejsu, np. nagłówek, układ strony i karty produktów. |
| `assets/` | Ikony, obrazy i fonty. |
| `docker/`, `compose.yaml` | Budowanie i uruchamianie wersji webowej przez Nginx. |

Routing jest plikowy: np. `app/products/[id].tsx` obsługuje szczegóły produktu, a `app/(tabs)/applications/[id].tsx` szczegóły wypożyczenia. Ekrany wywołują serwisy z `src/features`, które komunikują się z API przez wspólny klient. Sesja backendu jest przechowywana w cookie `session_id`; endpointy chronione zwracają `401`, a funkcje tylko dla administratora `403`.

## Wymagania

- Node.js minimum `20.19.x`; zalecany Node.js 22 (używany również w obrazie Docker).
- npm.
- Do wersji mobilnej: Expo Go albo emulator Android/iOS. Symulator iOS wymaga macOS i Xcode.
- Opcjonalnie Docker z Docker Compose do uruchomienia wersji webowej.

Projekt korzysta z Expo SDK 54, React Native 0.81 i TypeScript. Dokumentacja tej wersji Expo: [docs.expo.dev/versions/v54.0.0](https://docs.expo.dev/versions/v54.0.0/).

## Instalacja i uruchomienie

1. Sklonuj repozytorium i przejdź do katalogu frontendu:

   ```bash
   git clone <adres-repozytorium>
   cd Wypo/frontend
   ```

2. Zainstaluj zależności zapisane w `package-lock.json`:

   ```bash
   npm ci
   ```

3. Utwórz plik `.env.local` na podstawie `.env.example`:

   ```env
   EXPO_PUBLIC_API_URL=https://api-rentil.calantris.com
   ```

   Aby używać lokalnego backendu, ustaw np. `http://localhost:3000`. Na fizycznym telefonie użyj adresu IP komputera w sieci lokalnej zamiast `localhost`. Adres nie powinien kończyć się ukośnikiem. Zmienne `EXPO_PUBLIC_*` są widoczne w aplikacji, dlatego nie należy przechowywać w nich sekretów.

4. Uruchom wybraną wersję:

   ```bash
   npm run web       # przeglądarka
   npm start         # menu Expo i kod QR
   npm run android   # emulator/urządzenie Android
   npm run ios       # symulator/urządzenie iOS
   ```

   Wersja webowa zwykle otwiera się pod `http://localhost:8081`. Jeśli zmienisz konfigurację środowiska i Expo nadal używa starej wartości, uruchom `npx expo start -c`.

### Uruchomienie przez Docker

Ustaw `EXPO_PUBLIC_API_URL` w pliku `.env`, a następnie wykonaj:

```bash
docker compose up --build
```

Gotowa statyczna wersja webowa jest serwowana przez Nginx pod `http://localhost:8081`. Zatrzymanie: `docker compose down`.

### Kontrola jakości i typowe problemy

```bash
npm run lint
npx tsc --noEmit
```

- **Brak danych / „Brak adresu API”** — sprawdź `EXPO_PUBLIC_API_URL` i uruchom Expo ponownie.
- **Brak logowania mimo poprawnych danych** — sprawdź dostępność backendu, konfigurację CORS z obsługą credentials oraz cookie sesji.
- **Błąd na telefonie przy lokalnym API** — zamień `localhost` na adres IP komputera i upewnij się, że port backendu jest dostępny w sieci.
- **Status `401`** oznacza brak ważnej sesji, `403` brak wymaganej roli, `409` konflikt stanu zasobu, np. niedostępny sprzęt lub powtórzoną recenzję.
