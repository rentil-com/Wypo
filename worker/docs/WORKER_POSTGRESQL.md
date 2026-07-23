# Worker promocji i PostgreSQL

Worker raz dziennie pobiera wszystkie strony `GET /items?status=dostepny`,
losuje dostępny przedmiot i tworzy dla niego rekord przez `POST /promocje`.
Każde żądanie zawiera `Authorization: Bearer <BACKEND_API_AUTHORIZED_KEY>`.

PostgreSQL służy wyłącznie do przechowywania ustawień i historii wykonań workera. Worker nie odczytuje ani nie modyfikuje istniejących tabel backendu, a klucz API pozostaje tylko w `.env`.

## Wymagania

- Node.js 18 lub nowszy,
- działający backend Wypo,
- dostępna baza PostgreSQL,
- ważny administracyjny klucz API backendu.

## Struktura plików

```text
worker/
├── docs/
│   └── WORKER_POSTGRESQL.md
├── sql/
│   ├── 001_create_worker_settings.sql
│   ├── 002_create_worker_promotion_runs.sql
│   ├── 003_add_backend_promotion_id.sql
│   └── baza.sql
├── src/
│   ├── clients/
│   │   └── backend-client.js
│   ├── commands/
│   │   ├── history.js
│   │   ├── init-database.js
│   │   └── settings.js
│   ├── config/
│   │   └── env.js
│   ├── database/
│   │   └── worker-repository.js
│   ├── jobs/
│   │   └── daily-promotion.js
│   ├── services/
│   │   └── worker-settings.js
│   └── index.js
├── .env.example
└── package.json
```

- `clients` odpowiada za komunikację z backendem,
- `commands` zawiera polecenia uruchamiane przez skrypty npm,
- `config` wczytuje i sprawdza konfigurację środowiskową,
- `database` obsługuje PostgreSQL,
- `jobs` zawiera zadanie cykliczne,
- `services` zawiera logikę ustawień workera.

## Baza PostgreSQL

Worker łączy się z istniejącą bazą wskazaną przez `WORKER_DATABASE_URL`. Baza musi istnieć przed uruchomieniem workera.

Przykładowe ręczne utworzenie użytkownika i osobnej bazy:

```sql
CREATE ROLE worker_user WITH LOGIN PASSWORD 'worker_password';
CREATE DATABASE wypo_worker OWNER worker_user;
```

Hasło jest wyłącznie przykładem. W środowisku docelowym należy użyć własnego silnego hasła.

Worker sam tworzy tabelę ustawień `worker_settings` oraz tabelę historii `worker_promotion_runs` na podstawie plików SQL z katalogu `sql/`. Nie tworzy nowych endpointów backendu i nie korzysta z tabel biznesowych backendu.
Plik `sql/baza.sql` zawiera kompletny schemat obu tabel i indeksu w jednej transakcji. Można go uruchomić ręcznie:

```bash
psql "$WORKER_DATABASE_URL" -f sql/baza.sql
```

Pliki `001_*.sql`, `002_*.sql` i `003_*.sql` są używane przez `npm run db:init`.

## Konfiguracja

Skopiuj plik przykładowy:

```bash
cd worker
cp .env.example .env
```

W PowerShell:

```powershell
Set-Location worker
Copy-Item .env.example .env
```

Uzupełnij `.env`:

```env
BACKEND_API_URL=http://localhost:3000
BACKEND_API_AUTHORIZED_KEY=wypo_tutaj_prawdziwy_klucz
BACKEND_REQUEST_TIMEOUT_MS=10000
WORKER_API_KEY=klucz
WORKER_API_HOST=0.0.0.0
WORKER_API_PORT=3001
WORKER_DATABASE_URL=postgresql://worker_user:worker_password@localhost:5432/wypo_worker
CRON_DAILY_PROMOTION=0 3 * * *
DAILY_PROMOTION_ENABLED=true
TZ=Europe/Warsaw
PROMOTION_DISCOUNT_MIN_PERCENT=10
PROMOTION_DISCOUNT_MAX_PERCENT=20
HISTORY_DEFAULT_LIMIT=10
HISTORY_MAX_LIMIT=100
```

Znaczenie zmiennych:

- `BACKEND_API_URL` - bazowy adres istniejącego API backendu,
- `BACKEND_API_AUTHORIZED_KEY` - klucz wysyłany w nagłówku `Authorization: Bearer ...`,
- `BACKEND_REQUEST_TIMEOUT_MS` - maksymalny czas oczekiwania na odpowiedź backendu w milisekundach,
- `WORKER_API_KEY` - klucz chroniący endpointy ustawień workera; należy wysyłać go jako `Authorization: Bearer <WORKER_API_KEY>`,
- `WORKER_API_HOST` - opcjonalny adres nasłuchu API workera, domyślnie `0.0.0.0`,
- `WORKER_API_PORT` - opcjonalny port API workera, domyślnie `3001`,
- `WORKER_DATABASE_URL` - adres połączenia z bazą PostgreSQL workera,
- `CRON_DAILY_PROMOTION` i `TZ` - początkowy harmonogram i strefa czasowa,
- `DAILY_PROMOTION_ENABLED` - opcjonalne `true` albo `false`; domyślnie `true`,
- `PROMOTION_DISCOUNT_MIN_PERCENT` i `PROMOTION_DISCOUNT_MAX_PERCENT` - początkowy zakres losowanego rabatu,
- `HISTORY_DEFAULT_LIMIT` - domyślna liczba rekordów wypisywanych przez `history:list`,
- `HISTORY_MAX_LIMIT` - największa dozwolona liczba rekordów dla `history:list`.

Wartości harmonogramu, strefy czasowej i zakresu rabatu są zapisywane do PostgreSQL tylko wtedy, gdy dane ustawienie nie istnieje jeszcze w tabeli. Późniejsze zmiany tych ustawień wykonuje się komendą `settings:set`. Hasło PostgreSQL i klucz API nie powinny być commitowane; `.env` jest ignorowany przez Git.

Jeżeli serwer PostgreSQL wymaga SSL, można dodać właściwy parametr `sslmode` do `WORKER_DATABASE_URL`, zgodnie z konfiguracją serwera.

## Instalacja i inicjalizacja

```bash
cd worker
npm install
npm run db:init
```

`db:init`:

1. łączy się z `WORKER_DATABASE_URL`,
2. tworzy tabele `worker_settings` i `worker_promotion_runs`, jeśli ich nie ma,
   oraz dodaje brakujące `backend_promotion_id`,
3. zapisuje brakujące ustawienia domyślne,
4. wypisuje aktualne ustawienia bez sekretów.

Operację można uruchamiać wielokrotnie - istniejące ustawienia nie są nadpisywane.

## Aktualizacja ze starego workera promocji

Przejście z wersji zapisującej `cena_po_promocji` wykonaj w oknie serwisowym:

1. zatrzymaj stary worker i jego harmonogram,
2. zatrzymaj backend,
3. wykonaj migracje backendu `002_promocje.sql`, a następnie
   `003_snapshot_ceny_wypozyczenia.sql`,
4. wdroż nowy backend i uruchom go,
5. wdroż nowy worker, wykonaj `npm run db:init` i dopiero potem uruchom worker.

Nie uruchamiaj starego workera po migracji `002` ani nowego workera przed
udostępnieniem endpointów `/promocje` przez backend.

## Ustawienia w PostgreSQL

Dostępne klucze:

- `cron_daily_promotion` - harmonogram w formacie cron,
- `timezone` - strefa czasowa IANA, np. `Europe/Warsaw`,
- `discount_min_percent` - minimalny całkowity rabat od 1 do 99,
- `discount_max_percent` - maksymalny całkowity rabat od 1 do 99.

Minimalny rabat nie może być większy od maksymalnego.

Wyświetlenie ustawień:

```bash
npm run settings:list
```

Zmiana ustawień:

```bash
npm run settings:set -- discount_min_percent 10
npm run settings:set -- discount_max_percent 20
npm run settings:set -- timezone Europe/Warsaw
npm run settings:set -- cron_daily_promotion "0 3 * * *"
```

Zmiana zakresu rabatu zostanie odczytana przy następnym wykonaniu zadania. Zmiana `cron_daily_promotion` albo `timezone` przez API przeładowuje harmonogram od razu. Po zmianie tych wartości komendą `settings:set` nadal należy zrestartować stale działający proces workera.

Ustawienie `DAILY_PROMOTION_ENABLED=false` wyłącza automatyczny harmonogram cron
po ponownym uruchomieniu workera. Ręczne uruchomienie przez `POST /runpromotion`
lub `npm run run:promotion` pozostaje dostępne. Zmiany harmonogramu zapisane przez
API nie uruchamiają crona, dopóki zmienna ma wartość `false`.

## API ustawień workera

API uruchamia się razem z `npm start`, domyślnie pod adresem `http://localhost:3001`. Oba endpointy wymagają nagłówka:

```http
Authorization: Bearer klucz
```

Pobranie aktualnych ustawień:

```http
GET /settings
```

Częściowa zmiana jednego lub kilku ustawień:

```http
PATCH /settings
Content-Type: application/json

{
  "cron_daily_promotion": "0 4 * * *",
  "timezone": "Europe/Warsaw",
  "discount_min_percent": 10,
  "discount_max_percent": 20
}
```

Można przekazać dowolny niepusty podzbiór czterech pól. API najpierw sprawdza cały wynikowy zestaw ustawień, a następnie zapisuje zmieniane wartości w jednej transakcji. Nieprawidłowy klucz zwraca `401`, nieprawidłowe ustawienia `400`, a nieobsługiwana metoda `405`.

Ręczne uruchomienie zadania promocji:

```http
POST /runpromotion
Authorization: Bearer klucz
```

Endpoint czeka na zakończenie zadania i zwraca status `success` lub `skipped`. Jeżeli promocja jest już wykonywana przez cron albo inne żądanie, zwraca `409` ze statusem `already_running`.

## Postman

Kolekcja `Worker API` i środowisko `Worker local` znajdują się w katalogu `postman/` i są automatycznie widoczne w Local View Postmana. Eksport kolekcji wykonywany przez Newman znajduje się w `worker/postman/`.

Uruchomienie testów Postmana na izolowanym serwerze Express, bez modyfikowania prawdziwych cen i bazy:

```bash
cd worker
npm run test:postman
```

## Historia zmian promocji

Każde wykonanie `daily-promotion` zapisuje w tabeli `worker_promotion_runs`:

- status `success`, `skipped` albo `error`,
- identyfikator i nazwę wybranego przedmiotu,
- starą cenę,
- nową cenę promocyjną,
- procent rabatu,
- komunikat błędu,
- datę i czas wykonania,
- datę i czas dezaktywacji udanej promocji.

Brak przedmiotów kwalifikujących się do promocji jest zapisywany ze statusem `skipped`. Błąd backendu, ceny lub inny błąd wykonania jest zapisywany ze statusem `error`.
Przed ustawieniem następnej promocji worker odczytuje z historii własne aktywne wpisy `success`. Dla każdego z nich pobiera aktualny stan przedmiotu i usuwa cenę promocyjną tylko wtedy, gdy jest ona równa cenie zapisanej wcześniej przez worker. Jeżeli przedmiot lub jego cena promocyjna zostały zmienione poza workerem, worker nie modyfikuje przedmiotu i zapisuje ostrzeżenie w logu. Przedmiot występujący w dowolnym wcześniejszym wpisie `success` jest wykluczony z kolejnych losowań. Worker nie wybiera również przedmiotów, które mają już ustawioną inną cenę promocyjną.

Wyświetlenie domyślnej liczby ostatnich wykonań (`HISTORY_DEFAULT_LIMIT`):

```bash
npm run history:list
```

Wyświetlenie innej liczby wpisów, od 1 do wartości `HISTORY_MAX_LIMIT`:

```bash
npm run history:list -- 25
```

## Uruchamianie

Jednorazowe ręczne wykonanie promocji:

```bash
npm run run:promotion
```

Uruchomienie harmonogramu:

```bash
npm start
```

Tryb developerski z automatycznym restartem po zmianie plików:

```bash
npm run dev
```

## Przebieg promocji

1. Worker pobiera z PostgreSQL zakres rabatu.
2. Pobiera z historii własne aktywne wpisy `success`.
3. Dla każdego wpisu z `backend_promotion_id` wysyła `PATCH /promocje/:id`:

```json
{
  "aktywna": false
}
```

4. Wpisy starego formatu bez ID oznacza jako nieaktywne bez zmiany backendu.
5. Oznacza obsłużone wpisy historii czasem `deactivated_at`.
6. Pobiera wszystkie strony dostępnych przedmiotów przez `GET /items`.
7. Wyklucza ostatnio promowany przedmiot i sprzęty z aktywną promocją.
8. Losuje przedmiot i rabat z zapisanego zakresu, domyślnie 10-20%.
9. Wysyła `POST /promocje` z promocją procentową dla wybranego sprzętu:

```json
{
  "nazwa": "Promocja dnia: Wiertarka",
  "typ": "procentowa",
  "wartosc": 20,
  "aktywna": true,
  "zakres_sprzetow": {
    "kategorie_ids": [],
    "wszystkie": false,
    "sprzety_ids": [15]
  },
  "zakres_uzytkownikow": {
    "wszyscy": true,
    "uzytkownicy_ids": []
  }
}
```

10. Loguje wybrany przedmiot, starą cenę, rabat, nową cenę i błędy.
11. Zapisuje wynik oraz `backend_promotion_id` w `worker_promotion_runs`.

Worker obsługuje brak przedmiotów, brak lub nieprawidłową cenę, timeout backendu, odpowiedzi HTTP inne niż 2xx, błędne ustawienia, błąd PostgreSQL oraz brak wymaganych zmiennych środowiskowych.
