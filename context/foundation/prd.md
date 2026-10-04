---
project: Pomost
version: 1
status: draft
created: 2026-10-03
context_type: greenfield
product_type: web-app
target_scale:
  users: large
  qps: "# TODO: target_scale.qps — see Open Questions"
  data_volume: "# TODO: target_scale.data_volume — see Open Questions"
timeline_budget:
  mvp_weeks: 1
  hard_deadline: 2026-10-04
  after_hours_only: false
---

# Pomost — PRD

## Vision & Problem Statement

Mieszkaniec Małopolski z problemem lub potrzebą społeczną nie ma jednego miejsca, w którym znajdzie rozwiązanie. Dziś szuka w Google albo dzwoni do różnych instytucji, które opracowują te dane. Młoda osoba ma potrzebę w dowolnej sytuacji; starsza osoba spotyka się z rozwiązaniem w miejscach publicznych.

Insight: (1) łączymy rozproszone źródła — innowacje, statystyki, raporty i ludzi — w jedną odpowiedź; (2) potoczny opis problemu trafia w fachowe rozwiązanie, którego nazwy mieszkaniec nie zna; (3) głos i kiosk otwierają dostęp osobom wykluczonym cyfrowo; (4) każde pytanie, także bez odpowiedzi, jest sygnałem dla ROPS o potrzebach mieszkańców.

## User & Persona

**Mieszkaniec** (persona główna, priorytet) — jeden interfejs dla wszystkich mieszkańców, młodych i starszych. Młodsi wpisują potrzebę lub pytanie; starsi mówią do kiosku w miejscu publicznym. Funkcje sprzyjające starszym (wyszukiwanie głosowe, odczytanie najlepiej dopasowanego wyniku) są częścią tego samego interfejsu, nie osobną aplikacją.

Aplikacja działa na tablecie (kiosk), telefonie i desktopie. UI kiosku minimalnie się różni (mniej elementów), a akcje na zwracanych wynikach są inne niż na telefonie/desktopie.

### Secondary persona

**Operator CRM (pracownik ROPS)** — obsługuje panel zgłoszeń i wiedzy. Niższy priorytet niż mieszkaniec.

## Success Criteria

### Primary

- Mieszkaniec przechodzi pełny przepływ: podchodzi do kiosku (lub otwiera web) → widzi wyszukiwarkę z przełącznikiem na tryb głosowy oraz rekomendowane case studies, osoby i artykuły → mówi lub wpisuje problem → po krótkim czasie widzi rozwiązania lub rozwiązania pokrewne → wykonuje akcję zależną od typu wyniku (numer telefonu, obejrzenie wideo, przeczytanie treści, link do większej ilości treści). Gdy nic nie pasuje, może zaproponować własne rozwiązanie albo zgłosić brak wyniku spełniającego potrzebę.

### Secondary

- Test trafności: właściwa innowacja w pierwszej trójce wyników dla X z 15 testowych opisów problemów (próg X — see Open Questions).
- Zgłoszenie „brak wyniku” jest widoczne dla operatora w CRM.

### Guardrails

- Żadnych prawdziwych danych osobowych w demo.
- Dostępność zgodna z WCAG 2.1 AA.
- Odpowiedzi opierają się wyłącznie na zawartości bazy, bez zmyślania.
- Wyniki wyszukiwania w < 5 s.

## User Stories

### US-01: Mieszkaniec znajduje rozwiązanie swojego problemu w kiosku

- **Given** mieszkaniec stoi przy kiosku z widoczną wyszukiwarką, przełącznikiem trybu głosowego i rekomendowanymi case studies, osobami i artykułami
- **When** mówi lub wpisuje swój problem
- **Then** po krótkim czasie widzi rozwiązania lub rozwiązania pokrewne i może wykonać akcję zależną od typu wyniku (telefon, wideo, treść, link)

#### Acceptance Criteria

- Gdy żaden wynik nie spełnia potrzeby, mieszkaniec widzi możliwość zaproponowania własnego rozwiązania albo zgłoszenia braku wyniku.
- Treść najlepiej dopasowanego wyniku można odsłuchać.

## Functional Requirements

Cały przepływ mieszkańca jest w MVP. Kolejność budowy: tekst → wyniki → akcje; potem głos i odczyt na głos; na końcu rekomendacje na ekranie startowym. Przy braku czasu cięcie od końca tej listy. MVP musi powstać w oknie hackathonu 24 h (zaakceptowane 2026-10-03).

### Wyszukiwanie (Matchmaking)

- FR-001: Mieszkaniec can wpisać swój problem lub potrzebę. Priority: must-have
  > Socrates: Counter-argument considered: "pisanie na tablecie w kiosku jest wolne". Resolution: kept; głos (FR-002) jest równorzędną ścieżką.
- FR-002: Mieszkaniec can przełączyć się na tryb głosowy i powiedzieć swój problem. Priority: must-have
  > Socrates: No counter-argument; it stands as written.
- FR-003: Mieszkaniec can zobaczyć na ekranie startowym rekomendowane case studies, osoby i artykuły dobrane do miejsca, w którym stoi kiosk. Priority: must-have
  > Socrates: Counter-argument considered: "rozprasza od wyszukiwarki / brak sygnału do personalizacji". Resolution: kept — rekomendacje szczególnie potrzebne w kiosku; dobierane na podstawie lokalizacji kiosku.
- FR-004: Mieszkaniec can zobaczyć rozwiązania swojego problemu oraz — wyraźnie oddzielone — rozwiązania pokrewne, z uzasadnieniem dopasowania. Priority: must-have
  > Socrates: Counter-argument considered: "„pokrewne” myli się z dopasowanymi". Resolution: modified — trafienia i pokrewne wyraźnie oddzielone, dopasowanie uzasadnione.
- FR-005: Mieszkaniec can wykonać akcję zależną od typu wyniku (telefon, obejrzenie wideo, przeczytanie treści, link do większej ilości treści) i zabrać wynik z kiosku na własne urządzenie. Priority: must-have
  > Socrates: Counter-argument considered: "kiosk nie zadzwoni ani nie otworzy linku za seniora". Resolution: modified — wynik da się zabrać z kiosku.
- FR-006: Mieszkaniec can na żądanie odsłuchać treść najlepiej dopasowanego wyniku. Priority: must-have
  > Socrates: Counter-argument considered: "odczyt bez zgody zaskakuje w miejscu publicznym". Resolution: modified — odczyt tylko na żądanie, nigdy automatycznie.

### Kreator pomysłów — część 1

- FR-007: Mieszkaniec can zaproponować własne rozwiązanie (tekstem lub głosem) w formularzu, w którym zostawia kontakt do siebie. Priority: must-have
  > Socrates: Counter-argument considered: "senior przy kiosku nie napisze pomysłu". Resolution: modified — propozycję można powiedzieć głosem; formularz pomysłu zawiera kontakt autora.
- FR-008: Mieszkaniec can dowiedzieć się, że na jego problem nie ma jeszcze odpowiedzi, ale zostanie on rozpatrzony, i opcjonalnie zostawić kontakt, aby otrzymać rozwiązanie po rozpatrzeniu sprawy. Priority: must-have
  > Socrates: Counter-argument considered: "zgłoszenie braku wyniku wymaga dodatkowej akcji mieszkańca". Resolution: modified — zapytania bez wyniku zapisywane jako luka automatycznie; mieszkaniec dostaje komunikat o rozpatrzeniu i opcję podania kontaktu.

### Panel administratora

- FR-009: Operator can zalogować się do panelu jednym stałym kontem (bez rejestracji i resetu hasła). Priority: must-have
  > Socrates: Counter-argument considered: "w demo logowanie spowalnia pokaz". Resolution: modified — jedno stałe konto operatora.
- FR-010: Operator can dodawać, przeglądać, edytować i usuwać materiały i wiedzę w bazie, z której korzysta wyszukiwarka. Priority: must-have
  > Socrates: Counter-argument considered: "ręczne wpisywanie jest wolne". Resolution: kept — dane przychodzą ze scrapingu; CRUD służy do poprawek.
- FR-016: Operator can zobaczyć listę zgłoszeń mieszkańców (propozycje rozwiązań i problemy bez odpowiedzi) wraz z kontaktem, jeśli mieszkaniec go zostawił, aby skontaktować się z rozwiązaniem. Priority: must-have
  > Socrates: Counter-argument considered: "lista bez odpowiedzi to ślepa uliczka". Resolution: modified — formularz pomysłu zawiera kontakt; przy braku odpowiedzi mieszkaniec dostaje komunikat o rozpatrzeniu i może zostawić kontakt; operator kontaktuje się po rozwiązaniu sprawy.

### Zasobnik wiedzy

- FR-011: Mieszkaniec can przeglądać bazę wiedzy w katalogu z filtrami (bez AI). Priority: must-have (niższy priorytet budowy)
  > Socrates: Counter-argument considered: "druga wyszukiwarka dubluje wyszukiwarkę AI". Resolution: modified — katalog z filtrami zamiast drugiej wyszukiwarki.

### Poza głównym zakresem (jeśli zostanie czas)

Kolejność: FR-013 pierwszy.

- FR-012: Mieszkaniec can przygotować wniosek w generatorze wniosków (Kreator pomysłów — część 2). Priority: nice-to-have
  > Socrates: Counter-argument considered: "mieszkaniec z kiosku nie pisze wniosków — to narzędzie dla NGO". Resolution: kept as nice-to-have.
- FR-013: Mieszkaniec can zapisać się na test innowacji (Tester innowacji). Priority: nice-to-have
  > Socrates: Counter-argument considered: "tani punkt za moduł". Resolution: kept as nice-to-have, pierwszy w kolejce.
- FR-014: Mieszkaniec i operator can komunikować się ze sobą (Platforma aktywnej komunikacji). Priority: nice-to-have
  > Socrates: Counter-argument considered: "anonimowy mieszkaniec nie odbierze odpowiedzi". Resolution: kept as nice-to-have; wymaga kontaktu mieszkańca.
- FR-015: Instytucja can dostosować innowację do formy usługi (Middleman). Priority: nice-to-have
  > Socrates: No counter-argument; it stands as written.

## Non-Functional Requirements

- Mieszkaniec widzi potwierdzenie przyjęcia zapytania w < 1 s i ciągły postęp do pojawienia się wyników; wyniki pojawiają się w < 5 s.
- Cała aplikacja (kiosk, web i panel operatora) spełnia WCAG 2.1 AA.
- Żadne prawdziwe dane osobowe nie pojawiają się w demo ani w zapisanych opisach problemów.
- Każda treść wygenerowana przez AI jest oznaczona jako taka i opiera się wyłącznie na zawartości bazy, ze wskazaniem źródła.
- Aplikacja jest w pełni używalna na tablecie i telefonie: ekran 320 px bez przewijania w poziomie, powiększenie do 200%.

## Business Logic

Aplikacja przyjmuje dowolnie sformułowany problem — tekstem lub głosem, bez filtrów i bez precyzowania — sama dopasowuje go do bazy wiedzy operatora, klasyfikuje wyniki według stopnia dopasowania jako rozwiązania, rozwiązania pokrewne albo brak odpowiedzi (zapisywany jako luka), a każdy zwrócony wynik domyka dostępną akcją.

Wejście: opis problemu w języku mieszkańca (wpisany lub powiedziany). Mieszkaniec nie musi znać nazw rozwiązań ani używać filtrów — aplikacja szuka za niego.

Wynik: lista wyników z bazy prowadzonej przez operatora, podzielona progiem dopasowania — wysokie dopasowanie to rozwiązanie, średnie to rozwiązanie pokrewne, poniżej progu to brak odpowiedzi. Progi kalibrowane zestawem testowym opisów problemów.

Mieszkaniec spotyka regułę w momencie wyszukania: każdy wynik ma akcję zależną od typu (telefon, wideo, treść, link); brak odpowiedzi kończy się komunikatem o rozpatrzeniu sprawy i luką widoczną dla operatora.

## Access Control

- **Mieszkaniec:** bez konta. Wyszukiwanie jest anonimowe (w webie i w kiosku). Kontakt (e-mail lub telefon) zostawia w formularzu pomysłu; przy problemie bez odpowiedzi podaje go opcjonalnie, by otrzymać rozwiązanie.
- **Operator ROPS:** jedyna rola po stronie CRM; loguje się do panelu. Widzi zgłoszenia, trendy potrzeb i zarządza wiedzą.
- Trendy potrzeb i dane zgłoszeń są dostępne wyłącznie dla operatora — dostęp sprawdzany uprawnieniami, nie tylko ukryciem w menu.
- Niezalogowany użytkownik, który wejdzie na trasę panelu, nie widzi żadnych danych panelu.

## Non-Goals

- Brak kont mieszkańców i historii wyszukiwań — mieszkaniec działa anonimowo, kontakt tylko w zgłoszeniu.
- Brak czatu z AI — wyszukiwarka zwraca wyniki, nie prowadzi rozmowy.
- Brak wielu ról w CRM — tylko operator ROPS; eksperci, NGO i JST nie są użytkownikami panelu.
- Brak integracji z systemami ROPS — dane przez scraping i import, bez bezpośredniego połączenia z Biblioteką, bazą grantową ani innymi systemami.
- Moduły Kreator pomysłów cz. 2 (generator wniosków), Tester innowacji, Platforma aktywnej komunikacji i Middleman są poza zakresem MVP (FR-012–FR-015, nice-to-have).

## Open Questions

1. **Próg testu trafności (X z 15 opisów w pierwszej trójce).** — Owner: zespół. By: przed demo.
2. **Czy „baza miasta” obejmuje coś poza Obserwatorem i raportami?** — Owner: zespół / mentorzy ROPS. By: przed importem danych.
3. **Ile innowacji da się zescrapować z Biblioteki Innowacji?** — Owner: AI dev. By: przed importem danych.
4. **Ilu fikcyjnych helperów (osoby/organizacje) przygotować?** — Owner: zespół produktowy.
5. **Czy rozpoznawanie i synteza mowy po polsku działają na docelowym tablecie?** — Owner: AI dev. By: przed budową trybu głosowego.
6. **Jak mieszkaniec zabiera wynik z kiosku na własne urządzenie (FR-005)?** — Owner: zespół.
7. **target_scale.qps — oczekiwany ruch zapytań.** — Owner: zespół. Not captured in shaping.
8. **target_scale.data_volume — oczekiwany wolumen danych (innowacje, materiały, zgłoszenia).** — Owner: zespół. Not captured in shaping.
