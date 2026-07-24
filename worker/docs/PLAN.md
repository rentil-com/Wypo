1. Ustalić, że terminy wypożyczeń są podawane w strefie `Europe/Warsaw`.
2. Preferowane rozwiązanie: zmigrować `data_od` i `data_do` do `TIMESTAMPTZ`,
   interpretując istniejące wartości jako `Europe/Warsaw`.
3. W API przesyłać daty jako ISO 8601 z offsetem albo `Z`.
4. W bazach i kluczach wystąpień używać UTC.
5. Strefy `TZ` używać tylko do crona oraz biznesowego podziału przypomnień
   przeterminowanych na doby.
6. Dodać testy przejścia na czas letni i zimowy.

Nie należy opierać wysyłki na porównywaniu samych dat kalendarzowych.

## 8. Retry, odporność i obserwowalność

- Pierwsza próba następuje po `due_at`.
- Kolejne próby: przykładowo po 1, 5, 15, 60 i 240 minutach z jitterem.
- Po przekroczeniu `notification_max_attempts` rekord otrzymuje `failed`.
- Po restarcie zadania z wygasłą blokadą `locked_until` wracają do kolejki.
- Nieudany skan kandydatów nie zmienia istniejących zadań.
- Każdy przebieg loguje podsumowanie i czas trwania.
- Log pojedynczego zadania zawiera typ, ID wypożyczenia, numer próby i wynik,
  ale nie zawiera danych osobowych.
- Historia powinna być dostępna przez komendę CLI, a później opcjonalnie przez
  chroniony endpoint administratora.

## 9. Testy

### Testy jednostkowe workera

- wyliczanie terminów dla wszystkich trzech typów,
- granice przedziałów skanowania bez luk i podwójnego zakolejkowania,
- deterministyczne `occurrence_key` i `idempotency_key`,
- zmiana terminu wypożyczenia,
- limit siedmiu przypomnień przeterminowanych,
- klasyfikacja odpowiedzi HTTP,
- backoff i przekroczenie limitu prób,
- blokada równoległych uruchomień,
- poprawne działanie przy zmianie czasu.

### Testy repozytorium

- unikalność wystąpień,
- atomowe przejęcie paczki,
- brak podwójnego przejęcia przez dwie instancje,
- odzyskanie zadania po wygaśnięciu blokady,
- przejścia wszystkich statusów.

### Testy backendu

- endpoint kandydatów filtruje statusy i przedziały oraz paginuje wyniki,
- powtórzony `Idempotency-Key` nie wysyła drugiego e-maila,
- zmieniony lub zwrócony wynajem daje `skipped`,
- błąd SMTP może zostać ponowiony tym samym kluczem,
- brak lub niepoprawny klucz API jest odrzucany,
- użytkownik bez roli administratora nie może wywołać endpointów workera.

### Test integracyjny

Uruchomić backend i worker z testową bazą oraz atrapą SMTP, następnie sprawdzić:

1. wykrycie trzech typów kandydatów,
2. zapis historii po wysłaniu,
3. brak duplikatu po ponownym skanie,
4. retry po timeoutcie backendu,
5. pominięcie po zwrocie wypożyczenia,
6. wznowienie przetwarzania po restarcie workera.

Uzupełnić kolekcje Postmana o ręczne uruchomienie i ustawienia powiadomień.

## 10. Kolejność wdrożenia

1. Uzgodnić reguły czasowe, limit przypomnień i interpretację dat.
2. Dodać migrację oraz idempotencję w backendzie.
3. Dodać endpoint kandydatów i ujednolicić odpowiedzi endpointów wysyłających.
4. Dodać testy kontraktu backendu.
5. Dodać migrację, repozytorium i ustawienia workera.
6. Rozszerzyć `BackendClient`.
7. Zaimplementować zadanie, retry i harmonogram.
8. Dodać ręczne uruchomienie, CLI, testy i dokumentację.
9. Wdrożyć backend przed workerem.
10. Uruchomić worker z `NOTIFICATIONS_ENABLED=false` i wykonać skan próbny bez
    wysyłki.
11. Włączyć kolejno `pickup`, `return`, a na końcu `overdue`, obserwując historię
    i liczbę błędów.

Wycofanie funkcji polega na ustawieniu `NOTIFICATIONS_ENABLED=false`. Zapisane
zadania i historia pozostają w bazie do diagnostyki i mogą zostać wznowione po
ponownym włączeniu.

## 11. Kryteria akceptacji

- Każdy kwalifikujący się wynajem otrzymuje przypomnienie w skonfigurowanym
  terminie.
- Powtórny skan, restart procesu i równoległe uruchomienie nie powodują zwykłych
  duplikatów.
- Zwrócone, odrzucone i zaktualizowane wypożyczenia nie otrzymują nieaktualnych
  wiadomości.
- Błędy przejściowe są ponawiane, a trwałe są widoczne w historii.
- Administrator może zmienić harmonogram i ręcznie uruchomić zadanie.
- Worker nie ma bezpośredniego dostępu do bazy backendu ani danych SMTP.
- Testy obejmują reguły czasowe, idempotencję, retry, współbieżność i restart.
- Dokumentacja opisuje konfigurację, endpointy, migracje, uruchomienie i
  procedurę wyłączenia funkcji.

## 12. Rozszerzenie po MVP

Po ustabilizowaniu wysyłki e-mail można wykorzystać tę samą tabelę
`powiadomienia` do powiadomień w aplikacji:

- `GET /powiadomienia` z paginacją,
- `PATCH /powiadomienia/:id/przeczytane`,
- `PATCH /powiadomienia/przeczytaj-wszystkie`,
- licznik nieprzeczytanych,
- preferencje kanałów użytkownika,
- powiadomienia administratora o trwale nieudanych wysyłkach.

Nie jest to wymagane do uruchomienia automatycznych przypomnień e-mail w MVP.