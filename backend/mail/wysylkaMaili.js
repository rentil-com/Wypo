import crypto from 'node:crypto';
import net from 'node:net';
import os from 'node:os';
import tls from 'node:tls';
import 'dotenv/config';

const CRLF = '\r\n';

function pobierzBoolEnv(nazwa, domyslnie = false) {
  const wartosc = process.env[nazwa];

  if (wartosc === undefined) {
    return domyslnie;
  }

  return ['1', 'true', 'tak', 'yes'].includes(String(wartosc).trim().toLowerCase());
}

function pobierzIntEnv(nazwa, domyslnie) {
  const wartosc = Number(process.env[nazwa]);

  return Number.isInteger(wartosc) && wartosc > 0
    ? wartosc
    : domyslnie;
}

function czyscNaglowek(wartosc) {
  return String(wartosc ?? '').replace(/[\r\n]+/g, ' ').trim();
}

function kodujNaglowek(wartosc) {
  const tekst = czyscNaglowek(wartosc);

  if (/^[\x20-\x7E]*$/.test(tekst)) {
    return tekst;
  }

  return `=?UTF-8?B?${Buffer.from(tekst, 'utf8').toString('base64')}?=`;
}

function kodujBase64(tekst) {
  return Buffer.from(String(tekst), 'utf8')
    .toString('base64')
    .replace(/.{1,76}/g, `$&${CRLF}`)
    .trimEnd();
}

function normalizujAdresy(adresy) {
  const lista = Array.isArray(adresy)
    ? adresy
    : String(adresy ?? '').split(',');

  return lista
    .map((adres) => czyscNaglowek(adres))
    .filter(Boolean);
}

function pobierzEmailZAdresu(adres) {
  const dopasowanie = /<([^>]+)>/.exec(adres);

  return czyscNaglowek(dopasowanie ? dopasowanie[1] : adres);
}

function formatujAdresNadawcy(email, nazwa) {
  const czystyEmail = pobierzEmailZAdresu(email);

  if (!nazwa) {
    return czystyEmail;
  }

  return `${kodujNaglowek(nazwa)} <${czystyEmail}>`;
}

function pobierzKonfiguracje() {
  const secure = pobierzBoolEnv('SMTP_SECURE', false);
  const host = process.env.SMTP_HOST;
  const port = pobierzIntEnv('SMTP_PORT', secure ? 465 : 587);
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;

  if (!host) {
    throw new Error('Brak SMTP_HOST w zmiennych srodowiskowych.');
  }

  if (!fromEmail) {
    throw new Error('Brak MAIL_FROM_EMAIL albo SMTP_USER w zmiennych srodowiskowych.');
  }

  return {
    host,
    port,
    secure,
    requireTls: pobierzBoolEnv('SMTP_REQUIRE_TLS', false),
    rejectUnauthorized: pobierzBoolEnv('SMTP_TLS_REJECT_UNAUTHORIZED', true),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromEmail,
    fromName: process.env.MAIL_FROM_NAME || process.env.MAIL_BRAND_NAME,
    timeoutMs: pobierzIntEnv('SMTP_TIMEOUT_MS', 15000)
  };
}

class KlientSmtp {
  constructor(socket) {
    this.buffer = '';
    this.oczekujacy = null;
    this.ustawSocket(socket);
  }

  ustawSocket(socket) {
    if (this.socket) {
      this.socket.removeAllListeners('data');
      this.socket.removeAllListeners('error');
      this.socket.removeAllListeners('close');
    }

    this.socket = socket;
    this.socket.setEncoding('utf8');
    this.socket.on('data', (chunk) => {
      this.buffer += chunk;
      this.przetworzBuffer();
    });
    this.socket.on('error', (err) => this.odrzucOdpowiedz(err));
    this.socket.on('close', () => {
      this.odrzucOdpowiedz(new Error('Polaczenie SMTP zostalo zamkniete.'));
    });
  }

  odrzucOdpowiedz(err) {
    if (!this.oczekujacy) {
      return;
    }

    const { reject } = this.oczekujacy;
    this.oczekujacy = null;
    reject(err);
  }

  przetworzBuffer() {
    if (!this.oczekujacy) {
      return;
    }

    let indeksNowejLinii = this.buffer.indexOf('\n');

    while (indeksNowejLinii !== -1 && this.oczekujacy) {
      const linia = this.buffer.slice(0, indeksNowejLinii).replace(/\r$/, '');
      this.buffer = this.buffer.slice(indeksNowejLinii + 1);
      this.oczekujacy.linie.push(linia);

      if (/^\d{3} /.test(linia)) {
        const odpowiedz = {
          kod: Number(linia.slice(0, 3)),
          linie: this.oczekujacy.linie
        };
        const { resolve } = this.oczekujacy;
        this.oczekujacy = null;
        resolve(odpowiedz);
      }

      indeksNowejLinii = this.buffer.indexOf('\n');
    }
  }

  czytajOdpowiedz() {
    if (this.oczekujacy) {
      throw new Error('Klient SMTP juz czeka na odpowiedz.');
    }

    return new Promise((resolve, reject) => {
      this.oczekujacy = {
        resolve,
        reject,
        linie: []
      };
      this.przetworzBuffer();
    });
  }

  async komenda(tekst, oczekiwaneKody) {
    this.socket.write(`${tekst}${CRLF}`);
    const odpowiedz = await this.czytajOdpowiedz();
    sprawdzKodOdpowiedzi(odpowiedz, oczekiwaneKody, tekst);

    return odpowiedz;
  }

  zamknij() {
    this.socket.end();
  }
}

function sprawdzKodOdpowiedzi(odpowiedz, oczekiwaneKody, kontekst) {
  if (oczekiwaneKody.includes(odpowiedz.kod)) {
    return;
  }

  throw new Error(`SMTP ${kontekst}: ${odpowiedz.linie.join(' ')}`);
}

function parsujMozliwosci(odpowiedz) {
  const mozliwosci = new Map();

  for (const linia of odpowiedz.linie) {
    const tekst = linia.slice(4).trim();
    const [klucz, ...wartosci] = tekst.split(/\s+/);

    if (klucz) {
      mozliwosci.set(klucz.toUpperCase(), wartosci.join(' '));
    }
  }

  return mozliwosci;
}

function lokalnaNazwaHosta() {
  const hostname = os.hostname();

  return hostname && hostname !== '(none)'
    ? hostname
    : 'localhost';
}

async function utworzPolaczenie(konfig) {
  const socket = konfig.secure
    ? tls.connect({
        host: konfig.host,
        port: konfig.port,
        servername: konfig.host,
        rejectUnauthorized: konfig.rejectUnauthorized
      })
    : net.connect({
        host: konfig.host,
        port: konfig.port
      });

  socket.setTimeout(konfig.timeoutMs, () => {
    socket.destroy(new Error('Przekroczono czas oczekiwania na SMTP.'));
  });

  await new Promise((resolve, reject) => {
    const event = konfig.secure ? 'secureConnect' : 'connect';

    socket.once(event, resolve);
    socket.once('error', reject);
  });

  const klient = new KlientSmtp(socket);
  const powitanie = await klient.czytajOdpowiedz();
  sprawdzKodOdpowiedzi(powitanie, [220], 'powitanie');

  return klient;
}

async function przywitajSerwer(klient) {
  const hostname = lokalnaNazwaHosta();

  try {
    const odpowiedz = await klient.komenda(`EHLO ${hostname}`, [250]);

    return parsujMozliwosci(odpowiedz);
  } catch {
    await klient.komenda(`HELO ${hostname}`, [250]);

    return new Map();
  }
}

async function wlaczStartTls(klient, konfig) {
  await klient.komenda('STARTTLS', [220]);

  const secureSocket = tls.connect({
    socket: klient.socket,
    servername: konfig.host,
    rejectUnauthorized: konfig.rejectUnauthorized
  });

  await new Promise((resolve, reject) => {
    secureSocket.once('secureConnect', resolve);
    secureSocket.once('error', reject);
  });

  klient.buffer = '';
  klient.ustawSocket(secureSocket);
}

async function zalogujSmtp(klient, konfig, mozliwosci) {
  if (!konfig.user || !konfig.password) {
    return;
  }

  const auth = String(mozliwosci.get('AUTH') || '').toUpperCase().split(/\s+/);

  if (auth.includes('PLAIN')) {
    const dane = Buffer.from(`\u0000${konfig.user}\u0000${konfig.password}`, 'utf8').toString('base64');
    await klient.komenda(`AUTH PLAIN ${dane}`, [235]);

    return;
  }

  await klient.komenda('AUTH LOGIN', [334]);
  await klient.komenda(Buffer.from(konfig.user, 'utf8').toString('base64'), [334]);
  await klient.komenda(Buffer.from(konfig.password, 'utf8').toString('base64'), [235]);
}

function zbudujCzesciWiadomosci({ tekst, html }) {
  if (tekst && html) {
    const boundary = `mail-alt-${crypto.randomBytes(12).toString('hex')}`;

    return {
      contentType: `multipart/alternative; boundary="${boundary}"`,
      body: [
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        kodujBase64(tekst),
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        kodujBase64(html),
        `--${boundary}--`
      ].join(CRLF)
    };
  }

  if (html) {
    return {
      contentType: 'text/html; charset=UTF-8',
      body: kodujBase64(html)
    };
  }

  return {
    contentType: 'text/plain; charset=UTF-8',
    body: kodujBase64(tekst)
  };
}

function zbudujWiadomosc({ adresaci, temat, tekst, html, nadawca, replyTo, messageId }) {
  if (!tekst && !html) {
    throw new Error('Mail musi miec pole tekst albo html.');
  }

  const czesci = zbudujCzesciWiadomosci({ tekst, html });
  const naglowki = [
    `From: ${nadawca}`,
    `To: ${adresaci.join(', ')}`,
    `Subject: ${kodujNaglowek(temat)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    `Content-Type: ${czesci.contentType}`,
    'Content-Transfer-Encoding: base64'
  ];

  if (czesci.contentType.startsWith('multipart/')) {
    naglowki.pop();
  }

  if (replyTo) {
    naglowki.push(`Reply-To: ${czyscNaglowek(replyTo)}`);
  }

  return `${naglowki.join(CRLF)}${CRLF}${CRLF}${czesci.body}`;
}

function przygotujDoData(wiadomosc) {
  return wiadomosc
    .replace(/\r?\n/g, CRLF)
    .split(CRLF)
    .map((linia) => (linia.startsWith('.') ? `.${linia}` : linia))
    .join(CRLF);
}

export async function wyslijMail({
  do: adresaciParam,
  to,
  adresat,
  adresaci,
  temat,
  tekst,
  html,
  nadawca,
  replyTo
}) {
  const konfig = pobierzKonfiguracje();
  const odbiorcy = normalizujAdresy(adresaciParam ?? to ?? adresat ?? adresaci);

  if (odbiorcy.length === 0) {
    throw new Error('Brak adresata maila.');
  }

  if (!temat) {
    throw new Error('Brak tematu maila.');
  }

  const fromEmail = pobierzEmailZAdresu(konfig.fromEmail);
  const messageId = `<${Date.now()}.${crypto.randomBytes(8).toString('hex')}@${lokalnaNazwaHosta()}>`;
  const klient = await utworzPolaczenie(konfig);

  try {
    let mozliwosci = await przywitajSerwer(klient);

    if (!konfig.secure && mozliwosci.has('STARTTLS')) {
      await wlaczStartTls(klient, konfig);
      mozliwosci = await przywitajSerwer(klient);
    } else if (!konfig.secure && konfig.requireTls) {
      throw new Error('Serwer SMTP nie obsluguje STARTTLS, a SMTP_REQUIRE_TLS=true.');
    }

    await zalogujSmtp(klient, konfig, mozliwosci);
    await klient.komenda(`MAIL FROM:<${fromEmail}>`, [250]);

    for (const odbiorca of odbiorcy) {
      await klient.komenda(`RCPT TO:<${pobierzEmailZAdresu(odbiorca)}>`, [250, 251]);
    }

    await klient.komenda('DATA', [354]);

    const wiadomosc = zbudujWiadomosc({
      adresaci: odbiorcy,
      temat,
      tekst,
      html,
      nadawca: nadawca || formatujAdresNadawcy(fromEmail, konfig.fromName),
      replyTo,
      messageId
    });

    klient.socket.write(`${przygotujDoData(wiadomosc)}${CRLF}.${CRLF}`);
    const odpowiedz = await klient.czytajOdpowiedz();
    sprawdzKodOdpowiedzi(odpowiedz, [250], 'DATA');
    await klient.komenda('QUIT', [221]);

    return {
      messageId,
      odbiorcy
    };
  } finally {
    klient.zamknij();
  }
}
