import {
  DocumentType,
  DocumentStatus,
  DocumentMetadata,
} from '../../modules/documents/entities/legal-document.entity';

/**
 * Legal document seed data for development and testing
 * Documents will be associated with sessions based on their index
 */
export interface DocumentSeedData {
  sessionIndex: number; // Index into sessions array
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  contentRaw: string | null;
  metadata: DocumentMetadata | null;
}

export const documentsSeedData: DocumentSeedData[] = [
  // Admin session documents
  {
    sessionIndex: 0, // Admin's lawyer session
    title: 'Pozew o zapłatę - Kowalski vs ABC Sp. z o.o.',
    type: DocumentType.LAWSUIT,
    status: DocumentStatus.COMPLETED,
    contentRaw: `# POZEW O ZAPŁATĘ

Warszawa, dnia 15 stycznia 2024 r.

Do Sądu Rejonowego dla m.st. Warszawy
Wydział Cywilny

**Powód:** Jan Kowalski, ul. Przykładowa 1, 00-001 Warszawa
**Pozwany:** ABC Sp. z o.o., ul. Biznesowa 10, 00-002 Warszawa

## Wartość przedmiotu sporu: 15 000,00 zł

### POZEW

o zapłatę kwoty 15 000,00 zł wraz z odsetkami ustawowymi za opóźnienie

**Wnoszę o:**

1. Zasądzenie od pozwanego na rzecz powoda kwoty 15 000,00 zł wraz z odsetkami ustawowymi za opóźnienie od dnia 1 grudnia 2023 r. do dnia zapłaty.
2. Zasądzenie od pozwanego kosztów procesu, w tym kosztów zastępstwa procesowego według norm przepisanych.

### UZASADNIENIE

Powód zawarł z pozwanym umowę o świadczenie usług...`,
    metadata: {
      plaintiffName: 'Jan Kowalski',
      defendantName: 'ABC Sp. z o.o.',
      claimAmount: 15000,
      claimCurrency: 'PLN',
    },
  },
  {
    sessionIndex: 0, // Admin's lawyer session
    title: 'Umowa najmu lokalu mieszkalnego',
    type: DocumentType.CONTRACT,
    status: DocumentStatus.COMPLETED,
    contentRaw: `# UMOWA NAJMU LOKALU MIESZKALNEGO

zawarta w dniu 10 lutego 2024 r. w Warszawie

pomiędzy:

**Wynajmującym:** Maria Nowak, PESEL: 12345678901
**Najemcą:** Tomasz Wiśniewski, PESEL: 98765432109

## § 1. PRZEDMIOT UMOWY

1. Wynajmujący oddaje Najemcy do używania lokal mieszkalny położony w Warszawie przy ul. Mieszkalnej 5/10.
2. Lokal składa się z 2 pokoi, kuchni, łazienki i przedpokoju o łącznej powierzchni 55 m².

## § 2. CZAS TRWANIA UMOWY

Umowa zostaje zawarta na czas określony od dnia 1 marca 2024 r. do dnia 28 lutego 2025 r.

## § 3. CZYNSZ

1. Najemca zobowiązuje się płacić czynsz w wysokości 3 500,00 zł miesięcznie.
2. Czynsz płatny jest z góry do 10-go dnia każdego miesiąca.`,
    metadata: {
      plaintiffName: 'Maria Nowak',
      defendantName: 'Tomasz Wiśniewski',
      claimAmount: 3500,
      claimCurrency: 'PLN',
    },
  },
  // Lawyer session documents
  {
    sessionIndex: 1, // Lawyer's active session
    title: 'Skarga na działanie organu administracji',
    type: DocumentType.COMPLAINT,
    status: DocumentStatus.COMPLETED,
    contentRaw: `# SKARGA

na bezczynność Burmistrza Miasta X

Do Wojewódzkiego Sądu Administracyjnego w Warszawie

**Skarżący:** ABC Development Sp. z o.o.
**Organ:** Burmistrz Miasta X

## I. PRZEDMIOT SKARGI

Na podstawie art. 3 § 2 pkt 8 ustawy Prawo o postępowaniu przed sądami administracyjnymi, wnoszę skargę na bezczynność Burmistrza Miasta X w sprawie wydania pozwolenia na budowę.

## II. UZASADNIENIE

Wniosek o wydanie pozwolenia na budowę został złożony w dniu 15 października 2023 r. Do dnia wniesienia skargi organ nie podjął żadnych czynności...`,
    metadata: {
      plaintiffName: 'ABC Development Sp. z o.o.',
    },
  },
  {
    sessionIndex: 1, // Lawyer's active session
    title: 'Pozew rozwodowy - projekt',
    type: DocumentType.LAWSUIT,
    status: DocumentStatus.DRAFT,
    contentRaw: null,
    metadata: {
      plaintiffName: 'Klient X',
      defendantName: 'Klient Y',
    },
  },
  {
    sessionIndex: 1, // Lawyer's active session
    title: 'Odpowiedź na pozew - generowanie',
    type: DocumentType.OTHER,
    status: DocumentStatus.GENERATING,
    contentRaw: null,
    metadata: null,
  },
  // Lawyer's completed session
  {
    sessionIndex: 2, // Lawyer's completed session
    title: 'Umowa sprzedaży nieruchomości',
    type: DocumentType.CONTRACT,
    status: DocumentStatus.COMPLETED,
    contentRaw: `# UMOWA SPRZEDAŻY NIERUCHOMOŚCI

Akt notarialny sporządzony w dniu 5 stycznia 2024 r.

## STRONY UMOWY

**Sprzedający:** Adam Malinowski
**Kupujący:** Ewa Kowalczyk

## PRZEDMIOT UMOWY

Nieruchomość gruntowa zabudowana budynkiem mieszkalnym jednorodzinnym, położona w miejscowości X, gmina Y, powiat Z, województwo mazowieckie, oznaczona w ewidencji gruntów jako działka nr 123/4 o powierzchni 0,1000 ha.

## CENA

Cena sprzedaży: 850 000,00 zł (słownie: osiemset pięćdziesiąt tysięcy złotych).`,
    metadata: {
      plaintiffName: 'Adam Malinowski',
      defendantName: 'Ewa Kowalczyk',
      claimAmount: 850000,
      claimCurrency: 'PLN',
    },
  },
  // Regular user session - failed document
  {
    sessionIndex: 3, // User's simple session
    title: 'Reklamacja usługi - nieudane generowanie',
    type: DocumentType.COMPLAINT,
    status: DocumentStatus.FAILED,
    contentRaw: null,
    metadata: {
      plaintiffName: 'Anna Nowak',
      defendantName: 'XYZ Usługi Sp. z o.o.',
    },
  },
];
