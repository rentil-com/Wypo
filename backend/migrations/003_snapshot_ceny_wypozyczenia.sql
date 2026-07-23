BEGIN;

ALTER TABLE wypozyczenia
    ADD COLUMN promocja_id INTEGER,
    ADD COLUMN cena_bazowa NUMERIC(10, 2),
    ADD COLUMN cena_koncowa NUMERIC(10, 2),
    ADD COLUMN promocja_nazwa VARCHAR(100),
    ADD COLUMN promocja_typ typ_promocji,
    ADD COLUMN promocja_wartosc NUMERIC(10, 2);

UPDATE wypozyczenia w
SET cena_bazowa = s.cena,
    cena_koncowa = s.cena
FROM sprzety s
WHERE s.id = w.sprzet_id;

ALTER TABLE wypozyczenia
    ALTER COLUMN cena_bazowa SET NOT NULL,
    ALTER COLUMN cena_koncowa SET NOT NULL,

    ADD CONSTRAINT fk_wypozyczenia_promocje
        FOREIGN KEY (promocja_id)
        REFERENCES promocje(id)
        ON DELETE SET NULL,

    ADD CONSTRAINT chk_wypozyczenia_ceny
        CHECK (
            cena_bazowa >= 0
            AND cena_koncowa >= 0
            AND cena_koncowa <= cena_bazowa
        ),

    ADD CONSTRAINT chk_wypozyczenia_snapshot_promocji
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
        );

CREATE INDEX idx_wypozyczenia_promocja_id
    ON wypozyczenia(promocja_id);

COMMENT ON COLUMN wypozyczenia.cena_bazowa IS
    'Cena bazowa sprzetu za dzien zapisana w chwili utworzenia wypozyczenia.';

COMMENT ON COLUMN wypozyczenia.cena_koncowa IS
    'Cena za dzien po promocji zapisana w chwili utworzenia wypozyczenia.';

COMMIT;
