# Rentil — wypożyczalnia sprzętu

Rentil to pełna aplikacja do przeglądania i wypożyczania sprzętu. Repozytorium zawiera frontend Expo/React Native, backend Express, bazę PostgreSQL oraz worker odpowiedzialny za automatyczne promocje.

## Uruchomiona aplikacja

**[https://rentil-dev.calantris.com](https://rentil-dev.calantris.com)**

## Konta testowe

| Rola | E-mail | Hasło |
| --- | --- | --- |
| Użytkownik | `syzyf_test@test.pl` | `@Test356!` |
| Administrator | `pankracy_test@test.pl` | `@Test357!` |

Są to wyłącznie konta testowe — nie należy używać tych danych w środowisku produkcyjnym.

## Jak działa aplikacja

### Użytkownik

1. Zaloguj się lub utwórz konto i potwierdź rejestrację kodem z wiadomości e-mail.
2. W katalogu wyszukuj i filtruj sprzęt według kategorii, ceny, statusu i promocji. Szczegóły produktu zawierają opis, specyfikację, zdjęcia oraz recenzje.
3. Dodaj produkt do ulubionych albo wybierz **Wypożycz teraz**, podaj datę od i do, a następnie złóż wniosek.
4. W **Konto → Moje wypożyczenia** sprawdzaj termin, cenę i status. Aktywne wypożyczenie można zwrócić, a po zwrocie dodać jedną recenzję produktu.
5. W ustawieniach konta można zmienić dane, adres e-mail, włączyć lub wyłączyć e-mailowe 2FA oraz usunąć konto.

Cykl wypożyczenia: `oczekujacy → zaakceptowany → aktywny → zwrocony`. Administrator może również odrzucić oczekujący wniosek. Aktywacja oznacza wydanie sprzętu, a zwrot ponownie ustawia go jako dostępny.

### Administrator

Po zalogowaniu administrator otrzymuje dostęp do **Dashboardu**:

- **Panel Wniosków** — filtrowanie wypożyczeń, akceptacja, odrzucenie, aktywacja, zwrot, ręczna edycja i wysyłanie przypomnień.
- **Panel Użytkowników** — filtrowanie kont, edycja oraz usuwanie innych kont.
- **Panel Promocji** — tworzenie, edycja, aktywacja i wygaszanie promocji.
- **Panel Recenzji** — filtrowanie, ukrywanie, odkrywanie i logiczne usuwanie recenzji.
- **Stan Systemu** — kontrola połączenia z API, bazą danych i S3.
- Formularze dodawania i edycji produktów oraz kategorii.

Kafelki wniosków, użytkowników i recenzji są klikalne. Kliknięcie otwiera osobny ekran szczegółów danego wypożyczenia, konta albo recenzji wraz z dostępnymi akcjami administratora.

## Zrzuty ekranu

<details>
<summary><strong>Widoki użytkownika</strong></summary>

### Logowanie

![Logowanie](frontend/Docs/screenshots/01-logowanie.png)

### Rejestracja

![Rejestracja](frontend/Docs/screenshots/02-rejestracja.png)

### Strona główna i promocja

![Strona główna i promocja](frontend/Docs/screenshots/03-strona-glowna-promocja.png)

### Katalog i filtry

![Katalog i filtry](frontend/Docs/screenshots/04-katalog-filtry.png)

### Wybór terminu wypożyczenia

![Wybór terminu](frontend/Docs/screenshots/05-produkt-wybor-terminu.png)

### Moje wypożyczenia

![Moje wypożyczenia](frontend/Docs/screenshots/06-moje-wypozyczenia.png)

### Panel konta

![Panel konta](frontend/Docs/screenshots/07-panel-konta.png)

### Moje recenzje

![Moje recenzje](frontend/Docs/screenshots/08-moje-recenzje.png)

### Jak to działa

![Jak to działa](frontend/Docs/screenshots/09-jakToDziala.png)

### Wyszukiwarka

![Wyszukiwarka](frontend/Docs/screenshots/010-searchbar-działanie.png)

### Ulubione

![Ulubione](frontend/Docs/screenshots/011-ulubione.png)

### Kategorie

![Kategorie](frontend/Docs/screenshots/012-panelKategorii.png)

### Przypomnienie i reset hasła

![Nie pamiętasz hasła](frontend/Docs/screenshots/013-niePamietaszHasła.png)

![Reset hasła](frontend/Docs/screenshots/014-resetHasla.png)

</details>

<details>
<summary><strong>Widoki administratora</strong></summary>

### Strona główna administratora

![Strona główna administratora](frontend/Docs/screenshots/015-widokAdmina-stronaglowna.png)

### Edycja i dodawanie kategorii

![Edycja kategorii](frontend/Docs/screenshots/016-edycjaKategorii-Admin.png)

![Dodawanie kategorii](frontend/Docs/screenshots/017-dodajKategorie-Admin.png)

### Edycja produktu i katalog administratora

![Edycja produktu](frontend/Docs/screenshots/018-edytujProdukt-Admin.png)

![Katalog administratora](frontend/Docs/screenshots/019-Katalog-WidokAdmina.png)

### Dodawanie produktu

![Dodawanie produktu](frontend/Docs/screenshots/020-dodajProdukt-Admin.png)

### Dashboard

![Dashboard administratora](frontend/Docs/screenshots/021-dashboardAdmin.png)

### Panel wniosków

![Panel wniosków](frontend/Docs/screenshots/022-panelwnioskowAdmin.png)

![Szczegóły wniosku](frontend/Docs/screenshots/023-panelPojedynczegoWniosku-Admin.png)

### Panel użytkowników

![Panel użytkowników](frontend/Docs/screenshots/024-panelUzytkownikow-Admin.png)

![Szczegóły użytkownika](frontend/Docs/screenshots/025-panelPojedynczegoUzytkownika-Admin.png)

### Panel promocji

![Panel promocji](frontend/Docs/screenshots/026-panelPromocji-Admin.png)

### Panel recenzji

![Panel recenzji](frontend/Docs/screenshots/027-panelRecenzji-Admin.png)

![Szczegóły recenzji](frontend/Docs/screenshots/028-panelPojedynczejRecenzji-Admin.png)

### Stan systemu

![Stan systemu](frontend/Docs/screenshots/029-panelStanSystemu-Admin.png)

</details>

## Wiadomości e-mail

E-maile wysyła backend; frontend uruchamia operacje i obsługuje kody:

- potwierdzenie rejestracji — kod ważny 15 minut, maksymalnie 5 prób;
- logowanie 2FA — kod ważny 10 minut, maksymalnie 5 prób;
- reset hasła — kod ważny 15 minut, maksymalnie 5 prób, a po zmianie wysyłane jest powiadomienie;
- zmiana adresu e-mail — kod trafia na nowy adres, a informacja o zmianie na poprzedni;
- włączenie lub wyłączenie 2FA — powiadomienie o zmianie zabezpieczeń;
- przypomnienie o odbiorze, zbliżającym się zwrocie albo przeterminowanym zwrocie — wysyłane ręcznie przez administratora z Panelu Wniosków.

Domyślne miejsce i godziny odbioru, miejsce zwrotu oraz adres kontaktowy konfiguruje backend przez `MAIL_PICKUP_LOCATION`, `MAIL_PICKUP_HOURS`, `MAIL_RETURN_LOCATION` i `MAIL_CONTACT`.

## Struktura repozytorium

| Katalog | Przeznaczenie |
| --- | --- |
| `frontend/` | Aplikacja Expo/React Native, routing, interfejs i połączenia z API. |
| `frontend/app/` | Trasy Expo Router: strona główna, logowanie, katalog i formularze. |
| `frontend/src/features/` | Moduły m.in. produktów, kategorii, wypożyczeń, recenzji, kont i dashboardu. |
| `backend/` | API Express, PostgreSQL, sesje, e-maile, S3 i logika wypożyczalni. |
| `backend/Docs/ENDPOINTY.md` | Pełna dokumentacja endpointów i statusów API. |
| `worker/` | Osobna usługa harmonogramu dziennych promocji i jej API ustawień. |
| `postman/`, `.postman/` | Wszystkie ścieżki API przygotowane do Postmana, środowiska lokalne oraz scenariusze testowe backendu i workera. |
| `frontend/Docs/markdown.md` | Szczegółowa dokumentacja techniczna frontendu, API i obsługi projektu. |
| `frontend/Docs/screenshots/` | Zrzuty ekranu użyte w dokumentacji. |

Frontend komunikuje się z backendem przez wspólny klient HTTP. Sesja jest przechowywana w cookie `session_id`; odpowiedź `401` oznacza brak sesji, `403` brak wymaganej roli, a `409` konflikt stanu zasobu.

## Dokumentacja i Postman

- Szczegółowy opis ekranów, logiki, typów i uruchamiania znajduje się w [`frontend/Docs/markdown.md`](frontend/Docs/markdown.md).
- Wszystkie zrzuty dokumentacyjne znajdują się w [`frontend/Docs/screenshots/`](frontend/Docs/screenshots/).
- Pełna dokumentacja backendu jest dostępna w [`backend/Docs/ENDPOINTY.md`](backend/Docs/ENDPOINTY.md).
- Katalog [`postman/`](postman/) zawiera pogrupowane requesty dla wszystkich ścieżek backendu i workera oraz osobną kolekcję testów API. Środowiska i importowalne kolekcje znajdują się również w `backend/postman/`, `worker/postman/` i `.postman/`.

## Wymagania

- Node.js minimum `20.19.x`; zalecany Node.js 22.
- npm i PostgreSQL.
- Dostęp do S3 i SMTP, jeśli mają działać zdjęcia oraz wiadomości e-mail.
- Do wersji mobilnej: Expo Go albo emulator Android/iOS.
- Opcjonalnie Docker z Docker Compose do wersji webowej frontendu.

Frontend korzysta z Expo SDK 54, React Native 0.81 i TypeScript. Dokumentacja: [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/).

## Instalacja i uruchomienie

### Sam frontend z wdrożonym API

```bash
git clone <adres-repozytorium>
cd Wypo/frontend
npm ci
```

Utwórz `frontend/.env.local`:

```env
EXPO_PUBLIC_API_URL=https://api-rentil.calantris.com
```

Uruchom wybraną wersję:

```bash
npm run web       # przeglądarka, zwykle http://localhost:8081
npm start         # menu Expo i kod QR
npm run android   # Android
npm run ios       # iOS, wymaga macOS
```

Na fizycznym telefonie lokalny backend musi być wskazany przez adres IP komputera zamiast `localhost`. Po zmianie konfiguracji można wyczyścić cache poleceniem `npx expo start -c`.

### Backend lokalny

Utwórz bazę PostgreSQL, wczytaj schemat z `backend/baza.sql`, a następnie:

```bash
cd backend
npm ci
cp .env.example .env
npm run dev
```

W PowerShell zamiast `cp` użyj `Copy-Item .env.example .env`. W `.env` skonfiguruj przede wszystkim `DATABASE_CONNECTION_URL`, `FRONTEND_ORIGINS`, S3 i SMTP. API domyślnie działa pod `http://localhost:3000`.

### Worker promocji

Worker jest opcjonalny. Wymaga osobnej bazy PostgreSQL i zgodnych kluczy komunikacji z backendem:

```bash
cd worker
npm ci
cp .env.example .env
npm run db:init
npm start
```

Szczegóły konfiguracji workera znajdują się w [`worker/docs/WORKER_POSTGRESQL.md`](worker/docs/WORKER_POSTGRESQL.md). Domyślny port API workera to `3001`.

Zalecana kolejność uruchamiania pełnego środowiska: PostgreSQL → backend → worker → frontend.

### Frontend przez Docker

W katalogu `frontend` ustaw `EXPO_PUBLIC_API_URL` w pliku `.env`, a następnie:

```bash
docker compose up --build
```

Wersja webowa będzie dostępna pod `http://localhost:8081`. Zatrzymanie: `docker compose down`.

### Kontrola jakości

```bash
cd frontend && npm run lint && npx tsc --noEmit
cd ../backend && npm test
cd ../worker && npm test
```
