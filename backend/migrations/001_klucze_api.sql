BEGIN;

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

COMMIT;
