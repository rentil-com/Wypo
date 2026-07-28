# TODO

## System promocji

- [ ] Zapewnić idempotencję tworzenia promocji przez worker.
  - Dodać identyfikator zewnętrzny/idempotency key generowany przez worker.
  - Umożliwić uzgodnienie stanu po timeoutcie odpowiedzi backendu.
  - Ustawiać skończone `data_do` dla automatycznych promocji.
  - Przy błędzie zapisu historii po otrzymaniu `promocja_id` wykonać kompensującą dezaktywację promocji.

- [ ] Ustalić i wdrożyć politykę usuwania kont powiązanych z promocjami.
  - Rozważyć soft-delete kont.
  - Przypisania odbiorców promocji usuwać bez blokowania usunięcia konta albo sprzątać je atomowo w endpointcie usuwania konta.
  - Dla `promocje.utworzona_przez` zachować dane audytowe bez trwałego blokowania usunięcia administratora, np. snapshot autora i nullable FK z `ON DELETE SET NULL`.

- [ ] Nie wybierać w workerze sprzętów objętych dowolną aktywną promocją.
  - Nie opierać decyzji wyłącznie na spersonalizowanym `czy_promocja` zwracanym dla konta administratora.
  - Dodać administracyjną flagę `ma_jakakolwiek_aktywna_promocje` albo pobierać aktywne promocje i uwzględniać ich zakres sprzętów oraz kategorii.

- [ ] Uaktualnić dokumentację po wdrożeniu nowego systemu promocji.
  - Usunąć informacje o workerze zapisującym `cena_po_promocji`.
  - Opisać migrację `worker/sql/003_add_backend_promotion_id.sql`.
  - Zaktualizować opis PR-a i kolejność wdrożenia backendu oraz workera.

## Testy

- [ ] Dodać test utraty odpowiedzi po poprawnym utworzeniu promocji w backendzie.
- [ ] Dodać test błędu zapisu historii workera po utworzeniu promocji.
- [ ] Dodać test usuwania kont przypisanych do aktywnej, wygasłej i wyłączonej promocji.
- [ ] Dodać test, że worker pomija sprzęt objęty promocją przypisaną innemu użytkownikowi.
