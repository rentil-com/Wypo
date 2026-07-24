# Endpointy backendu wypożyczalni

Domyślny adres lokalny: `http://localhost:3000`.

Autoryzacja użytkowników działa przez cookie `session_id`. Worker może zamiast
cookie przekazywać klucz API w nagłówku `Authorization: Bearer <token>`.
Endpointy wymagające zalogowania zwracają `401`, gdy uwierzytelnienie jest
niepoprawne. Endpointy administracyjne zwracają `403`, gdy konto nie ma roli `admin`.

## Statusy w systemie

### Role kont

* `uzytkownik`
* `admin`

### Statusy sprzętu

* `dostepny` - sprzęt można wypożyczyć
* `wypozyczony` - sprzęt jest w aktywnym wypożyczeniu
* `w_naprawie` - sprzęt jest niedostępny z powodu naprawy

### Statusy wypożyczeń

* `oczekujacy` - użytkownik złożył wniosek
* `zaakceptowany` - admin zaakceptował wniosek, ale sprzęt nie jest jeszcze wydany
* `odrzucony` - admin odrzucił wniosek
* `aktywny` - wypożyczenie zostało aktywowane, sprzęt ma status `wypozyczony`
* `zwrocony` - użytkownik zwrócił sprzęt, sprzęt wraca na `dostepny`

### Statusy recenzji

* `aktywna` - recenzja jest widoczna publicznie
* `ukryta` - recenzja została ukryta przez administratora
* `usunieta` - recenzja została usunięta logicznie

## Główne endpointy

### `GET /`

Zwraca status API, połączenia z bazą danych i dostępu do skonfigurowanego
bucketa S3.

Sprawdzenia bazy i S3 są wykonywane równolegle. Każde z nich ma limit 2,5
sekundy. S3 jest sprawdzane przez operację `HeadBucket`, która nie zapisuje ani
nie usuwa obiektów.

Gdy baza i S3 działają poprawnie, endpoint zwraca `200`:

```json
{
  "api": "ok",
  "database": "ok",
  "s3": "ok"
}
```

Jeśli połączenie z bazą albo S3 zakończy się błędem lub przekroczy limit czasu,
endpoint zwraca `503`. Pola `database` i `s3` niezależnie wskazują stan każdej
usługi jako `"ok"` albo `"zle"`, na przykład:

```json
{
  "api": "ok",
  "database": "ok",
  "s3": "zle"
}
```

## Autoryzacja

### `POST /auth/login`

Sprawdza email i hasło użytkownika oraz rozpoczyna logowanie.

Body:

```json
{
  "email": "admin@example.com",
  "password": "haslo"
}
```

Odpowiedź `200` dla logowania bez 2FA oraz odpowiedź `200` z `/auth/2fa` zawierają:

* `message`
* `user.id`
* `user.email`
* `user.rola`

Jeśli użytkownik nie ma włączonego 2FA, endpoint zwraca `200`, tworzy sesję i ustawia cookie `session_id`.

Jeśli użytkownik ma włączone 2FA, endpoint nie tworzy jeszcze sesji. Wysyła sześciocyfrowy kod na adres e-mail i zwraca `202`:

```json
{
  "message": "Wyslano kod 2FA.",
  "requires_2fa": true,
  "challenge": "64-znakowy-token",
  "expires_in": 600,
  "max_attempts": 5
}
```

### Uwierzytelnianie kluczem API

Klucz API nie tworzy sesji. Worker musi dołączyć go do każdego żądania:

```http
Authorization: Bearer wypo_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

Nie są obsługiwane tokeny w body, query string ani innych nagłówkach. Poprawny
Bearer daje takie same uprawnienia jak konto administratora, do którego należy.
Przy każdym żądaniu backend ponownie sprawdza, czy konto nadal ma rolę `admin`,
ma wyłączone 2FA i czy klucz nadal jest aktywny. Udane użycie aktualizuje
`last_used_at`.

Nieprawidłowy lub unieważniony Bearer nie uwierzytelnia żądania.

### `GET /auth/api-key`

Wymaga zalogowanego administratora. Zwraca stan klucza aktualnego konta bez
ujawniania jego wartości:

```json
{
  "active": true,
  "can_generate": true,
  "created_at": "2026-07-20T10:00:00.000Z",
  "last_used_at": null
}
```

### `POST /auth/api-key`

Wymaga zalogowanego administratora. Generuje pierwszy klucz albo zastępuje
poprzedni. Konto może mieć tylko jeden aktywny klucz.

Jawna wartość w polu `api_key` jest zwracana tylko raz. Backend przechowuje
wyłącznie hash klucza. Regeneracja natychmiast unieważnia poprzedni klucz.

Klucz można wygenerować również na koncie z włączonym 2FA.

### `DELETE /auth/api-key`

Wymaga zalogowanego administratora. Unieważnia klucz aktualnego konta.

### `POST /auth/register-confirm`

Potwierdza kod wysłany przez `POST /account/create`. Dopiero ten endpoint tworzy rekord użytkownika.

Body:

```json
{
  "email": "jan@example.com",
  "code": "123456"
}
```

Zamiast `code` można użyć pola `kod`. Kod jest ważny 15 minut i pozwala na maksymalnie 5 prób.

### `POST /auth/2fa`

Kończy logowanie użytkownika z włączonym 2FA. Dopiero po poprawnym kodzie tworzy sesję i ustawia cookie `session_id`.

Body:

```json
{
  "challenge": "token-z-odpowiedzi-login",
  "code": "123456"
}
```

Zamiast `challenge` i `code` można użyć pól `wyzwanie` i `kod`. Kod jest ważny 10 minut i pozwala na maksymalnie 5 prób.

### `POST /auth/2fa/enable`

Włączenie 2FA automatycznie unieważnia klucz API konta. Pole `api_key_revoked`
w odpowiedzi informuje, czy aktywny klucz został usunięty.

Wymaga logowania. Włącza e-mailowe 2FA dla aktualnego użytkownika i wysyła powiadomienie o zmianie.

### `POST /auth/2fa/disable`

Wymaga logowania. Wyłącza 2FA, usuwa oczekujące wyzwanie logowania i wysyła powiadomienie o zmianie.

### `POST /auth/logout`

Wylogowuje użytkownika, usuwa sesję z bazy i czyści cookie `session_id`.

### `POST /auth/password-reset`

Publiczny endpoint rozpoczynający reset hasła. Niezależnie od tego, czy konto istnieje, zwraca ogólny komunikat, aby nie ujawniać adresów zapisanych w bazie.

Body:

```json
{
  "email": "jan@example.com"
}
```

Jeśli konto istnieje, na jego adres zostaje wysłany sześciocyfrowy kod. Odpowiedź `202` zawiera:

```json
{
  "message": "Jesli konto istnieje, wyslano kod resetu hasla.",
  "challenge": "64-znakowy-token",
  "expires_in": 900,
  "max_attempts": 5
}
```

### `POST /auth/password-reset/confirm`

Potwierdza reset hasła i ustawia nowe hasło.

Body:

```json
{
  "challenge": "token-z-odpowiedzi-password-reset",
  "code": "123456",
  "password": "NoweHaslo!"
}
```

Zamiast `challenge`, `code` i `password` można użyć pól `wyzwanie`, `kod` i `haslo`. Kod jest ważny 15 minut i pozwala na maksymalnie 5 prób. Nowe hasło musi mieć co najmniej 8 znaków, dużą literę, małą literę i znak specjalny.

Po poprawnej zmianie backend:

* usuwa wykorzystane żądanie resetu
* usuwa oczekującą zmianę adresu e-mail
* usuwa oczekujące wyzwanie 2FA
* unieważnia aktywny klucz API
* kończy wszystkie sesje użytkownika i czyści cookie
* wysyła powiadomienie o zmianie hasła

## Konta

### `POST /account/create`

Rozpoczyna rejestrację: zapisuje dane oczekującej rejestracji i wysyła sześciocyfrowy kod e-mail. Konto nie jest jeszcze tworzone.

Body:

```json
{
  "imie": "Jan",
  "nazwisko": "Kowalski",
  "email": "jan@example.com",
  "password": "Minimum8!"
}
```

Zamiast `password` można użyć pola `haslo`.

### `POST /account/email-change`

Wymaga logowania i podania aktualnego hasła. Rozpoczyna zmianę adresu e-mail oraz wysyła kod potwierdzający na nowy adres.

Body:

```json
{
  "new_email": "jan.nowak@example.com",
  "password": "AktualneHaslo!"
}
```

Zamiast `new_email` można użyć `nowy_email` albo `email`. Zamiast `password` można użyć `haslo`.

Odpowiedź `202`:

```json
{
  "message": "Wyslano kod potwierdzajacy na nowy adres e-mail.",
  "challenge": "64-znakowy-token",
  "expires_in": 900,
  "max_attempts": 5
}
```

### `POST /account/email-change/confirm`

Wymaga logowania. Potwierdza kod wysłany na nowy adres e-mail.

Body:

```json
{
  "challenge": "token-z-odpowiedzi-email-change",
  "code": "123456"
}
```

Zamiast `challenge` i `code` można użyć pól `wyzwanie` i `kod`. Kod jest ważny 15 minut i pozwala na maksymalnie 5 prób.

Po poprawnej zmianie backend:

* pozostawia aktywną bieżącą sesję, ale kończy pozostałe sesje użytkownika
* usuwa oczekujący reset hasła i wyzwanie 2FA
* wysyła powiadomienie na poprzedni adres e-mail

### `GET /account/details`

Wymaga logowania.

Zwraca dane aktualnie zalogowanego użytkownika.

### `GET /account/details/all`

Admin only.

Zwraca paginowaną listę kont.

Query parametry:

* `strona`
* `imie`
* `nazwisko`
* `email`
* `rola` - `uzytkownik` albo `admin`

### `GET /account/details/:id`

Wymaga logowania.

Zwykły użytkownik może pobrać tylko swoje konto. Admin może pobrać dowolne konto i dodatkowo używać filtrów z listy kont.

### `PATCH /account/edit/:id`

### `PUT /account/edit/:id`

Wymaga logowania.

Zwykły użytkownik może edytować tylko swoje imię, nazwisko i hasło. Adres e-mail zmienia przez `POST /account/email-change`. Admin może edytować inne konta, bezpośrednio zmieniać ich adresy e-mail oraz zmieniać rolę, ale nie może zmienić własnej roli.

Body może zawierać:

```json
{
  "imie": "Jan",
  "nazwisko": "Nowak",
  "email": "jan.nowak@example.com",
  "password": "nowehaslo",
  "rola": "admin"
}
```

Zamiast `password` można użyć pola `haslo`.

### `DELETE /account/delete/:id`

Wymaga logowania.

Zwykły użytkownik może usunąć tylko swoje konto. Admin może usunąć inne konto, ale nie może usunąć własnego konta.

Jeśli konto ma przypisane wypożyczenia, endpoint zwraca `409`.

## Kategorie

### `GET /kategorie`

Zwraca listę kategorii z licznikami sprzętu.

Query parametry:

* `nazwa` - filtr po nazwie kategorii

Zwracane pola:

* `id`
* `nazwa`
* `zdjecie_url`
* `liczba_sprzetow`
* `liczba_dostepnych_sprzetow`

### `GET /kategorie/:id`

Zwraca jedną kategorię z licznikami sprzętu.

### `POST /kategorie/dodaj`

Admin only.

Dodaje kategorię.

Body JSON:

```json
{
  "nazwa": "Elektronarzędzia",
  "zdjecie_url": "https://example.com/kategoria.jpg"
}
```

`zdjecie_url` jest opcjonalne.

Można też wysłać `multipart/form-data` z polami:

* `nazwa`
* `zdjecie` - opcjonalny plik obrazu
* `zdjecie_url` - opcjonalny URL obrazu

Jeśli podane są jednocześnie `zdjecie` i `zdjecie_url`, użyty zostanie plik `zdjecie`.

### `PATCH /kategorie/edit/:id`

### `PUT /kategorie/edit/:id`

Admin only.

Edytuje kategorię.

Można wysłać JSON:

```json
{
  "nazwa": "Nowa nazwa",
  "zdjecie_url": "https://example.com/nowe.jpg"
}
```

Można też wysłać `multipart/form-data` z plikiem `zdjecie`.

### `DELETE /kategorie/usun/:id`

Admin only.

Usuwa kategorię. Jeśli do kategorii jest przypisany sprzęt, endpoint zwraca `409`.

### `GET /kategorie/usun`

Admin only.

Zwraca listę ID kategorii, które można usunąć, czyli takich, do których nie
jest przypisany żaden sprzęt ani promocja.

## Sprzęt

### `GET /items/search`

Wyszukuje sprzęt po fragmencie nazwy i zwraca maksymalnie 5 wyników. Parametr
`q` zawiera wyszukiwany tekst, np. `GET /items/search?q=lapto`. Dla zgodności
obsługiwane są również parametry `search` i `nazwa`. Brak tekstu wyszukiwania
zwraca pustą tablicę.

Każdy wynik zawiera pola:

* `nazwa_przedmiotu`
* `zdjecie_url`
* `cena`
* `cena_aktualna`
* `czy_promocja`
* `promocja`

`cena` jest cena bazowa za jeden dzien, a `cena_aktualna` cena po
zastosowaniu najlepszej promocji dostepnej dla aktualnej sesji. Pole
`promocja` ma wartosc `null` albo zawiera wylacznie `id`, `nazwa`, `typ`,
`wartosc` i `data_do`. Promocje przypisane do konta nie sa naliczane ani
ujawniane gosciom lub innym uzytkownikom.
Przykladowy fragment odpowiedzi:

```json
{
  "cena": 49.99,
  "cena_aktualna": 39.99,
  "czy_promocja": true,
  "promocja": {
    "id": 8,
    "nazwa": "Weekend z elektronarzedziami",
    "typ": "procentowa",
    "wartosc": 20,
    "data_do": "2026-08-04T00:00:00.000Z"
  }
}
```

### `GET /items`

Zwraca paginowaną listę sprzętów.

Query parametry:

* `strona`
* `kategoria`
* `status`
* `nazwa`
* `cena_od` albo `cena_min`
* `cena_do` albo `cena_max`
* `promocja` albo `tylko_promocje`

Filtry ceny i `tylko_promocje` dzialaja na `cena_aktualna` wyliczonej dla
aktualnej sesji. Lista, wyszukiwarka i szczegoly korzystaja z tego samego
selektora promocji i nie sumuja rabatow.

Dla admina zwracany jest rzeczywisty status sprzętu. Dla zwykłego użytkownika status inny niż `dostepny` jest mapowany na `niedostepny`.

Lista nie zawiera pola `specyfikacje`. Specyfikacje sprzętu można pobrać przez `GET /items/:id`.

### `GET /items/:id`

Zwraca szczegóły jednego sprzętu.

Dla admina zwracany jest rzeczywisty status sprzętu. Dla zwykłego użytkownika status inny niż `dostepny` jest mapowany na `niedostepny`.

Odpowiedź zawiera pole `specyfikacje`, czyli tablicę obiektów z polami `id`, `nazwa_specyfikacji`, `opis_specyfikacji` i `emotka_specyfikacji`.

### `POST /items/dodaj`

Admin only.

Dodaje sprzęt.

Body JSON albo `multipart/form-data`:

```json
{
  "nazwa": "Wiertarka",
  "opis": "Wiertarka udarowa",
  "kategoria_id": 1,
  "zdjecia_url": {
    "1": "https://example.com/wiertarka.jpg",
    "2": "https://example.com/wiertarka-2.jpg"
  },
  "specyfikacje": [
    {
      "nazwa_specyfikacji": "Procesor",
      "opis_specyfikacji": "Intel Core i5",
      "emotka_specyfikacji": "cpu.fill"
    }
  ],
  "cena": "49.99",
  "status": "dostepny"
}
```

W `multipart/form-data` można wysłać pliki `zdjecia`. Pojedynczy plik `zdjecie` też jest obsługiwany.

Wymagane pola:

* `nazwa`
* `kategoria_id`
* `cena`

Opcjonalne pola:

* `opis`
* `zdjecia_url`
* `specyfikacje`
* `status`

### `PATCH /items/edit/:id`

### `PUT /items/edit/:id`

Admin only.

Edytuje sprzęt. Można zmieniać:

* `nazwa`
* `opis`
* `kategoria_id`
* `status`
* `cena`
* `specyfikacje` - wysłana tablica zastępuje całą listę specyfikacji sprzętu

Zdjęć nie można zmieniać przez `edit/:id`. Do tego służą osobne endpointy poniżej.

### `POST /items/add_photos/:id`

Admin only.

Dodaje zdjęcia do sprzętu.

Format URL, body JSON:

```json
{
  "zdjecia_url": [
    "https://url1",
    "https://url2"
  ]
}
```

Format plików, `multipart/form-data`:

* `zdjecie`: `plik1.png`
* `zdjecie`: `plik2.png`

Można też połączyć oba formaty w jednym `multipart/form-data`: wysłać kilka plików `zdjecie` oraz pole `zdjecia_url` jako JSON string z tablicą URL-i. Zdjęcia są dopisywane do kolejnych wolnych numerów.

### `DELETE /items/delete_photos/:id`

Admin only.

Usuwa zdjęcia ze sprzętu.

Body JSON:

```json
{
  "zdjecia": [1, 2]
}
```

Można też przekazać `zdjecia_url` jako obiekt; wtedy usuwane są zdjęcia o podanych kluczach.

### `DELETE /items/usun/:id`

Admin only.

Usuwa sprzęt. Jeśli do sprzętu jest przypisane wypożyczenie, endpoint zwraca `409`.

### `GET /items/usun`

Admin only.

Zwraca listę ID sprzętów, które można usunąć, czyli takich, które nie mają
żadnego wypożyczenia ani przypisania do promocji.

## Promocje

Endpoint losowania wlasnej promocji wymaga dowolnego zalogowanego konta.
Pozostale endpointy w tej sekcji wymagaja zalogowanego administratora.
Uwierzytelnienie administratora moze pochodzic z sesji albo klucza API.

### `POST /promocje/losuj-dzienna-promocje`

Wymaga zalogowania. Losuje dla aktualnego uzytkownika indywidualna promocje
procentowa obejmujaca wszystkie sprzety. Endpoint nie przyjmuje body. Poprawna
odpowiedz ma status `201` i zawiera pelny obiekt promocji, termin kolejnego
losowania oraz ID zastapionej promocji (dla zwyklego losowania `null`).

```json
{
  "promocja": {
    "id": 41,
    "typ": "procentowa",
    "wartosc": 15,
    "data_od": "2026-07-24T10:00:00.000Z",
    "data_do": "2026-07-25T10:00:00.000Z"
  },
  "ponowne_losowanie_od": "2026-07-25T10:00:00.000Z",
  "zastapiona_promocja_id": null
}
```

Jesli poprzednia dzienna promocja nadal trwa, endpoint nie tworzy kolejnego
rekordu i zwraca `409` razem z aktualna promocja i polem
`ponowne_losowanie_od`. Po uplywie `data_do` to samo wywolanie tworzy nastepna
promocje. Losowanie jest wykonywane w transakcji z blokada rekordu uzytkownika,
wiec rownolegle zadania nie utworza dwoch aktywnych promocji.

### `POST /promocje/losuj-dzienna-promocja/:id`

Admin only. Parametr `:id` jest ID uzytkownika, a nie ID promocji. Endpoint
wymusza reset: wylacza jego trwajaca dzienna promocje i od razu losuje nowa.
Poprawna odpowiedz ma status `201`, taki sam format jak endpoint uzytkownika i
zwraca ID wylaczonej promocji w `zastapiona_promocja_id`. Nieprawidlowe ID
zwraca `400`, a brak uzytkownika `404`.

### Konfiguracja dziennej promocji

Modyfikowalne parametry znajduja sie w env:

* `DZIENNA_PROMOCJA_WAZNOSC_GODZIN` - czas waznosci, domyslnie `24`.
* `DZIENNA_PROMOCJA_RABATY_PROCENTOWE` - lista losowanych rabatow oddzielonych
  przecinkami, domyslnie `5,10,15,20,25`; ulamek zapisuje sie z kropka.
* `DZIENNA_PROMOCJA_NAZWA` - nazwa promocji, maksymalnie 100 znakow.
* `DZIENNA_PROMOCJA_OPIS` - opis promocji; pusta wartosc zapisuje `null`.

Dzienne promocje korzystaja wylacznie z istniejacych tabel `promocje` i
`promocje_uzytkownicy`. Rekord ma `obejmuje_wszystkie_sprzety = true`,
`obejmuje_wszystkich_uzytkownikow = false` i jedno przypisanie do konta, dla
ktorego zostal wylosowany.

### `POST /promocje`

Tworzy promocje i wszystkie jej przypisania w jednej transakcji. Pole
`utworzona_przez` jest pobierane z uwierzytelnienia i nie jest przyjmowane w
body. Poprawna odpowiedz ma status `201`.

```json
{
  "nazwa": "Weekend z elektronarzedziami",
  "opis": "20% rabatu dla wybranych klientow",
  "typ": "procentowa",
  "wartosc": 20,
  "aktywna": true,
  "data_od": "2026-08-01T00:00:00+02:00",
  "data_do": "2026-08-04T00:00:00+02:00",
  "zakres_sprzetow": {
    "wszystkie": false,
    "kategorie_ids": [2],
    "sprzety_ids": [15, 16]
  },
  "zakres_uzytkownikow": {
    "wszyscy": false,
    "uzytkownicy_ids": [10, 25, 31]
  }
}
```

`typ` przyjmuje `procentowa` albo `kwotowa`. `wartosc` musi byc dodatnia, a
dla typu procentowego nie moze przekraczac 100. `data_do` moze byc `null`,
ale jesli jest podana, musi byc pozniejsza od `data_od`.

Dla zakresu sprzetow `wszystkie: true` wymaga pustych list. Gdy
`wszystkie: false`, trzeba wskazac co najmniej jedna kategorie albo jeden
sprzet. Analogicznie `wszyscy: true` wymaga pustej listy uzytkownikow, a
`wszyscy: false` co najmniej jednego konta. Duplikaty ID sa usuwane, natomiast
nieistniejace ID zwracaja `404`.

### `GET /promocje`

Zwraca paginowana liste promocji, maksymalnie 20 rekordow na strone.
Obslugiwane query parametry:

* `strona`
* `nazwa`
* `typ` - `procentowa` albo `kwotowa`
* `stan` - `zaplanowana`, `aktywna`, `wygasla` albo `wylaczona`
* `sprzet_id`
* `kategoria_id`
* `uzytkownik_id`

Odpowiedz zawiera `strona`, `limitPromocjiNaStrone`, `filtry`, `total`,
`liczbaStron` i tablice `dane`. Stan jest wyliczany na podstawie flagi
`aktywna` oraz aktualnego czasu.

### `GET /promocje/:id`

Zwraca pelny zapis promocji razem z `zakres_sprzetow` i
`zakres_uzytkownikow`. Nieistniejacy rekord zwraca `404`.

### `PATCH /promocje/:id`

Aktualizuje tylko przekazane pola. Rekord jest blokowany przez
`SELECT ... FOR UPDATE`. Przekazanie `zakres_sprzetow` albo
`zakres_uzytkownikow` zastepuje caly odpowiedni zakres w tej samej
transakcji. Promocje wylacza sie przez:

```json
{
  "aktywna": false
}
```

API nie udostepnia trwalego usuwania promocji.

## Ulubione

### `POST /ulubione/polub/:id`

Wymaga logowania.

Dodaje sprzęt do ulubionych użytkownika. Parametr `:id` to ID sprzętu.

Jeśli sprzęt był już polubiony, endpoint nadal zwraca `polubione: true`.

### `DELETE /ulubione/odlub/:id`

Wymaga logowania.

Usuwa sprzęt z ulubionych użytkownika. Parametr `:id` to ID sprzętu.

### `GET /ulubione`

Wymaga logowania.

Zwraca listę ID sprzętów polubionych przez aktualnie zalogowanego użytkownika.

### `GET /ulubione/:id`

Admin only.

Zwraca listę ID sprzętów polubionych przez użytkownika o podanym ID konta.

## Wypożyczenia

### `POST /wypozyczenia/wypozycz`

Wymaga logowania.

Tworzy wniosek o wypożyczenie. Nowe wypożyczenie dostaje status `oczekujacy`.

Body:

```json
{
  "sprzet_id": 1,
  "data_od": "2026-07-10T10:00:00.000Z",
  "data_do": "2026-07-12T10:00:00.000Z"
}
```

Warunki:

* sprzęt musi istnieć
* sprzęt musi mieć status `dostepny`
* `data_do` nie może być wcześniejsza niż `data_od`

Cena sprzetu oznacza cene za jeden dzien. Podczas tworzenia wniosku backend
wybiera najlepsza promocje dla aktualnej sesji i zapisuje niezmienny snapshot:

* `cena_bazowa`
* `cena_koncowa`
* `promocja_id`
* `promocja` - `null` albo obiekt snapshotu z `id`, `nazwa`, `typ` i `wartosc`

Klient nie moze przeslac ceny koncowej ani ID promocji. Pozniejsza edycja,
wylaczenie lub usuniecie promocji nie przelicza zapisanego wypozyczenia.
Pola snapshotu sa zwracane przez utworzenie, liste, szczegoly i endpointy
aktualizujace wypozyczenie.

### `GET /wypozyczenia/wnioski`

Admin only.

Zwraca paginowaną listę wszystkich wypożyczeń, niezależnie od statusu. Dostępne statusy:

* `oczekujacy`
* `zaakceptowany`
* `odrzucony`
* `aktywny`
* `zwrocony`

Query parametry:

* `strona` - numer strony, domyślnie `1`
* `uzytkownik_id` - filtr po ID użytkownika
* `sprzet_id` - filtr po ID sprzętu
* `status` - filtr po statusie: `oczekujacy`, `zaakceptowany`, `odrzucony`, `aktywny` albo `zwrocony`
* `data` - filtr po dniu, który wpada w zakres `data_od` - `data_do`

Bez filtrów endpoint zwraca wszystkie wypożyczenia, także aktywne i zwrócone.

Endpoint zwraca maksymalnie 10 rekordów na stronę.

Odpowiedź zawiera:

* `strona`
* `limitWnioskowNaStrone`
* `filtry`
* `total`
* `liczbaStron`
* `dane`

### `GET /wypozyczenia/wnioski/:id`

Admin only.

Zwraca jedno wypożyczenie po ID, niezależnie od statusu.

### `PATCH /wypozyczenia/wnioski/:id`

### `POST /wypozyczenia/wnioski/:id`

Admin only.

Zarządza wnioskiem. Działa tylko dla wypożyczenia ze statusem `oczekujacy`.

Body:

```json
{
  "decyzja": "zaakceptowany"
}
```

albo:

```json
{
  "status": "odrzucony"
}
```

Dozwolone decyzje:

* `zaakceptowany`
* `odrzucony`

Akceptacja wniosku nie zmienia statusu sprzętu na `wypozyczony`. Sprzęt zostaje wypożyczony dopiero po aktywacji.

### `PATCH /wypozyczenia/aktywuj/:id`

### `POST /wypozyczenia/aktywuj/:id`

Admin only.

Aktywuje wypożyczenie. Działa tylko dla wypożyczenia ze statusem `zaakceptowany`.

Efekt:

* status wypożyczenia zmienia się na `aktywny`
* status sprzętu zmienia się na `wypozyczony`
* inne oczekujące albo zaakceptowane wnioski dla tego samego sprzętu są automatycznie odrzucane, jeśli ich daty kolidują z aktywowanym wypożyczeniem

Błędy:

* `409` - wypożyczenie nie jest w statusie `zaakceptowany`
* `409` - sprzęt jest już wypożyczony
* `409` - sprzęt nie jest dostępny
* `409` - wniosek został automatycznie odrzucony, bo jego daty kolidują z już aktywnym wypożyczeniem

### `PATCH /wypozyczenia/zwrot/:id`

### `POST /wypozyczenia/zwrot/:id`

Wymaga logowania.

Użytkownik może zwrócić swoje wypożyczenie. Admin może zwrócić dowolne wypożyczenie.

Działa tylko dla wypożyczenia ze statusem `aktywny`.

Efekt w jednej transakcji:

* status wypożyczenia zmienia się na `zwrocony`
* `data_zwrotu_rzeczywista` ustawiana jest na aktualny czas
* status sprzętu wraca na `dostepny`

### `POST /wypozyczenia/przypomnienie-odbioru/:id`

Admin only.

Wysyla mailowe przypomnienie o odbiorze sprzetu. Dziala tylko dla wypozyczenia ze statusem `zaakceptowany`.

Opcjonalne body:

```json
{
  "miejsce_odbioru": "Punkt wypozyczalni, ul. Przykladowa 1",
  "godziny_odbioru": "9:00-17:00"
}
```

Jesli pola nie zostana podane, backend uzywa `MAIL_PICKUP_LOCATION` i `MAIL_PICKUP_HOURS`.

### `POST /wypozyczenia/przypomnienie-zwrotu/:id`

Admin only.

Wysyla mailowe przypomnienie o zblizajacym sie zwrocie sprzetu. Dziala tylko dla wypozyczenia ze statusem `aktywny`, ktore nie jest jeszcze po terminie.

Opcjonalne body:

```json
{
  "miejsce_zwrotu": "Punkt wypozyczalni, ul. Przykladowa 1"
}
```

Jesli pole nie zostanie podane, backend uzywa `MAIL_RETURN_LOCATION`.

### `POST /wypozyczenia/przeterminowany-zwrot/:id`

Admin only.

Wysyla mailowa informacje o przeterminowanym zwrocie. Dziala tylko dla aktywnego wypozyczenia, ktorego `data_do` jest w przeszlosci.

Opcjonalne body:

```json
{
  "kontakt": "kontakt@example.com"
}
```

Jesli pole nie zostanie podane, backend uzywa `MAIL_CONTACT`.
### `PATCH /wypozyczenia/edytuj/:id`

### `PUT /wypozyczenia/edytuj/:id`

Admin only.

Ręcznie edytuje wypożyczenie.

Body może zawierać:

```json
{
  "data_od": "2026-07-10T10:00:00.000Z",
  "data_do": "2026-07-12T10:00:00.000Z",
  "status": "aktywny",
  "data_zwrotu_rzeczywista": null
}
```

`sprzet_id` i `uzytkownik_id` sa niezmienne po utworzeniu wypozyczenia.
Zapobiega to przypisaniu historycznego snapshotu ceny i promocji do innego
sprzetu albo uzytkownika.

Dozwolone statusy:

* `oczekujacy`
* `zaakceptowany`
* `odrzucony`
* `aktywny`
* `zwrocony`

Jeśli ręczna edycja ustawi status `aktywny`, endpoint sprawdza dostępność sprzętu i ustawia jego status na `wypozyczony`.

Jeśli ręczna edycja zdejmie status blokujący sprzęt, endpoint odświeża status sprzętu.

## Recenzje

Endpointy recenzji powinny być podpięte pod:

```js
app.use('/recenzje', recenzjeRouter);
```

Recenzje korzystają ze statusów:

* `aktywna`
* `ukryta`
* `usunieta`

### `POST /recenzje/dodaj`

Wymaga logowania.

Dodaje recenzję sprzętu przez aktualnie zalogowanego użytkownika.

Body:

```json
{
  "sprzet_id": 1,
  "wypozyczenie_id": 5,
  "gwiazdki": 5,
  "tresc": "Sprzęt działał bardzo dobrze."
}
```

Wymagane pola:

* `sprzet_id`
* `gwiazdki`

Opcjonalne pola:

* `wypozyczenie_id`
* `tresc`

Zasady:

* `sprzet_id` musi być poprawnym ID istniejącego sprzętu
* `gwiazdki` muszą być liczbą od `1` do `5`
* użytkownik może dodać tylko jedną recenzję do jednego sprzętu
* recenzję można dodać tylko po zwróconym wypożyczeniu
* jeśli podano `wypozyczenie_id`, musi ono należeć do aktualnego użytkownika i dotyczyć tego samego sprzętu
* jeśli użytkownik już dodał recenzję tego sprzętu, endpoint zwraca `409`

Przykładowa odpowiedź:

```json
{
  "id": 1,
  "uzytkownik_id": 2,
  "sprzet_id": 1,
  "wypozyczenie_id": 5,
  "gwiazdki": 5,
  "tresc": "Sprzęt działał bardzo dobrze.",
  "status": "aktywna",
  "data_dodania": "2026-07-08T10:00:00.000Z"
}
```

Możliwe błędy:

* `400` - nieprawidłowe dane recenzji
* `401` - wymagane logowanie
* `404` - nie znaleziono sprzętu albo wypożyczenia
* `409` - użytkownik dodał już recenzję tego sprzętu albo nie ma zwróconego wypożyczenia
* `500` - błąd serwera

### `GET /recenzje/sprzet/:id`

Publiczny endpoint.

Zwraca aktywne recenzje danego sprzętu.

Parametr `:id` to ID sprzętu.

Query parametry:

* `strona` - numer strony, domyślnie `1`

Endpoint zwraca maksymalnie 10 recenzji na stronę.

Zwracane są tylko recenzje ze statusem `aktywna`.

Odpowiedź zawiera:

* `strona`
* `limitRecenzjiNaStrone`
* `sprzet_id`
* `srednia_ocen`
* `liczba_recenzji`
* `total`
* `liczbaStron`
* `dane`

Przykładowa odpowiedź:

```json
{
  "strona": 1,
  "limitRecenzjiNaStrone": 10,
  "sprzet_id": 1,
  "srednia_ocen": 4.5,
  "liczba_recenzji": 2,
  "total": 2,
  "liczbaStron": 1,
  "dane": [
    {
      "id": 1,
      "uzytkownik_id": 2,
      "sprzet_id": 1,
      "wypozyczenie_id": 5,
      "gwiazdki": 5,
      "tresc": "Sprzęt działał bardzo dobrze.",
      "status": "aktywna",
      "data_dodania": "2026-07-08T10:00:00.000Z",
      "imie": "Jan",
      "nazwisko": "Kowalski"
    }
  ]
}
```

Możliwe błędy:

* `400` - nieprawidłowe ID sprzętu
* `404` - nie znaleziono sprzętu
* `500` - błąd serwera

### `GET /recenzje/moje`

Wymaga logowania.

Zwraca aktywne recenzje aktualnie zalogowanego użytkownika.

Query parametry:

* `strona` - numer strony, domyślnie `1`

Endpoint zwraca maksymalnie 10 recenzji na stronę.

Zwracane są tylko recenzje ze statusem `aktywna`.

Odpowiedź zawiera:

* `strona`
* `limitRecenzjiNaStrone`
* `total`
* `liczbaStron`
* `dane`

Przykładowa odpowiedź:

```json
{
  "strona": 1,
  "limitRecenzjiNaStrone": 10,
  "total": 1,
  "liczbaStron": 1,
  "dane": [
    {
      "id": 1,
      "uzytkownik_id": 2,
      "sprzet_id": 1,
      "wypozyczenie_id": 5,
      "gwiazdki": 5,
      "tresc": "Sprzęt działał bardzo dobrze.",
      "status": "aktywna",
      "data_dodania": "2026-07-08T10:00:00.000Z",
      "imie": "Jan",
      "nazwisko": "Kowalski",
      "nazwa_sprzetu": "Wiertarka"
    }
  ]
}
```

Możliwe błędy:

* `401` - wymagane logowanie
* `500` - błąd serwera

### `GET /recenzje`

Admin only.

Zwraca paginowaną listę wszystkich recenzji.

Query parametry:

* `strona` - numer strony, domyślnie `1`
* `uzytkownik_id` - filtr po ID użytkownika
* `sprzet_id` - filtr po ID sprzętu
* `status` - filtr po statusie: `aktywna`, `ukryta`, `usunieta`
* `gwiazdki` - filtr po liczbie gwiazdek od `1` do `5`

Endpoint zwraca maksymalnie 10 recenzji na stronę.

Odpowiedź zawiera:

* `strona`
* `limitRecenzjiNaStrone`
* `filtry`
* `total`
* `liczbaStron`
* `dane`

Przykładowa odpowiedź:

```json
{
  "strona": 1,
  "limitRecenzjiNaStrone": 10,
  "filtry": {
    "uzytkownik_id": null,
    "sprzet_id": null,
    "status": null,
    "gwiazdki": null
  },
  "total": 3,
  "liczbaStron": 1,
  "dane": [
    {
      "id": 1,
      "uzytkownik_id": 2,
      "sprzet_id": 1,
      "wypozyczenie_id": 5,
      "gwiazdki": 5,
      "tresc": "Sprzęt działał bardzo dobrze.",
      "status": "aktywna",
      "data_dodania": "2026-07-08T10:00:00.000Z",
      "imie": "Jan",
      "nazwisko": "Kowalski",
      "nazwa_sprzetu": "Wiertarka"
    }
  ]
}
```

Możliwe błędy:

* `400` - nieprawidłowe filtry
* `401` - wymagane logowanie
* `403` - brak uprawnień administratora
* `500` - błąd serwera

### `GET /recenzje/:id`

Zwraca jedną recenzję po ID.

Dostęp:

* publicznie można pobrać tylko recenzję ze statusem `aktywna`
* właściciel może pobrać swoją recenzję niezależnie od statusu
* admin może pobrać każdą recenzję

Ważne: ten endpoint musi być zdefiniowany po bardziej szczegółowych trasach, np.:

* `/recenzje/sprzet/:id`
* `/recenzje/moje`
* `/recenzje/ukryj/:id`
* `/recenzje/odkryj/:id`
* `/recenzje/usun/:id`

Przykładowa odpowiedź:

```json
{
  "id": 1,
  "uzytkownik_id": 2,
  "sprzet_id": 1,
  "wypozyczenie_id": 5,
  "gwiazdki": 5,
  "tresc": "Sprzęt działał bardzo dobrze.",
  "status": "aktywna",
  "data_dodania": "2026-07-08T10:00:00.000Z",
  "imie": "Jan",
  "nazwisko": "Kowalski",
  "nazwa_sprzetu": "Wiertarka"
}
```

Możliwe błędy:

* `400` - nieprawidłowe ID recenzji
* `403` - brak uprawnień
* `404` - nie znaleziono recenzji
* `500` - błąd serwera

### `PATCH /recenzje/ukryj/:id`

### `PUT /recenzje/ukryj/:id`

Wymaga logowania i roli `admin`.

Ukrywa recenzję logicznie, ustawiając `status = 'ukryta'`.

Body nie jest wymagane.

Zasady:

* zwykły użytkownik nie może edytować recenzji
* użytkownik może tylko usunąć własną recenzję przez `DELETE /recenzje/usun/:id`
* admin może ukryć każdą nieusuniętą recenzję
* nie można ukryć recenzji ze statusem `usunieta`
* rekord nie jest usuwany fizycznie z bazy
* endpoint nie zmienia `gwiazdki` ani `tresc`

Przykładowa odpowiedź:

```json
{
  "id": 1,
  "uzytkownik_id": 2,
  "sprzet_id": 1,
  "wypozyczenie_id": 5,
  "gwiazdki": 4,
  "tresc": "Zmieniona treść recenzji.",
  "status": "ukryta",
  "data_dodania": "2026-07-08T10:00:00.000Z"
}
```

Możliwe błędy:

* `400` - nieprawidłowe ID recenzji albo recenzja jest usunięta
* `401` - wymagane logowanie
* `403` - brak uprawnień
* `404` - nie znaleziono recenzji
* `500` - błąd serwera

### `PATCH /recenzje/odkryj/:id`

### `PUT /recenzje/odkryj/:id`

Wymaga logowania i roli `admin`.

Odkrywa recenzję logicznie, ustawiając `status = 'aktywna'`.

Body nie jest wymagane.

Zasady:

* admin może odkryć każdą nieusuniętą recenzję
* nie można odkryć recenzji ze statusem `usunieta`
* endpoint nie zmienia `gwiazdki` ani `tresc`

Przykładowa odpowiedź:

```json
{
  "id": 1,
  "uzytkownik_id": 2,
  "sprzet_id": 1,
  "wypozyczenie_id": 5,
  "gwiazdki": 4,
  "tresc": "Zmieniona treść recenzji.",
  "status": "aktywna",
  "data_dodania": "2026-07-08T10:00:00.000Z"
}
```

Możliwe błędy:

* `400` - nieprawidłowe ID recenzji albo recenzja jest usunięta
* `401` - wymagane logowanie
* `403` - brak uprawnień
* `404` - nie znaleziono recenzji
* `500` - błąd serwera

### `DELETE /recenzje/usun/:id`

Wymaga logowania.

Usuwa recenzję logicznie.

Zasady:

* użytkownik może usunąć tylko swoją recenzję
* admin może usunąć każdą recenzję
* rekord nie jest usuwany fizycznie z bazy
* endpoint ustawia `status = 'usunieta'`

Przykładowa odpowiedź:

```json
{
  "id": 1,
  "uzytkownik_id": 2,
  "sprzet_id": 1,
  "wypozyczenie_id": 5,
  "gwiazdki": 4,
  "tresc": "Zmieniona treść recenzji.",
  "status": "usunieta",
  "data_dodania": "2026-07-08T10:00:00.000Z"
}
```

Możliwe błędy:

* `400` - nieprawidłowe ID recenzji
* `401` - wymagane logowanie
* `403` - brak uprawnień
* `404` - nie znaleziono recenzji
* `500` - błąd serwera

## Typowe kody błędów

* `400` - niepoprawne dane wejściowe
* `401` - wymagane logowanie
* `403` - brak uprawnień
* `404` - nie znaleziono zasobu
* `409` - konflikt, np. zajęty sprzęt, zasób powiązany z innymi rekordami albo duplikat recenzji
* `500` - błąd serwera

## Zarzadzanie workerem

Backend laczy sie z wewnetrznym API workera przez `WORKER_API_URL` i uzywa
sekretu `WORKER_API_KEY`. Klucz workera nie jest przyjmowany od klienta ani
zwracany w odpowiedzi. Wszystkie ponizsze endpointy wymagaja zalogowanego konta
z rola `admin`; mozna uzyc sesji albo administracyjnego klucza API backendu.
`WORKER_API_URL` jest opcjonalne. Jezeli zmienna nie jest ustawiona albo jest
pusta, router `/worker` nie zostaje zamontowany i wszystkie ponizsze endpointy
sa wylaczone. W takim trybie `WORKER_API_KEY` oraz
`WORKER_API_REQUEST_TIMEOUT_MS` nie sa wymagane.

### `GET /worker/settings`

Zwraca aktualne ustawienia harmonogramu i promocji:

```json
{
  "settings": {
    "cron_daily_promotion": "0 3 * * *",
    "timezone": "Europe/Warsaw",
    "discount_min_percent": 10,
    "discount_max_percent": 20
  }
}
```

### `PATCH /worker/settings`

Czesciowo zmienia jedno lub kilka ustawien. Wymaga
`Content-Type: application/json`. Dozwolone pola to `cron_daily_promotion`,
`timezone`, `discount_min_percent` i `discount_max_percent`. Worker waliduje caly
wynikowy zestaw i od razu przeladowuje harmonogram po zmianie crona lub strefy.

```json
{
  "cron_daily_promotion": "0 4 * * *",
  "discount_min_percent": 15,
  "discount_max_percent": 25
}
```

Nieprawidlowe ustawienia zwracaja `400`, zly typ zawartosci `415`, a zbyt duze
body `413`.

### `POST /worker/runpromotion`

Recznie uruchamia zadanie promocji i czeka na jego wynik. Odpowiedz ma status
`success` albo `skipped`. Gdy zadanie juz trwa, endpoint zwraca `409` ze statusem
`already_running`.

Problemy z polaczeniem backendu do workera zwracaja `502`, a przekroczenie
`WORKER_API_REQUEST_TIMEOUT_MS` zwraca `504`. Bledy wewnetrznego uwierzytelnienia
workera nie sa ujawniane klientowi.
