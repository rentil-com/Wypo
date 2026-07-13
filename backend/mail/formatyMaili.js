import {
  KOD_2FA_WAZNY_MINUT,
  KOD_REJESTRACJI_WAZNY_MINUT,
  KOD_RESETU_HASLA_WAZNY_MINUT,
  KOD_ZMIANY_EMAIL_WAZNY_MINUT
} from "../helpers/zabezpieczenia.js";

function pobierzBranding(opcje = {}) {
  return {
    nazwa: opcje.nazwa || process.env.MAIL_BRAND_NAME || 'Wypozyczalnia narzedzi',
    logo1x1: opcje.logo1x1 || process.env.MAIL_LOGO_1X1_URL || '',
    logo4x1: opcje.logo4x1 || process.env.MAIL_LOGO_4X1_URL || '',
    appUrl: opcje.appUrl || process.env.MAIL_APP_URL || ''
  };
}

function escapeHtml(wartosc) {
  return String(wartosc ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tekst(wartosc) {
  return escapeHtml(wartosc || '-');
}

function formatujDate(wartosc) {
  if (!wartosc) {
    return '';
  }

  const data = new Date(wartosc);

  if (Number.isNaN(data.getTime())) {
    return String(wartosc);
  }

  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium'
  }).format(data);
}

function linieTekstu(linie) {
  return linie.filter(Boolean).join('\n');
}

function zbudujSzczegoly(szczegoly = []) {
  const wiersze = szczegoly
    .filter((wiersz) => wiersz?.wartosc !== undefined && wiersz?.wartosc !== null && wiersz.wartosc !== '')
    .map((wiersz) => `
      <tr>
        <td class="detail-label">${escapeHtml(wiersz.etykieta)}</td>
        <td class="detail-value">${tekst(wiersz.wartosc)}</td>
      </tr>
    `)
    .join('');

  if (!wiersze) {
    return '';
  }

  return `
    <table class="details" role="presentation" cellspacing="0" cellpadding="0">
      ${wiersze}
    </table>
  `;
}

function zbudujLogo(branding) {
  const logo1x1 = branding.logo1x1
    ? `<img class="logo-square" src="${escapeHtml(branding.logo1x1)}" alt="${escapeHtml(branding.nazwa)}">`
    : '';
  const logo4x1 = branding.logo4x1
    ? `<img class="logo-wide" src="${escapeHtml(branding.logo4x1)}" alt="${escapeHtml(branding.nazwa)}">`
    : `<span class="brand-name">${escapeHtml(branding.nazwa)}</span>`;

  // return `
  //   <div class="brand">
  //     ${logo1x1}
  //     ${logo4x1}
  //   </div>
  // `;
  return `
    <div class="brand">
      ${logo4x1}
    </div>
  `;
  
}

function zbudujPrzycisk(akcja) {
  if (!akcja?.url || !akcja?.tekst) {
    return '';
  }

  return `
    <p class="action">
      <a href="${escapeHtml(akcja.url)}">${escapeHtml(akcja.tekst)}</a>
    </p>
  `;
}

function pobierzZdjecieProduktuUrl(zdjecieProduktuUrl, zdjecieUrl) {
  return zdjecieProduktuUrl || zdjecieUrl || '';
}

function zbudujZdjecieProduktu(zdjecieProduktuUrl, alt = 'Zdjecie produktu') {
  if (!zdjecieProduktuUrl) {
    return '';
  }

  return `
    <div class="product-image">
      <img src="${escapeHtml(zdjecieProduktuUrl)}" alt="${escapeHtml(alt)}">
    </div>
  `;
}
function zbudujMailHtml({
  tytul,
  wstep,
  kod,
  szczegoly,
  akcja,
  dopisek,
  preheader,
  zdjecieProduktuUrl,
  altZdjeciaProduktu,
  branding
}) {
  const brand = pobierzBranding(branding);

  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f4f6f8;
      color: #172033;
      font-family: Arial, Helvetica, sans-serif;
    }

    .preheader {
      display: none;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
    }

    .wrap {
      width: 100%;
      padding: 24px 0;
    }

    .mail {
      width: 100%;
      max-width: 640px;
      margin: 0 auto;
    }

    .brand {
      padding: 8px 24px 18px;
      text-align: center;
    }

    .logo-square {
      width: 48px;
      height: 48px;
      margin: 0 10px 0 0;
      object-fit: contain;
      vertical-align: middle;
    }

    .logo-wide {
      max-width: 220px;
      max-height: 64px;
      object-fit: contain;
      vertical-align: middle;
    }

    .brand-name {
      color: #172033;
      font-size: 22px;
      font-weight: 700;
    }

    .card {
      background: #ffffff;
      border: 1px solid #dde3ea;
      border-radius: 8px;
      padding: 30px;
    }

    h1 {
      margin: 0 0 14px;
      color: #111827;
      font-size: 24px;
      line-height: 1.3;
    }

    p {
      margin: 0 0 16px;
      color: #344054;
      font-size: 16px;
      line-height: 1.55;
    }

    .code {
      margin: 24px 0;
      padding: 18px 20px;
      background: #eef4ff;
      border: 1px solid #b8cdf8;
      border-radius: 8px;
      color: #153e90;
      font-size: 32px;
      font-weight: 700;
      text-align: center;
    }

    .product-image {
      margin: 22px 0;
      background: #f8fafc;
      border: 1px solid #dde3ea;
      border-radius: 8px;
      overflow: hidden;
    }

    .product-image img {
      display: block;
      width: 100%;
      max-height: 260px;
      object-fit: cover;
    }
    .details {
      width: 100%;
      margin: 22px 0;
      border: 1px solid #dde3ea;
      border-radius: 8px;
      border-collapse: separate;
      border-spacing: 0;
      overflow: hidden;
    }

    .details td {
      padding: 12px 14px;
      border-bottom: 1px solid #edf0f4;
      font-size: 14px;
      vertical-align: top;
    }

    .details tr:last-child td {
      border-bottom: 0;
    }

    .detail-label {
      width: 42%;
      background: #f8fafc;
      color: #667085;
      font-weight: 700;
    }

    .detail-value {
      color: #172033;
    }

    .action {
      margin: 24px 0 4px;
    }

    .action a {
      display: inline-block;
      padding: 12px 18px;
      background: #1d4ed8;
      border-radius: 6px;
      color: #ffffff;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
    }

    .note {
      margin-top: 20px;
      color: #667085;
      font-size: 13px;
    }

    .footer {
      padding: 18px 24px 0;
      color: #98a2b3;
      font-size: 12px;
      text-align: center;
    }

    @media (max-width: 520px) {
      .wrap {
        padding: 12px;
      }

      .card {
        padding: 22px;
      }

      h1 {
        font-size: 21px;
      }

      .code {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <div class="preheader">${escapeHtml(preheader || '')}</div>
  <div class="wrap">
    <div class="mail">
      ${zbudujLogo(brand)}
      <div class="card">
        <h1>${escapeHtml(tytul)}</h1>
        <p>${escapeHtml(wstep)}</p>
        ${zbudujZdjecieProduktu(zdjecieProduktuUrl, altZdjeciaProduktu)}
        ${kod ? `<div class="code">${escapeHtml(kod)}</div>` : ''}
        ${zbudujSzczegoly(szczegoly)}
        ${zbudujPrzycisk(akcja)}
        ${dopisek ? `<p class="note">${escapeHtml(dopisek)}</p>` : ''}
      </div>
      <div class="footer">
        ${escapeHtml(brand.nazwa)}${brand.appUrl ? ` | ${escapeHtml(brand.appUrl)}` : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function mail2FA({ kod, imie, waznyMinut = KOD_2FA_WAZNY_MINUT, branding } = {}) {
  const temat = 'Kod logowania 2FA';
  const wstep = imie
    ? `Czesc ${imie}, uzyj ponizszego kodu, aby dokonczyc logowanie.`
    : 'Uzyj ponizszego kodu, aby dokonczyc logowanie.';
  const dopisek = `Kod jest wazny przez ${waznyMinut} minut. Jesli to nie Ty probujesz sie zalogowac, zignoruj ta wiadomosc.`;

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      `Kod: ${kod}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      kod,
      dopisek,
      preheader: `Kod 2FA: ${kod}`,
      branding
    })
  };
}

export function mailKodRejestracji({ kod, imie, waznyMinut = KOD_REJESTRACJI_WAZNY_MINUT, branding } = {}) {
  const temat = 'Kod potwierdzenia konta';
  const wstep = imie
    ? `Czesc ${imie}, wpisz ten kod, aby potwierdzic adres e-mail i zalozyc konto.`
    : 'Wpisz ten kod, aby potwierdzic adres e-mail i zalozyc konto.';
  const dopisek = `Kod jest wazny przez ${waznyMinut} minut. Nie przekazuj go innym osobom.`;

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      `Kod: ${kod}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      kod,
      dopisek,
      preheader: `Kod potwierdzenia konta: ${kod}`,
      branding
    })
  };
}

export function mailKodResetuHasla({ kod, imie, waznyMinut = KOD_RESETU_HASLA_WAZNY_MINUT, branding } = {}) {
  const temat = 'Kod resetu hasla';
  const wstep = imie
    ? `Czesc ${imie}, wpisz ten kod, aby ustawic nowe haslo.`
    : 'Wpisz ten kod, aby ustawic nowe haslo.';
  const dopisek = `Kod jest wazny przez ${waznyMinut} minut. Jesli nie prosiles o reset hasla, zignoruj te wiadomosc.`;

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      `Kod: ${kod}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      kod,
      dopisek,
      preheader: `Kod resetu hasla: ${kod}`,
      branding
    })
  };
}

export function mailHasloZmienione({ imie, branding } = {}) {
  const temat = 'Haslo zostalo zmienione';
  const wstep = imie
    ? `Czesc ${imie}, haslo do Twojego konta zostalo zmienione.`
    : 'Haslo do Twojego konta zostalo zmienione.';
  const dopisek = 'Wszystkie aktywne sesje zostaly zakonczone. Jesli to nie Ty zmieniles haslo, skontaktuj sie z obsluga wypozyczalni.';

  return {
    temat,
    tekst: linieTekstu([temat, wstep, dopisek]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      dopisek,
      preheader: temat,
      branding
    })
  };
}

export function mailKodZmianyEmail({ kod, imie, waznyMinut = KOD_ZMIANY_EMAIL_WAZNY_MINUT, branding } = {}) {
  const temat = 'Kod potwierdzenia nowego adresu e-mail';
  const wstep = imie
    ? `Czesc ${imie}, wpisz ten kod, aby potwierdzic nowy adres e-mail.`
    : 'Wpisz ten kod, aby potwierdzic nowy adres e-mail.';
  const dopisek = `Kod jest wazny przez ${waznyMinut} minut. Jesli nie zlecales zmiany adresu, zignoruj te wiadomosc.`;

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      `Kod: ${kod}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      kod,
      dopisek,
      preheader: `Kod zmiany adresu e-mail: ${kod}`,
      branding
    })
  };
}

export function mailEmailZmieniony({ imie, nowyEmail, branding } = {}) {
  const temat = 'Adres e-mail konta zostal zmieniony';
  const wstep = imie
    ? `Czesc ${imie}, adres e-mail przypisany do Twojego konta zostal zmieniony.`
    : 'Adres e-mail przypisany do Twojego konta zostal zmieniony.';
  const dopisek = 'Jesli to nie Ty wykonales te zmiane, niezwlocznie skontaktuj sie z obsluga wypozyczalni.';
  const szczegoly = [
    { etykieta: 'Nowy adres e-mail', wartosc: nowyEmail }
  ];

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      nowyEmail && `Nowy adres e-mail: ${nowyEmail}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      szczegoly,
      dopisek,
      preheader: temat,
      branding
    })
  };
}

export function mailWlaczono2FA({ imie, branding } = {}) {
  const temat = 'Wlaczono uwierzytelnianie dwuetapowe';
  const wstep = imie
    ? `Czesc ${imie}, na Twoim koncie wlaczono uwierzytelnianie dwuetapowe (2FA).`
    : 'Na Twoim koncie wlaczono uwierzytelnianie dwuetapowe (2FA).';
  const dopisek = 'Od teraz podczas logowania po podaniu hasla wyslemy Ci jednorazowy kod e-mail. Jesli to nie Ty wykonales te zmiane, niezwlocznie zmien haslo.';

  return {
    temat,
    tekst: linieTekstu([temat, wstep, dopisek]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      dopisek,
      preheader: temat,
      branding
    })
  };
}

export function mailWylaczono2FA({ imie, branding } = {}) {
  const temat = 'Wylaczono uwierzytelnianie dwuetapowe';
  const wstep = imie
    ? `Czesc ${imie}, na Twoim koncie wylaczono uwierzytelnianie dwuetapowe (2FA).`
    : 'Na Twoim koncie wylaczono uwierzytelnianie dwuetapowe (2FA).';
  const dopisek = 'Kolejne logowania beda wymagaly tylko hasla. Jesli to nie Ty wykonales te zmiane, niezwlocznie zmien haslo i ponownie wlacz 2FA.';

  return {
    temat,
    tekst: linieTekstu([temat, wstep, dopisek]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      dopisek,
      preheader: temat,
      branding
    })
  };
}
export function mailPotwierdzenieZapytaniaWypozyczenia({
  imie,
  nazwaSprzetu,
  zdjecieProduktuUrl,
  zdjecieUrl,
  dataOd,
  dataDo,
  wypozyczenieId,
  branding
} = {}) {
  const temat = 'Potwierdzenie wyslania zapytania o wypozyczenie';
  const wstep = imie
    ? `Czesc ${imie}, otrzymalismy Twoje zapytanie o wypozyczenie.`
    : 'Otrzymalismy Twoje zapytanie o wypozyczenie.';
  const zdjecieProduktu = pobierzZdjecieProduktuUrl(zdjecieProduktuUrl, zdjecieUrl);
  const szczegoly = [
    { etykieta: 'Sprzet', wartosc: nazwaSprzetu },
    { etykieta: 'Data od', wartosc: formatujDate(dataOd) },
    { etykieta: 'Data do', wartosc: formatujDate(dataDo) },
    { etykieta: 'Numer zapytania', wartosc: wypozyczenieId }
  ];
  const dopisek = 'Damy znac, gdy zapytanie zostanie zaakceptowane albo odrzucone.';

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      nazwaSprzetu && `Sprzet: ${nazwaSprzetu}`,
      zdjecieProduktu && `Zdjecie produktu: ${zdjecieProduktu}`,
      dataOd && `Data od: ${formatujDate(dataOd)}`,
      dataDo && `Data do: ${formatujDate(dataDo)}`,
      wypozyczenieId && `Numer zapytania: ${wypozyczenieId}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      zdjecieProduktuUrl: zdjecieProduktu,
      altZdjeciaProduktu: nazwaSprzetu ? `Zdjecie produktu ${nazwaSprzetu}` : 'Zdjecie produktu',
      szczegoly,
      dopisek,
      preheader: 'Twoje zapytanie o wypozyczenie zostalo zapisane.',
      branding
    })
  };
}

export function mailDecyzjaWnioskuWypozyczenia({
  imie,
  status,
  decyzja,
  nazwaSprzetu,
  zdjecieProduktuUrl,
  zdjecieUrl,
  dataOd,
  dataDo,
  wypozyczenieId,
  powod,
  branding
} = {}) {
  const finalnyStatus = String(status || decyzja || '').toLowerCase() === 'odrzucony'
    ? 'odrzucony'
    : 'zaakceptowany';
  const czyZaakceptowany = finalnyStatus === 'zaakceptowany';
  const temat = czyZaakceptowany
    ? 'Wniosek o wypozyczenie zaakceptowany'
    : 'Wniosek o wypozyczenie odrzucony';
  const wstep = imie
    ? `Czesc ${imie}, Twoj wniosek o wypozyczenie zostal ${finalnyStatus}.`
    : `Twoj wniosek o wypozyczenie zostal ${finalnyStatus}.`;
  const zdjecieProduktu = pobierzZdjecieProduktuUrl(zdjecieProduktuUrl, zdjecieUrl);
  const szczegoly = [
    { etykieta: 'Status', wartosc: finalnyStatus },
    { etykieta: 'Sprzet', wartosc: nazwaSprzetu },
    { etykieta: 'Data od', wartosc: formatujDate(dataOd) },
    { etykieta: 'Data do', wartosc: formatujDate(dataDo) },
    { etykieta: 'Numer zapytania', wartosc: wypozyczenieId },
    { etykieta: 'Powod', wartosc: powod }
  ];
  const dopisek = czyZaakceptowany
    ? 'Gdy wypozyczenie zostanie aktywowane, wyslemy kolejne potwierdzenie.'
    : 'W razie pytan skontaktuj sie z obsluga wypozyczalni.';

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      `Status: ${finalnyStatus}`,
      nazwaSprzetu && `Sprzet: ${nazwaSprzetu}`,
      zdjecieProduktu && `Zdjecie produktu: ${zdjecieProduktu}`,
      dataOd && `Data od: ${formatujDate(dataOd)}`,
      dataDo && `Data do: ${formatujDate(dataDo)}`,
      wypozyczenieId && `Numer zapytania: ${wypozyczenieId}`,
      powod && `Powod: ${powod}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      zdjecieProduktuUrl: zdjecieProduktu,
      altZdjeciaProduktu: nazwaSprzetu ? `Zdjecie produktu ${nazwaSprzetu}` : 'Zdjecie produktu',
      szczegoly,
      dopisek,
      preheader: czyZaakceptowany
        ? 'Twoj wniosek o wypozyczenie zostal zaakceptowany.'
        : 'Twoj wniosek o wypozyczenie zostal odrzucony.',
      branding
    })
  };
}
export function mailAktywacjaWypozyczenia({
  imie,
  nazwaSprzetu,
  zdjecieProduktuUrl,
  zdjecieUrl,
  dataOd,
  dataDo,
  wypozyczenieId,
  branding
} = {}) {
  const temat = 'Wypozyczenie zostalo aktywowane';
  const wstep = imie
    ? `Czesc ${imie}, Twoje wypozyczenie jest juz aktywne.`
    : 'Twoje wypozyczenie jest juz aktywne.';
  const zdjecieProduktu = pobierzZdjecieProduktuUrl(zdjecieProduktuUrl, zdjecieUrl);
  const szczegoly = [
    { etykieta: 'Sprzet', wartosc: nazwaSprzetu },
    { etykieta: 'Data od', wartosc: formatujDate(dataOd) },
    { etykieta: 'Data do', wartosc: formatujDate(dataDo) },
    { etykieta: 'Numer wypozyczenia', wartosc: wypozyczenieId }
  ];
  const dopisek = 'Pamietaj o terminowym zwrocie sprzetu.';

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      nazwaSprzetu && `Sprzet: ${nazwaSprzetu}`,
      zdjecieProduktu && `Zdjecie produktu: ${zdjecieProduktu}`,
      dataOd && `Data od: ${formatujDate(dataOd)}`,
      dataDo && `Data do: ${formatujDate(dataDo)}`,
      wypozyczenieId && `Numer wypozyczenia: ${wypozyczenieId}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      zdjecieProduktuUrl: zdjecieProduktu,
      altZdjeciaProduktu: nazwaSprzetu ? `Zdjecie produktu ${nazwaSprzetu}` : 'Zdjecie produktu',
      szczegoly,
      dopisek,
      preheader: 'Twoje wypozyczenie zostalo aktywowane.',
      branding
    })
  };
}

export function mailPotwierdzenieZwrotu({
  imie,
  nazwaSprzetu,
  zdjecieProduktuUrl,
  zdjecieUrl,
  dataZwrotu,
  wypozyczenieId,
  branding
} = {}) {
  const temat = 'Potwierdzenie zwrotu sprzetu';
  const wstep = imie
    ? `Czesc ${imie}, potwierdzamy zwrot sprzetu.`
    : 'Potwierdzamy zwrot sprzetu.';
  const dataZwrotuTekst = formatujDate(dataZwrotu || new Date());
  const zdjecieProduktu = pobierzZdjecieProduktuUrl(zdjecieProduktuUrl, zdjecieUrl);
  const szczegoly = [
    { etykieta: 'Sprzet', wartosc: nazwaSprzetu },
    { etykieta: 'Data zwrotu', wartosc: dataZwrotuTekst },
    { etykieta: 'Numer wypozyczenia', wartosc: wypozyczenieId }
  ];
  const dopisek = 'Dziekujemy za skorzystanie z wypozyczalni.';

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      nazwaSprzetu && `Sprzet: ${nazwaSprzetu}`,
      zdjecieProduktu && `Zdjecie produktu: ${zdjecieProduktu}`,
      `Data zwrotu: ${dataZwrotuTekst}`,
      wypozyczenieId && `Numer wypozyczenia: ${wypozyczenieId}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      zdjecieProduktuUrl: zdjecieProduktu,
      altZdjeciaProduktu: nazwaSprzetu ? `Zdjecie produktu ${nazwaSprzetu}` : 'Zdjecie produktu',
      szczegoly,
      dopisek,
      preheader: 'Zwrot sprzetu zostal potwierdzony.',
      branding
    })
  };
}

export function mailPrzypomnienieOZwrocie({
  imie,
  nazwaSprzetu,
  zdjecieProduktuUrl,
  zdjecieUrl,
  dataDo,
  wypozyczenieId,
  dniDoZwrotu,
  miejsceZwrotu,
  branding
} = {}) {
  const terminZwrotu = formatujDate(dataDo);
  const liczbaDni = Number(dniDoZwrotu);
  const opisTerminu = Number.isInteger(liczbaDni) && liczbaDni > 0
    ? `Termin zwrotu mija za ${liczbaDni} dni.`
    : 'Termin zwrotu zbliza sie.';
  const temat = 'Przypomnienie o zwrocie sprzetu';
  const wstep = imie
    ? `Czesc ${imie}, przypominamy o zblizajacym sie terminie zwrotu sprzetu.`
    : 'Przypominamy o zblizajacym sie terminie zwrotu sprzetu.';
  const zdjecieProduktu = pobierzZdjecieProduktuUrl(zdjecieProduktuUrl, zdjecieUrl);
  const szczegoly = [
    { etykieta: 'Sprzet', wartosc: nazwaSprzetu },
    { etykieta: 'Termin zwrotu', wartosc: terminZwrotu },
    { etykieta: 'Numer wypozyczenia', wartosc: wypozyczenieId },
    { etykieta: 'Miejsce zwrotu', wartosc: miejsceZwrotu }
  ];
  const dopisek = `${opisTerminu} Zwroc sprzet w terminie, aby uniknac dodatkowego kontaktu z obsluga.`;

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      nazwaSprzetu && `Sprzet: ${nazwaSprzetu}`,
      zdjecieProduktu && `Zdjecie produktu: ${zdjecieProduktu}`,
      terminZwrotu && `Termin zwrotu: ${terminZwrotu}`,
      wypozyczenieId && `Numer wypozyczenia: ${wypozyczenieId}`,
      miejsceZwrotu && `Miejsce zwrotu: ${miejsceZwrotu}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      zdjecieProduktuUrl: zdjecieProduktu,
      altZdjeciaProduktu: nazwaSprzetu ? `Zdjecie produktu ${nazwaSprzetu}` : 'Zdjecie produktu',
      szczegoly,
      dopisek,
      preheader: terminZwrotu
        ? `Przypomnienie o zwrocie do ${terminZwrotu}.`
        : 'Przypomnienie o zblizajacym sie zwrocie sprzetu.',
      branding
    })
  };
}

export function mailPrzeterminowanyZwrot({
  imie,
  nazwaSprzetu,
  zdjecieProduktuUrl,
  zdjecieUrl,
  dataDo,
  wypozyczenieId,
  dniPoTerminie,
  kontakt,
  branding
} = {}) {
  const terminZwrotu = formatujDate(dataDo);
  const liczbaDni = Number(dniPoTerminie);
  const opoznienie = Number.isInteger(liczbaDni) && liczbaDni > 0
    ? `${liczbaDni} dni po terminie`
    : 'po terminie';
  const temat = 'Zwrot sprzetu jest przeterminowany';
  const wstep = imie
    ? `Czesc ${imie}, termin zwrotu sprzetu juz minal.`
    : 'Termin zwrotu sprzetu juz minal.';
  const zdjecieProduktu = pobierzZdjecieProduktuUrl(zdjecieProduktuUrl, zdjecieUrl);
  const szczegoly = [
    { etykieta: 'Sprzet', wartosc: nazwaSprzetu },
    { etykieta: 'Termin zwrotu', wartosc: terminZwrotu },
    { etykieta: 'Opoznienie', wartosc: opoznienie },
    { etykieta: 'Numer wypozyczenia', wartosc: wypozyczenieId },
    { etykieta: 'Kontakt', wartosc: kontakt }
  ];
  const dopisek = kontakt
    ? `Skontaktuj sie z nami jak najszybciej: ${kontakt}.`
    : 'Skontaktuj sie z obsluga wypozyczalni jak najszybciej, aby ustalic zwrot sprzetu.';

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      nazwaSprzetu && `Sprzet: ${nazwaSprzetu}`,
      zdjecieProduktu && `Zdjecie produktu: ${zdjecieProduktu}`,
      terminZwrotu && `Termin zwrotu: ${terminZwrotu}`,
      `Opoznienie: ${opoznienie}`,
      wypozyczenieId && `Numer wypozyczenia: ${wypozyczenieId}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      zdjecieProduktuUrl: zdjecieProduktu,
      altZdjeciaProduktu: nazwaSprzetu ? `Zdjecie produktu ${nazwaSprzetu}` : 'Zdjecie produktu',
      szczegoly,
      dopisek,
      preheader: 'Termin zwrotu sprzetu juz minal.',
      branding
    })
  };
}

export function mailPrzypomnienieOOdbiorze({
  imie,
  nazwaSprzetu,
  zdjecieProduktuUrl,
  zdjecieUrl,
  dataOd,
  dataDo,
  wypozyczenieId,
  miejsceOdbioru,
  godzinyOdbioru,
  branding
} = {}) {
  const dataOdbioru = formatujDate(dataOd);
  const dataZwrotu = formatujDate(dataDo);
  const temat = 'Przypomnienie o odbiorze sprzetu';
  const wstep = imie
    ? `Czesc ${imie}, przypominamy o odbiorze zarezerwowanego sprzetu.`
    : 'Przypominamy o odbiorze zarezerwowanego sprzetu.';
  const zdjecieProduktu = pobierzZdjecieProduktuUrl(zdjecieProduktuUrl, zdjecieUrl);
  const szczegoly = [
    { etykieta: 'Sprzet', wartosc: nazwaSprzetu },
    { etykieta: 'Data odbioru', wartosc: dataOdbioru },
    { etykieta: 'Planowany zwrot', wartosc: dataZwrotu },
    { etykieta: 'Numer wypozyczenia', wartosc: wypozyczenieId },
    { etykieta: 'Miejsce odbioru', wartosc: miejsceOdbioru },
    { etykieta: 'Godziny odbioru', wartosc: godzinyOdbioru }
  ];
  const dopisek = 'Jesli nie mozesz odebrac sprzetu w tym terminie, skontaktuj sie z obsluga wypozyczalni.';

  return {
    temat,
    tekst: linieTekstu([
      temat,
      wstep,
      nazwaSprzetu && `Sprzet: ${nazwaSprzetu}`,
      zdjecieProduktu && `Zdjecie produktu: ${zdjecieProduktu}`,
      dataOdbioru && `Data odbioru: ${dataOdbioru}`,
      dataZwrotu && `Planowany zwrot: ${dataZwrotu}`,
      wypozyczenieId && `Numer wypozyczenia: ${wypozyczenieId}`,
      miejsceOdbioru && `Miejsce odbioru: ${miejsceOdbioru}`,
      godzinyOdbioru && `Godziny odbioru: ${godzinyOdbioru}`,
      dopisek
    ]),
    html: zbudujMailHtml({
      tytul: temat,
      wstep,
      zdjecieProduktuUrl: zdjecieProduktu,
      altZdjeciaProduktu: nazwaSprzetu ? `Zdjecie produktu ${nazwaSprzetu}` : 'Zdjecie produktu',
      szczegoly,
      dopisek,
      preheader: dataOdbioru
        ? `Przypomnienie o odbiorze ${dataOdbioru}.`
        : 'Przypomnienie o odbiorze zarezerwowanego sprzetu.',
      branding
    })
  };
}
export const formatyMaili = {
  mail2FA,
  mailKodRejestracji,
  mailPotwierdzenieZapytaniaWypozyczenia,
  mailDecyzjaWnioskuWypozyczenia,
  mailAktywacjaWypozyczenia,
  mailPotwierdzenieZwrotu,
  mailPrzypomnienieOZwrocie,
  mailPrzeterminowanyZwrot,
  mailPrzypomnienieOOdbiorze
};
