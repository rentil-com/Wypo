CREATE TYPE typ_konta AS ENUM (
    'uzytkownik',
    'admin'
);

CREATE TYPE status_sprzetu AS ENUM (
    'dostepny',
    'wypozyczony',
    'w_naprawie'
);

CREATE TYPE status_wypozyczenia AS ENUM (
    'oczekujacy',
    'zaakceptowany',
    'odrzucony',
    'aktywny',
    'zwrocony'
);

CREATE TYPE status_recenzji AS ENUM (
    'aktywna',
    'ukryta',
    'usunieta'
);

CREATE TYPE typ_promocji AS ENUM (
    'procentowa',
    'kwotowa'
);

CREATE TABLE uzytkownicy (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imie VARCHAR(100) NOT NULL,
    nazwisko VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    haslo_hash TEXT NOT NULL,
    rola typ_konta NOT NULL DEFAULT 'uzytkownik',
    dwuetapowe BOOLEAN NOT NULL DEFAULT FALSE,
    data_utworzenia TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_uzytkownicy_email_lower
    ON uzytkownicy (LOWER(email));

CREATE TABLE rejestracje_oczekujace (
    email VARCHAR(255) PRIMARY KEY,
    imie VARCHAR(100) NOT NULL,
    nazwisko VARCHAR(100) NOT NULL,
    haslo_hash TEXT NOT NULL,
    kod_hash TEXT NOT NULL,
    liczba_prob INTEGER NOT NULL DEFAULT 0,
    data_utworzenia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_wygasniecia TIMESTAMP NOT NULL,

    CONSTRAINT chk_rejestracje_liczba_prob
        CHECK (liczba_prob >= 0)
);

CREATE INDEX idx_rejestracje_data_wygasniecia
    ON rejestracje_oczekujace(data_wygasniecia);

CREATE TABLE wyzwania_2fa (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    challenge_hash TEXT UNIQUE NOT NULL,
    uzytkownik_id INTEGER UNIQUE NOT NULL,
    kod_hash TEXT NOT NULL,
    liczba_prob INTEGER NOT NULL DEFAULT 0,
    data_utworzenia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_wygasniecia TIMESTAMP NOT NULL,

    CONSTRAINT fk_wyzwania_2fa_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_wyzwania_2fa_liczba_prob
        CHECK (liczba_prob >= 0)
);

CREATE INDEX idx_wyzwania_2fa_data_wygasniecia
    ON wyzwania_2fa(data_wygasniecia);

CREATE TABLE resety_hasla (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    challenge_hash TEXT UNIQUE NOT NULL,
    uzytkownik_id INTEGER UNIQUE NOT NULL,
    kod_hash TEXT NOT NULL,
    liczba_prob INTEGER NOT NULL DEFAULT 0,
    data_utworzenia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_wygasniecia TIMESTAMP NOT NULL,

    CONSTRAINT fk_resety_hasla_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_resety_hasla_liczba_prob
        CHECK (liczba_prob >= 0)
);

CREATE INDEX idx_resety_hasla_data_wygasniecia
    ON resety_hasla(data_wygasniecia);

CREATE TABLE zmiany_email (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    challenge_hash TEXT UNIQUE NOT NULL,
    uzytkownik_id INTEGER UNIQUE NOT NULL,
    nowy_email VARCHAR(255) NOT NULL,
    kod_hash TEXT NOT NULL,
    liczba_prob INTEGER NOT NULL DEFAULT 0,
    data_utworzenia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_wygasniecia TIMESTAMP NOT NULL,

    CONSTRAINT fk_zmiany_email_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_zmiany_email_liczba_prob
        CHECK (liczba_prob >= 0)
);

CREATE UNIQUE INDEX uq_zmiany_email_nowy_email_lower
    ON zmiany_email (LOWER(nowy_email));

CREATE INDEX idx_zmiany_email_data_wygasniecia
    ON zmiany_email(data_wygasniecia);


CREATE TABLE kategorie (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL,
    zdjecie_url TEXT
);

CREATE TABLE sprzety (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL,
    opis TEXT,
    kategoria_id INTEGER NOT NULL,
    zdjecia_url JSONB NOT NULL DEFAULT '{}'::jsonb,

    cena numeric(10,2) NOT NULL DEFAULT 0,

    status status_sprzetu NOT NULL DEFAULT 'dostepny',
    data_dodania TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sprzet_kategorie
        FOREIGN KEY (kategoria_id)
        REFERENCES kategorie(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_sprzety_cena
        CHECK (cena >= 0),

    CONSTRAINT chk_sprzety_zdjecia_url
        CHECK (jsonb_typeof(zdjecia_url) = 'object')
);

CREATE TABLE promocje (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL,
    opis TEXT,
    typ typ_promocji NOT NULL,
    wartosc NUMERIC(10, 2) NOT NULL,
    obejmuje_wszystkie_sprzety BOOLEAN NOT NULL DEFAULT FALSE,
    obejmuje_wszystkich_uzytkownikow BOOLEAN NOT NULL DEFAULT TRUE,
    aktywna BOOLEAN NOT NULL DEFAULT TRUE,
    data_od TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_do TIMESTAMPTZ,
    utworzona_przez INTEGER NOT NULL,
    data_utworzenia TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_promocje_utworzona_przez
        FOREIGN KEY (utworzona_przez)
        REFERENCES uzytkownicy(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_promocje_nazwa
        CHECK (BTRIM(nazwa) <> ''),

    CONSTRAINT chk_promocje_wartosc
        CHECK (
            wartosc > 0
            AND (typ <> 'procentowa' OR wartosc <= 100)
        ),

    CONSTRAINT chk_promocje_dat
        CHECK (data_do IS NULL OR data_do > data_od)
);

COMMENT ON TABLE promocje IS
    'Promocje nie lacza sie; sposrod pasujacych promocji nalezy wybrac te, ktora daje najnizsza cene, nie mniejsza niz 0.';

CREATE INDEX idx_promocje_aktywne_dat
    ON promocje(aktywna, data_od, data_do);

CREATE INDEX idx_promocje_utworzona_przez
    ON promocje(utworzona_przez);

CREATE TABLE promocje_kategorie (
    promocja_id INTEGER NOT NULL,
    kategoria_id INTEGER NOT NULL,

    CONSTRAINT pk_promocje_kategorie
        PRIMARY KEY (promocja_id, kategoria_id),

    CONSTRAINT fk_promocje_kategorie_promocje
        FOREIGN KEY (promocja_id)
        REFERENCES promocje(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_promocje_kategorie_kategorie
        FOREIGN KEY (kategoria_id)
        REFERENCES kategorie(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_promocje_kategorie_kategoria_id
    ON promocje_kategorie(kategoria_id);

CREATE TABLE promocje_sprzety (
    promocja_id INTEGER NOT NULL,
    sprzet_id INTEGER NOT NULL,

    CONSTRAINT pk_promocje_sprzety
        PRIMARY KEY (promocja_id, sprzet_id),

    CONSTRAINT fk_promocje_sprzety_promocje
        FOREIGN KEY (promocja_id)
        REFERENCES promocje(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_promocje_sprzety_sprzety
        FOREIGN KEY (sprzet_id)
        REFERENCES sprzety(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_promocje_sprzety_sprzet_id
    ON promocje_sprzety(sprzet_id);

CREATE TABLE promocje_uzytkownicy (
    promocja_id INTEGER NOT NULL,
    uzytkownik_id INTEGER NOT NULL,

    CONSTRAINT pk_promocje_uzytkownicy
        PRIMARY KEY (promocja_id, uzytkownik_id),

    CONSTRAINT fk_promocje_uzytkownicy_promocje
        FOREIGN KEY (promocja_id)
        REFERENCES promocje(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_promocje_uzytkownicy_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_promocje_uzytkownicy_uzytkownik_id
    ON promocje_uzytkownicy(uzytkownik_id);

CREATE TABLE specyfikacje_sprzetu (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sprzet_id INTEGER NOT NULL,
    nazwa_specyfikacji VARCHAR(100) NOT NULL,
    opis_specyfikacji TEXT NOT NULL,
    emotka_specyfikacji VARCHAR(100),
    kolejnosc INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT fk_specyfikacje_sprzety
        FOREIGN KEY (sprzet_id)
        REFERENCES sprzety(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_specyfikacje_kolejnosc
        CHECK (kolejnosc >= 0)
);

CREATE INDEX idx_specyfikacje_sprzetu_sprzet_id
    ON specyfikacje_sprzetu(sprzet_id);

CREATE TABLE wypozyczenia (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sprzet_id INTEGER NOT NULL,
    uzytkownik_id INTEGER NOT NULL,
    data_zlozenia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_od TIMESTAMP NOT NULL,
    data_do TIMESTAMP NOT NULL,
    status status_wypozyczenia NOT NULL DEFAULT 'oczekujacy',
    data_zwrotu_rzeczywista TIMESTAMP,
    promocja_id INTEGER,
    cena_bazowa NUMERIC(10, 2) NOT NULL,
    cena_koncowa NUMERIC(10, 2) NOT NULL,
    promocja_nazwa VARCHAR(100),
    promocja_typ typ_promocji,
    promocja_wartosc NUMERIC(10, 2),

    CONSTRAINT fk_wypozyczenia_sprzet
        FOREIGN KEY (sprzet_id)
        REFERENCES sprzety(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_wypozyczenia_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_wypozyczenia_promocje
        FOREIGN KEY (promocja_id)
        REFERENCES promocje(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_wypozyczenia_dat
        CHECK (data_do >= data_od),

    CONSTRAINT chk_wypozyczenia_ceny
        CHECK (
            cena_bazowa >= 0
            AND cena_koncowa >= 0
            AND cena_koncowa <= cena_bazowa
        ),

    CONSTRAINT chk_wypozyczenia_snapshot_promocji
        CHECK (
            (
                promocja_nazwa IS NULL
                AND promocja_typ IS NULL
                AND promocja_wartosc IS NULL
            )
            OR (
                promocja_nazwa IS NOT NULL
                AND promocja_typ IS NOT NULL
                AND promocja_wartosc > 0
                AND (
                    promocja_typ <> 'procentowa'
                    OR promocja_wartosc <= 100
                )
            )
        )
);

CREATE INDEX idx_wypozyczenia_promocja_id
    ON wypozyczenia(promocja_id);

COMMENT ON COLUMN wypozyczenia.cena_bazowa IS
    'Cena bazowa sprzetu za dzien zapisana w chwili utworzenia wypozyczenia.';

COMMENT ON COLUMN wypozyczenia.cena_koncowa IS
    'Cena za dzien po promocji zapisana w chwili utworzenia wypozyczenia.';

CREATE TABLE ulubione (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uzytkownik_id INTEGER NOT NULL,
    sprzet_id INTEGER NOT NULL,
    data_dodania TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ulubione_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ulubione_sprzety
        FOREIGN KEY (sprzet_id)
        REFERENCES sprzety(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_ulubione_uzytkownik_sprzet
        UNIQUE (uzytkownik_id, sprzet_id)
);

CREATE TABLE powiadomienia (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uzytkownik_id INTEGER NOT NULL,
    tresc TEXT NOT NULL,
    przeczytane BOOLEAN NOT NULL DEFAULT FALSE,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_powiadomienia_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE CASCADE
);

CREATE TABLE sesje (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_hash TEXT UNIQUE NOT NULL,
    uzytkownik_id INTEGER NOT NULL,
    data_utworzenia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ostatnia_aktywnosc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_wygasniecia TIMESTAMP NOT NULL,

    CONSTRAINT fk_sesje_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE CASCADE
);

CREATE TABLE klucze_api (
    uzytkownik_id INTEGER PRIMARY KEY,
    klucz_hash TEXT UNIQUE NOT NULL,
    data_utworzenia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_ostatniego_uzycia TIMESTAMP,

    CONSTRAINT fk_klucze_api_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE CASCADE
);

CREATE TABLE recenzje (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    uzytkownik_id INTEGER NOT NULL,
    sprzet_id INTEGER NOT NULL,
    wypozyczenie_id INTEGER,

    gwiazdki INTEGER NOT NULL,
    tresc TEXT,

    status status_recenzji NOT NULL DEFAULT 'aktywna',
    data_dodania TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recenzje_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recenzje_sprzety
        FOREIGN KEY (sprzet_id)
        REFERENCES sprzety(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recenzje_wypozyczenia
        FOREIGN KEY (wypozyczenie_id)
        REFERENCES wypozyczenia(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_recenzje_gwiazdki
        CHECK (gwiazdki >= 1 AND gwiazdki <= 5)
);
