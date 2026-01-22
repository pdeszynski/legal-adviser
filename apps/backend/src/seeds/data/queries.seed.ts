import { Citation } from '../../modules/queries/entities/legal-query.entity';

/**
 * Legal query seed data for development and testing
 * Q&A conversations will be associated with sessions based on their index
 */
export interface QuerySeedData {
  sessionIndex: number;
  question: string;
  answerMarkdown: string | null;
  citations: Citation[] | null;
}

export const queriesSeedData: QuerySeedData[] = [
  // Admin session queries
  {
    sessionIndex: 0,
    question: 'Jakie są terminy przedawnienia roszczeń w prawie cywilnym?',
    answerMarkdown: `## Terminy przedawnienia roszczeń w prawie cywilnym

Zgodnie z **Kodeksem cywilnym**, terminy przedawnienia roszczeń kształtują się następująco:

### Ogólne terminy przedawnienia (art. 118 KC)
- **6 lat** - ogólny termin przedawnienia
- **3 lata** - dla roszczeń o świadczenia okresowe oraz roszczeń związanych z prowadzeniem działalności gospodarczej

### Szczególne terminy przedawnienia
- **2 lata** - roszczenia z tytułu sprzedaży dokonanej w zakresie działalności przedsiębiorstwa
- **2 lata** - roszczenia z umowy o dzieło
- **3 lata** - roszczenia o naprawienie szkody wyrządzonej czynem niedozwolonym
- **10 lat** - roszczenia o naprawienie szkody wynikłej ze zbrodni lub występku

### Ważne zasady
1. Koniec terminu przedawnienia przypada na **ostatni dzień roku kalendarzowego**
2. Bieg przedawnienia można **przerwać** przez:
   - wniesienie pozwu
   - wszczęcie mediacji
   - uznanie roszczenia przez dłużnika

*Ostatnia nowelizacja: ustawa z 13 kwietnia 2018 r. skróciła podstawowy termin z 10 do 6 lat.*`,
    citations: [
      {
        source: 'Kodeks cywilny',
        article: 'Art. 118',
        excerpt:
          'Jeżeli przepis szczególny nie stanowi inaczej, termin przedawnienia wynosi sześć lat...',
      },
      {
        source: 'Kodeks cywilny',
        article: 'Art. 123',
        excerpt:
          'Bieg przedawnienia przerywa się przez każdą czynność przed sądem...',
      },
      {
        source: 'Ustawa z dnia 13 kwietnia 2018 r.',
        excerpt:
          'o zmianie ustawy - Kodeks cywilny oraz niektórych innych ustaw',
        url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20180001104',
      },
    ],
  },
  {
    sessionIndex: 0,
    question: 'Jak wygląda procedura zwolnienia dyscyplinarnego pracownika?',
    answerMarkdown: `## Procedura zwolnienia dyscyplinarnego (art. 52 KP)

### Przesłanki zwolnienia dyscyplinarnego
Pracodawca może rozwiązać umowę o pracę bez wypowiedzenia z winy pracownika w przypadku:
1. **Ciężkiego naruszenia podstawowych obowiązków pracowniczych**
2. Popełnienia przez pracownika przestępstwa
3. Zawinionej utraty uprawnień koniecznych do wykonywania pracy

### Procedura
1. **Ustalenie okoliczności** - zebranie dowodów naruszenia
2. **Wysłuchanie pracownika** - umożliwienie złożenia wyjaśnień
3. **Konsultacja ze związkami zawodowymi** (jeśli działają w zakładzie)
4. **Sporządzenie pisemnego oświadczenia** z podaniem przyczyny
5. **Doręczenie oświadczenia pracownikowi**

### Terminy
- **1 miesiąc** od uzyskania przez pracodawcę wiadomości o okoliczności uzasadniającej rozwiązanie

### Pouczenie
Oświadczenie musi zawierać pouczenie o prawie odwołania do sądu pracy (21 dni na wniesienie odwołania).`,
    citations: [
      {
        source: 'Kodeks pracy',
        article: 'Art. 52',
        excerpt:
          'Pracodawca może rozwiązać umowę o pracę bez wypowiedzenia z winy pracownika...',
      },
      {
        source: 'Kodeks pracy',
        article: 'Art. 30 § 4',
        excerpt:
          'W oświadczeniu pracodawcy o wypowiedzeniu umowy o pracę lub jej rozwiązaniu bez wypowiedzenia powinna być wskazana przyczyna...',
      },
    ],
  },
  // Lawyer session queries
  {
    sessionIndex: 1,
    question: 'Jakie są warunki uzyskania zachowku?',
    answerMarkdown: `## Zachowek - podstawowe informacje

### Kto ma prawo do zachowku?
Zgodnie z **art. 991 KC**, zachowek przysługuje:
- Zstępnym spadkodawcy (dzieci, wnuki)
- Małżonkowi
- Rodzicom spadkodawcy

*którzy byliby powołani do spadku z ustawy*

### Wysokość zachowku
- **2/3 wartości udziału spadkowego** - dla osób trwale niezdolnych do pracy lub małoletnich zstępnych
- **1/2 wartości udziału spadkowego** - w pozostałych przypadkach

### Termin dochodzenia
Roszczenie o zachowek przedawnia się z upływem **5 lat** od ogłoszenia testamentu.

### Jak obliczyć zachowek?
1. Ustal wartość spadku (stan z chwili otwarcia, ceny z chwili orzekania)
2. Dolicz darowizny uczynione przez spadkodawcę
3. Oblicz udział spadkowy przy dziedziczeniu ustawowym
4. Zastosuj odpowiedni ułamek (1/2 lub 2/3)`,
    citations: [
      {
        source: 'Kodeks cywilny',
        article: 'Art. 991',
        excerpt:
          'Zstępnym, małżonkowi oraz rodzicom spadkodawcy, którzy byliby powołani do spadku z ustawy, należą się...',
      },
      {
        source: 'Kodeks cywilny',
        article: 'Art. 1007',
        excerpt:
          'Roszczenia uprawnionego z tytułu zachowku przedawniają się z upływem lat pięciu...',
      },
    ],
  },
  {
    sessionIndex: 1,
    question: 'Czym różni się rękojmia od gwarancji?',
    answerMarkdown: null, // Answer not yet generated
    citations: null,
  },
  // Regular user session queries
  {
    sessionIndex: 3,
    question: 'Czy mogę zwrócić towar kupiony przez internet?',
    answerMarkdown: `## Prawo do zwrotu towaru kupionego przez internet

### Tak! Masz prawo odstąpić od umowy w ciągu 14 dni

Zgodnie z **ustawą o prawach konsumenta**, jako konsument masz prawo odstąpić od umowy zawartej na odległość (przez internet) **bez podawania przyczyny** w terminie **14 dni** od otrzymania towaru.

### Jak to zrobić?
1. Złóż oświadczenie o odstąpieniu (można użyć wzoru z załącznika do ustawy)
2. Odeślij towar w ciągu 14 dni od złożenia oświadczenia
3. Sklep ma 14 dni na zwrot pieniędzy

### Co ważne
- Możesz sprawdzić towar (tak jak w sklepie stacjonarnym)
- Ponosisz koszty odesłania towaru (chyba że sklep zgodził się je pokryć)
- Sprzedawca nie może żądać "opłaty za sprawdzenie"

### Wyjątki (towary, których nie można zwrócić)
- Rzeczy personalizowane (np. koszulka z Twoim nadrukiem)
- Nagrania audio/video i programy po usunięciu oryginalnego opakowania
- Towary szybko psujące się`,
    citations: [
      {
        source: 'Ustawa o prawach konsumenta',
        article: 'Art. 27',
        excerpt:
          'Konsument, który zawarł umowę na odległość, może w terminie 14 dni odstąpić od niej bez podawania przyczyny...',
        url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20140000827',
      },
      {
        source: 'Ustawa o prawach konsumenta',
        article: 'Art. 38',
        excerpt:
          'Prawo odstąpienia od umowy zawartej poza lokalem przedsiębiorstwa lub na odległość nie przysługuje konsumentowi w odniesieniu do umów...',
      },
    ],
  },
  // Minimal user session query
  {
    sessionIndex: 4,
    question: 'Jak założyć firmę jednoosobową?',
    answerMarkdown: `## Jak założyć jednoosobową działalność gospodarczą

### Krok 1: Rejestracja w CEIDG
Wypełnij wniosek **CEIDG-1** przez internet na [biznes.gov.pl](https://www.biznes.gov.pl) lub osobiście w urzędzie gminy.

### Krok 2: Dane potrzebne do rejestracji
- Imię i nazwisko, PESEL
- Adres zamieszkania i adres firmy
- Nazwa firmy (musi zawierać Twoje imię i nazwisko)
- Kody PKD (rodzaj działalności)
- Data rozpoczęcia działalności

### Krok 3: Zgłoszenie do ZUS
W ciągu 7 dni od rozpoczęcia działalności zgłoś się do ubezpieczeń (ZUA lub ZZA).

### Krok 4: Wybór formy opodatkowania
- Skala podatkowa (17% i 32%)
- Podatek liniowy (19%)
- Ryczałt od przychodów
- Karta podatkowa (ograniczone możliwości)

### Koszty
Rejestracja w CEIDG jest **bezpłatna**!

### Czas
Wpis do CEIDG następuje **następnego dnia roboczego** po złożeniu wniosku.`,
    citations: [
      {
        source:
          'Ustawa o Centralnej Ewidencji i Informacji o Działalności Gospodarczej',
        url: 'https://www.biznes.gov.pl/pl/opisy-procedur/-/proc/739',
        excerpt: 'Wniosek o wpis do CEIDG można złożyć drogą elektroniczną...',
      },
    ],
  },
];
