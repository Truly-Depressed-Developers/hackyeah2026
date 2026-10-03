import type { components } from './schema.js'

type Result = components['schemas']['Result']

const BIBLIOTEKA = 'Biblioteka Innowacji Społecznych'

export const solutions: Result[] = [
  {
    id: 'dla-seniorow__organizator-kompleksowej-opieki-w-miejscu-zamieszkania',
    kind: 'innovation',
    title: 'Organizator kompleksowej opieki w miejscu zamieszkania',
    summary: 'Organizator kompleksowej opieki w miejscu zamieszkania to program pracy z osobami starszymi, obciążonymi wieloma dolegliwościami a także osobami, których stan zdrowia i funkcjonowania gwałtownie się pogorszył.',
    category: 'Innowacje dla seniorów',
    why: 'Pomaga rodzinie zorganizować opiekę w domu, gdy bliski nagle przestaje być samodzielny, np. po udarze.',
    source: { label: BIBLIOTEKA, url: 'https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow,organizator-kompleksowej-opieki-w-miejscu-zamieszkania' },
    details: {
      problem: 'Innowacja odpowiada na problem dezorientacji rodziny/opiekunów w przypadku nagłego pojawienia się w domu osoby wymagającej stałego wsparcia medycznego, trudności związanych z organizacją opieki i zapewnienia niezbędnego sprzętu.',
      targetGroup: 'Odbiorcami innowacji mogą być osoby, które osiągnęły stan umożliwiający im opuszczenie szpitala, ale wymagają intensywnej opieki domowej wynikającej z zaawansowanego wieku, utrudniającego rekonwalescencję lub ich stan zdrowia i samodzielności znacząco zmienił się podczas hospitalizacji. Równocześnie innowacja wspiera osoby, które mieszkają z pacjentem i stają się jego naturalnymi opiekunami.',
      effectiveness: 'Wdrożenie modelu "Organizator kompleksowej opieki w miejscu zamieszkania" skutecznie pozwala wspierać rodzinę stającą przed wyzwaniem opieki nad chorym członkiem rodziny i niweluje stres związany z tą sytuacją.',
    },
    links: {
      pdf: 'https://rops.krakow.pl/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/01_model_COD.pdf',
      download: 'https://rops.krakow.pl/pliki/IS/bibloteka/organizatorkompleksowejopieki.zip',
    },
  },
  {
    id: 'dla-zdrowia-i-medycyny__inteligentny-organizer-do-lekow',
    kind: 'innovation',
    title: 'Inteligentny organizer do leków',
    summary: 'Innowację stanowi inteligentne narzędzie w formie organizera na leki, wyposażonego w czujniki umożliwiające detekcję pobrania leku, system sygnalizacji świetlnej uruchamiającej się o określonej godzinie, kiedy powinien być zażyty konkretny lek oraz specjalnie opracowanej aplikacji mobilnej.',
    category: 'Innowacje dla zdrowia i medycyny',
    why: 'Odciąża opiekuna rodzinnego w pilnowaniu leków osoby, którą się opiekuje.',
    source: { label: BIBLIOTEKA, url: 'https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-zdrowia-i-medycyny,inteligentny-organizer-do-lekow' },
    details: {
      problem: 'Innowacja stanowi odpowiedź na wyzwania związane ze sprawowaniem opieki przez opiekunów rodzinnych/nieformalnych np. nad rodzicem w starszym wieku.',
      targetGroup: 'Osoby starsze (które samodzielnie zarządzają przyjmowaniem przez siebie leków przyjmowanych „na stałe” oraz posiadają umiejętność posługiwania się smartfonem) oraz ich opiekunowie (kontrolujących przyjmowanie leków przez podopiecznych).',
      effectiveness: 'W kontekście zdefiniowanych w projekcie potrzeb opiekunów urządzenie należy uznać za wysoce użyteczne, jednak obarczone pewnymi wyzwaniami. Kluczowy jest problem zdolności osób korzystających z urządzenia do jego montażu oraz późniejszej obsługi (np. w przypadku błędów). Koniecznym jest również poprowadzenie dalszych prac w celu zapewnienia bezawaryjnego działania urządzenia (wszelkie problemy pojawiające się na etapie testowania prototypu obniżały zaufanie do innowacji i motywację do korzystania), co oznacza konieczność prowadzenia asysty technicznej urządzeń.',
    },
    links: {
      download: 'https://rops.krakow.pl/pliki/IS/bibloteka/inteligentnyorganizer.zip',
    },
  },
  {
    id: 'dla-seniorow__bawita',
    kind: 'innovation',
    title: 'BaWita',
    summary: 'Narzędzie rehabilitacyjne w postaci drewnianej tablicy wyposażonej w siedem ruchomych elementów służących do wielopłaszczyznowej stymulacji i usprawniania funkcji pamięciowych, manualnych i organizacji dnia dla osób ze schorzeniami dementywnymi.',
    category: 'Innowacje dla seniorów',
    why: 'Wspiera rehabilitację pamięci i sprawności rąk u osób po udarze.',
    source: { label: BIBLIOTEKA, url: 'https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow,bawita' },
    details: {
      problem: 'Innowacja odpowiada na problem rozpowszechnianiasię zespołów otępiennych u osób w podeszłym wieku i pozwala zwiększyć ograniczony wachlarz narzędzi rehabilitacyjnych dedykowanych osobom dorosłym.',
      targetGroup: 'Dorosłe osoby cierpiące na zespół otępienny we wczesnym stadium oraz osoby rehabilitowane pamięciowo po udarach i wylewach.',
      effectiveness: 'Test innowacji potwierdził jej skuteczność w procesie poprawy pamięci proceduralnej. Wykazał także szereg dodatkowych istotnych dla rehabilitacji osób starszych efektów – poprawa motoryki małej, rozwijanie wyobraźni, skojarzeń, poprawa fluencji i rozbudowywanie pomięci słownej, a nawet poprawa funkcjonowania społecznego i integracji.',
    },
    links: {
      video: 'https://www.youtube.com/watch?v=o7UhDlebLJo',
      pdf: 'https://rops.krakow.pl/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/ROPS_Folder_IN_BaWita_v15_www.pdf',
      download: 'https://rops.krakow.pl/pliki/IS/bibloteka/bawita.zip',
    },
  },
]

export const related: Result[] = [
  {
    id: 'dla-seniorow__therapy-set',
    kind: 'innovation',
    title: 'Therapy Set',
    summary: 'Therapy Set to zestaw pomocy terapeutycznych przeznaczony dla osób starszych, w szczególności mieszkańców Domów Pomocy Społecznej. Zestaw składa się z siedmiu pomocy umożliwiających kompleksową terapię seniorów.',
    category: 'Innowacje dla seniorów',
    why: 'Terapia zajęciowa dla osób leżących lub mało mobilnych — pomocna w opiece domowej, choć nie dotyczy samej organizacji opieki.',
    source: { label: BIBLIOTEKA, url: 'https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow,therapy-set' },
    details: {
      problem: 'Innowacja jest odpowiedzią na ograniczoną dostępność terapii zajęciowej dla części seniorów (osób leżących, niemobilnych).',
      targetGroup: 'Osoby starsze wymagające opieki w miejscu zamieszkania i ich opiekunowie, mieszkańcy DPS i innych ośrodków pobytu dziennego.',
    },
    links: {
      pdf: 'https://rops.krakow.pl/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/Zasady_wykorzystania_innowacji_MIIS.pdf',
      download: 'https://rops.krakow.pl/pliki/IS/bibloteka/therapyset.zip',
    },
  },
  {
    id: 'dla-seniorow__obu-obuwie-po-domu',
    kind: 'innovation',
    title: 'Obu – obuwie po domu',
    summary: 'Innowacją jest model obuwia domowego dla osób starszych. Obuwie to charakteryzuje się antypoślizgowością, optymalnym dopasowaniem do stopy, a także antybakteryjnością, dzięki czemu łatwo jest je utrzymać w czystości.',
    category: 'Innowacje dla seniorów',
    why: 'Zmniejsza ryzyko upadków osoby starszej w domu — ważne przy opiece, ale to tylko jeden jej element.',
    source: { label: BIBLIOTEKA, url: 'https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow,obu-obuwie-po-domu' },
    details: {
      problem: 'Innowacja jest odpowiedzią na zwiększone ryzyko upadków seniorów - według badań co trzecia osoba po 65. roku życia jest narażona na upadek przynajmniej raz w roku. Do większości wypadków dochodzi w domu (80% wypadków w grupie wiekowej 85-89 lat). Jedną z przyczyn są śliskie podłogi i nieodpowiednie, źle dobrane obuwie domowe. Większość seniorów po złamaniach powstałych w wyniku upadku nie wraca do pełnej sprawności, często wymaga pomocy lub wsparcia otoczenia. Ponadto sam lęk przed upadkiem może zahamować jakąkolwiek aktywność ruchową osoby starszej.',
      targetGroup: 'Osoby starsze, powyżej 65. roku życia, z dysfunkcjami w zakresie małej i/lub dużej motoryki (w tym problemy z fizjonomią stopy, np. tzw. haluksy) oraz dysfunkcjami wzroku.',
      effectiveness: 'Zaprojektowane obuwie domowe wpływa korzystnie na zwiększenie mobilności i bezpieczeństwa osób starszych. Dzięki specjalnemu obuwiu seniorzy poruszają się pewniej i stają się bardziej niezależni. Obuwie to może być z powodzeniem wykorzystywane zarówno w domu, jak i w szpitalu czy sanatorium.',
    },
    links: {
      pdf: 'https://rops.krakow.pl/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/Zasady_wykorzystania_innowacji_MIIS.pdf',
      download: 'https://rops.krakow.pl/pliki/IS/bibloteka/obuobuwie.zip',
    },
  },
  {
    id: 'dla-seniorow__sciezka-motosensoryczna',
    kind: 'innovation',
    title: 'Ścieżka motosensoryczna',
    summary: 'Ścieżka motosensoryczna ma za zadanie oswajać z przestrzenią miejską osoby, które z przyczyn obniżonej sprawności doświadczają lęków i przestają korzystać z przestrzeni publicznych miasta.',
    category: 'Innowacje dla seniorów',
    why: 'Rehabilitacja ruchowa „przy okazji” codziennych czynności — przydatna po udarze, ale wymaga placówki.',
    source: { label: BIBLIOTEKA, url: 'https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow,sciezka-motosensoryczna' },
    details: {
      problem: '"Ścieżka moto-sensoryczna" daje możliwość realizowania rehabilitacji "przy okazji", w międzyczasie wykonywania codziennych aktywności, jak na przykład droga do sklepu, przychodni, etc. Jej walorem jest elastyczność finansowa wdrożenia: możliwość wykorzystania i adaptacji istniejących elementów infrastruktury przestrzeni jako stanowisk ćwiczeniowych, oraz możliwość dowolnego rozbudowywania lub zmniejszania projektu co decyduje o dużej elastyczności kosztów w przypadku wdrażania.',
      targetGroup: 'Odbiorcami rozwiązania są osoby starsze i osoby z niepełnosprawnościami (ze szczególnym uwzględnieniem dysfunkcji narządu ruchu). Korzystanie ze „Ścieżki moto-sensorycznej” pozwoli kontynuować program terapeutyczny poza specjalistycznymi ośrodkami zajmującymi się fizjoterapią i dzięki temu może zatrzymać lub spowolnić proces obniżającego się poziomu sprawności u użytkowników.',
      effectiveness: 'Przydomowa lokalizacja sprzyja oswajaniu użytkowników z warunkami zewnętrznymi w najbliższym otoczeniu po to, aby przenieść pozytywne doświadczenia na bardziej odległe rejony, pozwalając w pełni korzystać z oferty kulturalnej, edukacyjnej i rekreacyjnej miasta.',
    },
    links: {
      video: 'https://www.youtube.com/watch?v=4DKP0XK440U',
      pdf: 'https://rops.krakow.pl/mpliki/IS/Moj_folder/MIIS/07_model_MOTO-SENSORYCZNY.pdf',
      download: 'https://rops.krakow.pl/pliki/IS/bibloteka/sciezkamotosensoryczna.zip',
    },
  },
  {
    id: 'helper-fundacja-opiekunow',
    kind: 'helper',
    title: 'Fundacja Wsparcia Opiekunów Rodzinnych (dane fikcyjne)',
    summary: 'Bezpłatne doradztwo dla osób opiekujących się bliskimi: formalności, zasiłki, dostęp do usług opiekuńczych w gminie.',
    category: 'Kto może pomóc w Małopolsce',
    why: 'Podpowie, z jakiego wsparcia gminy może skorzystać rodzina opiekująca się bliskim po udarze.',
    source: { label: 'Baza helperów HubMI' },
    details: {
      targetGroup: 'Opiekunowie rodzinni osób starszych i z niepełnosprawnościami w Małopolsce.',
    },
    links: {
      phone: '+48 12 345 67 89',
    },
  },
]
