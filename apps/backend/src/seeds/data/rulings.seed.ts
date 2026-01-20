import {
  CourtType,
  RulingMetadata,
} from '../../modules/documents/entities/legal-ruling.entity';

/**
 * Legal ruling seed data for development and testing
 * Sample court decisions (orzecznictwo) for reference
 */
export interface RulingSeedData {
  signature: string;
  rulingDate: string; // YYYY-MM-DD format
  courtName: string;
  courtType: CourtType;
  summary: string | null;
  fullText: string | null;
  metadata: RulingMetadata | null;
}

export const rulingsSeedData: RulingSeedData[] = [
  // Supreme Court rulings
  {
    signature: 'III CZP 8/21',
    rulingDate: '2021-03-25',
    courtName: 'Sąd Najwyższy',
    courtType: CourtType.SUPREME_COURT,
    summary: `W razie nabycia wierzytelności od podmiotu, który uzyskał tytuł wykonawczy obejmujący
tę wierzytelność, nabywca może powołać się na przerwanie biegu przedawnienia, o którym mowa
w art. 123 § 1 pkt 1 KC, spowodowane wniesieniem pozwu przez zbywcę.`,
    fullText: `UCHWAŁA SKŁADU SIEDMIU SĘDZIÓW SĄDU NAJWYŻSZEGO

z dnia 25 marca 2021 r.

III CZP 8/21

Sąd Najwyższy w składzie:
SSN [...] - przewodniczący
SSN [...] - sprawozdawca
...

po rozpoznaniu w dniu 25 marca 2021 r. na posiedzeniu niejawnym zagadnienia prawnego
przedstawionego przez Sąd Najwyższy postanowieniem z dnia 10 grudnia 2020 r., sygn. akt III CZP 46/20

"Czy w razie nabycia wierzytelności od podmiotu, który uzyskał tytuł wykonawczy obejmujący tę wierzytelność,
nabywca może powołać się na przerwanie biegu przedawnienia, o którym mowa w art. 123 § 1 pkt 1 KC,
spowodowane wniesieniem pozwu przez zbywcę?"

podjął uchwałę:

W razie nabycia wierzytelności od podmiotu, który uzyskał tytuł wykonawczy obejmujący tę wierzytelność,
nabywca może powołać się na przerwanie biegu przedawnienia, o którym mowa w art. 123 § 1 pkt 1 KC,
spowodowane wniesieniem pozwu przez zbywcę.`,
    metadata: {
      legalArea: 'prawo cywilne',
      keywords: ['przedawnienie', 'cesja wierzytelności', 'przerwanie biegu przedawnienia'],
      relatedCases: ['III CZP 46/20'],
      sourceReference: 'https://sn.pl/orzecznictwo',
    },
  },
  {
    signature: 'I KZP 4/22',
    rulingDate: '2022-06-29',
    courtName: 'Sąd Najwyższy',
    courtType: CourtType.SUPREME_COURT,
    summary: `Przepis art. 46 § 1 k.k. nie stanowi podstawy do orzeczenia obowiązku naprawienia
szkody wyrządzonej przestępstwem, gdy sprawca ponosi odpowiedzialność wyłącznie za wykroczenie.`,
    fullText: null,
    metadata: {
      legalArea: 'prawo karne',
      keywords: ['naprawienie szkody', 'wykroczenie', 'przestępstwo'],
      sourceReference: 'https://sn.pl/orzecznictwo',
    },
  },
  // Appellate Court rulings
  {
    signature: 'I ACa 1234/23',
    rulingDate: '2023-11-15',
    courtName: 'Sąd Apelacyjny w Warszawie',
    courtType: CourtType.APPELLATE_COURT,
    summary: `Zadośćuczynienie za krzywdę doznaną wskutek wypadku komunikacyjnego powinno być
ustalone przy uwzględnieniu wszystkich okoliczności sprawy, w szczególności stopnia i czasu
trwania cierpień fizycznych i psychicznych, prognozy na przyszłość, wieku poszkodowanego
oraz wpływu doznanej szkody na jego życie osobiste i zawodowe.`,
    fullText: `WYROK W IMIENIU RZECZYPOSPOLITEJ POLSKIEJ

Dnia 15 listopada 2023 r.

Sąd Apelacyjny w Warszawie I Wydział Cywilny

w składzie:
Przewodniczący: SSA [...]
Sędziowie: SSA [...]

po rozpoznaniu w dniu 15 listopada 2023 r. w Warszawie
na rozprawie
sprawy z powództwa Jana K.
przeciwko Towarzystwu Ubezpieczeń XYZ S.A.
o zapłatę

na skutek apelacji pozwanego
od wyroku Sądu Okręgowego w Warszawie
z dnia 15 czerwca 2023 r., sygn. akt XXV C 1234/22

I. zmienia zaskarżony wyrok częściowo w ten sposób, że obniża zasądzoną kwotę
   zadośćuczynienia z 200 000 zł do 150 000 zł...`,
    metadata: {
      legalArea: 'prawo cywilne',
      keywords: ['zadośćuczynienie', 'wypadek komunikacyjny', 'krzywda', 'OC'],
      sourceReference: 'https://orzeczenia.ms.gov.pl',
    },
  },
  // Regional Court rulings
  {
    signature: 'XXV C 567/23',
    rulingDate: '2023-09-20',
    courtName: 'Sąd Okręgowy w Warszawie',
    courtType: CourtType.REGIONAL_COURT,
    summary: `Klauzula abuzywna dotycząca indeksacji kredytu do waluty obcej (CHF) jest bezskuteczna
wobec konsumenta i nie wiąże go od momentu zawarcia umowy. Bank nie może domagać się
od konsumenta zapłaty różnicy wynikającej z przeliczenia kredytu po kursie waluty obcej.`,
    fullText: null,
    metadata: {
      legalArea: 'prawo cywilne - ochrona konsumentów',
      keywords: ['kredyt frankowy', 'klauzula abuzywna', 'CHF', 'indeksacja'],
      sourceReference: 'https://orzeczenia.ms.gov.pl',
    },
  },
  {
    signature: 'IV P 89/23',
    rulingDate: '2023-07-12',
    courtName: 'Sąd Okręgowy w Krakowie',
    courtType: CourtType.REGIONAL_COURT,
    summary: `Zwolnienie dyscyplinarne pracownika wymaga uprzedniego wysłuchania pracownika
i umożliwienia mu złożenia wyjaśnień. Naruszenie tego obowiązku stanowi naruszenie
przepisów o wypowiadaniu umów o pracę.`,
    fullText: `WYROK W IMIENIU RZECZYPOSPOLITEJ POLSKIEJ

Dnia 12 lipca 2023 r.

Sąd Okręgowy w Krakowie IV Wydział Pracy

zasądza od pozwanego ABC Sp. z o.o. na rzecz powoda Jana Nowaka:
1. kwotę 15 000 zł tytułem odszkodowania za niezgodne z prawem rozwiązanie umowy o pracę
2. kwotę 3 600 zł tytułem kosztów zastępstwa procesowego

UZASADNIENIE

Powód był zatrudniony u pozwanego na stanowisku kierownika projektu od dnia 1 marca 2018 r.
W dniu 15 marca 2023 r. pozwany wręczył powodowi oświadczenie o rozwiązaniu umowy o pracę
bez wypowiedzenia z powodu ciężkiego naruszenia podstawowych obowiązków pracowniczych.

W ocenie Sądu, pozwany naruszył przepisy o rozwiązywaniu umów o pracę poprzez niezapewnienie
powodowi możliwości złożenia wyjaśnień przed podjęciem decyzji o zwolnieniu...`,
    metadata: {
      legalArea: 'prawo pracy',
      keywords: ['zwolnienie dyscyplinarne', 'prawo pracy', 'odszkodowanie', 'wysłuchanie pracownika'],
      sourceReference: 'https://orzeczenia.ms.gov.pl',
    },
  },
  // District Court ruling
  {
    signature: 'I C 2345/23',
    rulingDate: '2024-01-08',
    courtName: 'Sąd Rejonowy dla m.st. Warszawy',
    courtType: CourtType.DISTRICT_COURT,
    summary: `Konsument ma prawo do odstąpienia od umowy zawartej na odległość w terminie 14 dni
bez podawania przyczyny. Przedsiębiorca jest obowiązany zwrócić wszystkie płatności otrzymane
od konsumenta, w tym koszty dostarczenia rzeczy.`,
    fullText: null,
    metadata: {
      legalArea: 'prawo konsumenckie',
      keywords: ['umowa na odległość', 'odstąpienie od umowy', 'prawa konsumenta'],
      sourceReference: 'https://orzeczenia.ms.gov.pl',
    },
  },
  // Administrative Court ruling
  {
    signature: 'II SAB/Wa 123/23',
    rulingDate: '2023-12-05',
    courtName: 'Wojewódzki Sąd Administracyjny w Warszawie',
    courtType: CourtType.ADMINISTRATIVE_COURT,
    summary: `Organ administracji publicznej jest obowiązany załatwić sprawę bez zbędnej zwłoki.
Przekroczenie ustawowego terminu załatwienia sprawy stanowi bezczynność organu, która może
być przedmiotem skargi do sądu administracyjnego.`,
    fullText: null,
    metadata: {
      legalArea: 'prawo administracyjne',
      keywords: ['bezczynność organu', 'termin załatwienia sprawy', 'skarga administracyjna'],
      sourceReference: 'https://orzeczenia.nsa.gov.pl',
    },
  },
  // Constitutional Tribunal ruling
  {
    signature: 'K 15/20',
    rulingDate: '2021-10-07',
    courtName: 'Trybunał Konstytucyjny',
    courtType: CourtType.CONSTITUTIONAL_TRIBUNAL,
    summary: `Przepis art. 1 ust. 1 lit. a) Konwencji o ochronie praw człowieka i podstawowych wolności
jest niezgodny z art. 2, art. 8 ust. 1 oraz art. 90 ust. 1 w związku z art. 4 ust. 1 Konstytucji
Rzeczypospolitej Polskiej w zakresie, w jakim dotyczy norm Konwencji...`,
    fullText: null,
    metadata: {
      legalArea: 'prawo konstytucyjne',
      keywords: ['konstytucja', 'EKPC', 'hierarchia norm', 'prawo międzynarodowe'],
      sourceReference: 'https://trybunal.gov.pl',
    },
  },
];
