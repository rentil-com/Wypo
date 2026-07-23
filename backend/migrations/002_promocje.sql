BEGIN;

CREATE TYPE typ_promocji AS ENUM (
    'procentowa',
    'kwotowa'
);

ALTER TABLE sprzety
    DROP COLUMN cena_po_promocji;

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

COMMIT;
