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

CREATE TABLE uzytkownicy (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imie VARCHAR(100) NOT NULL,
    nazwisko VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    haslo_hash TEXT NOT NULL,
    rola typ_konta NOT NULL DEFAULT 'uzytkownik',
    data_utworzenia TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    cena_po_promocji NUMERIC(10, 2),

    status status_sprzetu NOT NULL DEFAULT 'dostepny',
    data_dodania TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sprzet_kategorie
        FOREIGN KEY (kategoria_id)
        REFERENCES kategorie(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_sprzety_cena
        CHECK (cena >= 0),

    CONSTRAINT chk_sprzety_cena_po_promocji
        CHECK (
            cena_po_promocji IS NULL
            OR cena_po_promocji >= 0
        ),

    CONSTRAINT chk_sprzety_zdjecia_url
        CHECK (jsonb_typeof(zdjecia_url) = 'object'),

    CONSTRAINT chk_sprzety_promocja_mniejsza_od_ceny
        CHECK (
            cena_po_promocji IS NULL
            OR cena_po_promocji <= cena
        )
);

CREATE TABLE wypozyczenia (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sprzet_id INTEGER NOT NULL,
    uzytkownik_id INTEGER NOT NULL,
    data_zlozenia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_od TIMESTAMP NOT NULL,
    data_do TIMESTAMP NOT NULL,
    status status_wypozyczenia NOT NULL DEFAULT 'oczekujacy',
    data_zwrotu_rzeczywista TIMESTAMP,

    CONSTRAINT fk_wypozyczenia_sprzet
        FOREIGN KEY (sprzet_id)
        REFERENCES sprzety(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_wypozyczenia_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_wypozyczenia_dat
        CHECK (data_do >= data_od)
);

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