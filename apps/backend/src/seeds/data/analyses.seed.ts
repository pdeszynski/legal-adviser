import {
  AnalysisStatus,
  LegalGround,
  AnalysisMetadata,
} from '../../modules/documents/entities/legal-analysis.entity';

/**
 * Legal analysis seed data for development and testing
 * Analyses will be associated with sessions based on their index
 */
export interface AnalysisSeedData {
  sessionIndex: number;
  title: string;
  inputDescription: string;
  status: AnalysisStatus;
  overallConfidenceScore: number | null;
  identifiedGrounds: LegalGround[] | null;
  summary: string | null;
  recommendations: string | null;
  errorMessage: string | null;
  metadata: AnalysisMetadata | null;
}

export const analysesSeedData: AnalysisSeedData[] = [
  // Admin session analysis - completed
  {
    sessionIndex: 0,
    title: 'Analiza sprawy o odszkodowanie komunikacyjne',
    inputDescription: `Mój klient uczestniczył w wypadku komunikacyjnym dnia 15 marca 2023 r.
Sprawca wypadku nie zachował należytej ostrożności i zderzył się z samochodem klienta na skrzyżowaniu.
Klient doznał obrażeń ciała (złamanie kości udowej, wstrząśnienie mózgu) i był hospitalizowany przez 3 tygodnie.
Samochód klienta został całkowicie zniszczony (wartość pojazdu: 45 000 zł).
Klient domaga się odszkodowania za zniszczony pojazd, zadośćuczynienia za doznaną krzywdę oraz zwrotu kosztów leczenia.`,
    status: AnalysisStatus.COMPLETED,
    overallConfidenceScore: 0.92,
    identifiedGrounds: [
      {
        name: 'Odpowiedzialność deliktowa sprawcy wypadku',
        description:
          'Na podstawie art. 415 KC sprawca wypadku ponosi odpowiedzialność za szkodę wyrządzoną z winy własnej',
        confidenceScore: 0.95,
        legalBasis: ['Art. 415 KC', 'Art. 436 KC'],
        notes: 'Silna podstawa prawna, sprawca naruszył przepisy ruchu drogowego',
      },
      {
        name: 'Odpowiedzialność ubezpieczyciela OC',
        description:
          'Ubezpieczyciel sprawcy odpowiada w ramach obowiązkowego ubezpieczenia OC posiadaczy pojazdów',
        confidenceScore: 0.98,
        legalBasis: ['Art. 822 KC', 'Ustawa o ubezpieczeniach obowiązkowych'],
        notes: 'Standardowa ścieżka dochodzenia roszczeń',
      },
      {
        name: 'Zadośćuczynienie za krzywdę',
        description:
          'Poszkodowany może żądać zadośćuczynienia pieniężnego za doznaną krzywdę (ból, cierpienie)',
        confidenceScore: 0.88,
        legalBasis: ['Art. 445 § 1 KC'],
        notes:
          'Wysokość zadośćuczynienia zależy od rozmiaru krzywdy i okoliczności sprawy',
      },
    ],
    summary: `Sprawa ma bardzo silne podstawy prawne. Odpowiedzialność sprawcy i jego ubezpieczyciela jest bezsporna.
Poszkodowany ma prawo do pełnego odszkodowania za zniszczony pojazd (45 000 zł), zwrotu udokumentowanych kosztów leczenia
oraz zadośćuczynienia za doznaną krzywdę. Szacowane zadośćuczynienie: 50 000 - 80 000 zł przy uwzględnieniu charakteru
obrażeń i okresu hospitalizacji.`,
    recommendations: `1. Zgromadzić pełną dokumentację medyczną leczenia
2. Uzyskać opinię biegłego ds. rekonstrukcji wypadków
3. Wystąpić z roszczeniem do ubezpieczyciela OC sprawcy
4. W przypadku odmowy - rozważyć postępowanie sądowe
5. Rozważyć powołanie biegłego medycznego w celu oceny trwałego uszczerbku na zdrowiu`,
    errorMessage: null,
    metadata: {
      modelUsed: 'gpt-4-turbo',
      processingTimeMs: 15234,
      analysisVersion: '1.0.0',
    },
  },
  // Lawyer session analysis - processing
  {
    sessionIndex: 1,
    title: 'Analiza sprawy pracowniczej',
    inputDescription: `Pracownik został zwolniony dyscyplinarnie po 10 latach pracy w firmie.
Przyczyną zwolnienia było rzekome naruszenie obowiązków pracowniczych polegające na
spóźnieniu się do pracy o 15 minut. Pracownik twierdzi, że spóźnienie było jednorazowe
i wynikało z awarii komunikacji miejskiej. Pracodawca nie przeprowadził rozmowy dyscyplinarnej
ani nie wysłuchał pracownika przed podjęciem decyzji o zwolnieniu.`,
    status: AnalysisStatus.PROCESSING,
    overallConfidenceScore: null,
    identifiedGrounds: null,
    summary: null,
    recommendations: null,
    errorMessage: null,
    metadata: {
      modelUsed: 'gpt-4-turbo',
      analysisVersion: '1.0.0',
    },
  },
  // Lawyer session analysis - pending
  {
    sessionIndex: 1,
    title: 'Analiza sprawy spadkowej',
    inputDescription: `Spadkodawca zmarł 5 stycznia 2024 r. pozostawiając testament własnoręczny.
W testamencie zapisał cały majątek (mieszkanie i oszczędności) osobie trzeciej spoza rodziny.
Najbliższa rodzina (żona i dwoje dzieci) została pominięta w testamencie.
Rodzina chce dochodzić swoich praw do zachowku.`,
    status: AnalysisStatus.PENDING,
    overallConfidenceScore: null,
    identifiedGrounds: null,
    summary: null,
    recommendations: null,
    errorMessage: null,
    metadata: null,
  },
  // Regular user session analysis - completed simple
  {
    sessionIndex: 3,
    title: 'Prosta analiza - reklamacja towaru',
    inputDescription: `Kupiłem telewizor w sklepie internetowym. Po 3 miesiącach użytkowania
telewizor przestał działać. Sklep odmawia przyjęcia reklamacji twierdząc, że uszkodzenie
powstało z mojej winy. Czy mam prawo do reklamacji?`,
    status: AnalysisStatus.COMPLETED,
    overallConfidenceScore: 0.85,
    identifiedGrounds: [
      {
        name: 'Rękojmia za wady fizyczne',
        description:
          'Sprzedawca odpowiada za wady fizyczne towaru istniejące w chwili przejścia niebezpieczeństwa na kupującego',
        confidenceScore: 0.88,
        legalBasis: ['Art. 556 KC', 'Art. 5562 KC'],
        notes:
          'Domniemanie wady istniejącej w chwili wydania towaru - do 2 lat od zakupu',
      },
      {
        name: 'Prawa konsumenta',
        description:
          'Konsument ma prawo do wymiany towaru lub odstąpienia od umowy w przypadku istotnej wady',
        confidenceScore: 0.82,
        legalBasis: ['Art. 560 KC', 'Art. 561 KC'],
      },
    ],
    summary: `Jako konsument masz prawo do reklamacji towaru w ramach rękojmi przez 2 lata od zakupu.
W ciągu pierwszego roku to sprzedawca musi udowodnić, że wada powstała z Twojej winy.
Możesz żądać naprawy, wymiany lub zwrotu pieniędzy.`,
    recommendations: `1. Złóż reklamację pisemnie z powołaniem na rękojmię (art. 556 KC)
2. Zażądaj naprawy lub wymiany na nowy egzemplarz
3. Jeśli sklep nie odpowie w ciągu 14 dni - reklamacja uznana automatycznie
4. W przypadku dalszej odmowy - złóż skargę do rzecznika konsumentów`,
    errorMessage: null,
    metadata: {
      modelUsed: 'gpt-4-turbo',
      processingTimeMs: 8542,
      analysisVersion: '1.0.0',
    },
  },
  // Failed analysis
  {
    sessionIndex: 1,
    title: 'Analiza - nieudane przetwarzanie',
    inputDescription: 'Test przypadku błędu podczas analizy.',
    status: AnalysisStatus.FAILED,
    overallConfidenceScore: null,
    identifiedGrounds: null,
    summary: null,
    recommendations: null,
    errorMessage: 'AI service timeout - request exceeded maximum processing time',
    metadata: {
      modelUsed: 'gpt-4-turbo',
      analysisVersion: '1.0.0',
    },
  },
];
