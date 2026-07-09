# Endpointy backendu wypożyczalni

Domyślny adres lokalny: `http://localhost:3000`.

Autoryzacja działa przez cookie `session_id`, ustawiane po zalogowaniu przez `POST /auth/login`. Endpointy wymagające zalogowania zwracają `401`, gdy nie ma poprawnej sesji. Endpointy administracyjne zwracają `403`, gdy użytkownik nie ma roli `admin`.

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

Zwraca listę kategorii na stronę główną.

Zwracane pola:

* `id`
* `nazwa`
* `zdjecie_url`

## Autoryzacja

### `POST /auth/login`

Loguje użytkownika i ustawia cookie `session_id`.

Body:

```json
{
  "email": "admin@example.com",
  "password": "haslo"
}
```

Odpowiedź zawiera:

* `message`
* `user.id`
* `user.email`
* `user.rola`

### `POST /auth/logout`

Wylogowuje użytkownika, usuwa sesję z bazy i czyści cookie `session_id`.

## Konta

### `POST /account/create`

Tworzy konto użytkownika.

Body:

```json
{
  "imie": "Jan",
  "nazwisko": "Kowalski",
  "email": "jan@example.com",
  "password": "minimum8znakow"
}
```

Zamiast `password` można użyć pola `haslo`.

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

Zwykły użytkownik może edytować tylko swoje konto. Admin może edytować inne konta oraz zmieniać rolę, ale nie może zmienić własnej roli.

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

Zwraca listę ID kategorii, które można usunąć, czyli takich, do których nie jest przypisany żaden sprzęt.

## Sprzęt

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

Dla admina zwracany jest rzeczywisty status sprzętu. Dla zwykłego użytkownika status inny niż `dostepny` jest mapowany na `niedostepny`.

### `GET /items/:id`

Zwraca szczegóły jednego sprzętu.

Dla admina zwracany jest rzeczywisty status sprzętu. Dla zwykłego użytkownika status inny niż `dostepny` jest mapowany na `niedostepny`.

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
  "cena": "49.99",
  "cena_po_promocji": "39.99",
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
* `cena_po_promocji`
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
* `cena_po_promocji`

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

Zwraca listę ID sprzętów, które można usunąć, czyli takich, które nie mają żadnego wypożyczenia.

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

### `PATCH /wypozyczenia/edytuj/:id`

### `PUT /wypozyczenia/edytuj/:id`

Admin only.

Ręcznie edytuje wypożyczenie.

Body może zawierać:

```json
{
  "sprzet_id": 2,
  "uzytkownik_id": 3,
  "data_od": "2026-07-10T10:00:00.000Z",
  "data_do": "2026-07-12T10:00:00.000Z",
  "status": "aktywny",
  "data_zwrotu_rzeczywista": null
}
```

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
