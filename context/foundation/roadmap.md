---
project: HubMI
version: 1
status: draft
created: 2026-10-03
updated: 2026-10-03
prd_version: 1
main_goal: speed
top_blocker: time
milestone_id: resident-search-loop
milestone_seq: 1
milestone_status: open
---

# Roadmap: HubMI

> Derived from `context/foundation/prd.md` (v1) + `tech-stack.md` + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-1: Pętla wyszukiwania mieszkańca** — Status: open

- **Intent:** Mieszkaniec opisuje problem (tekstem lub głosem) i dostaje rozwiązania z akcją albo ślad, że problem trafił do ROPS; operator widzi zgłoszenia i zarządza wiedzą. Zakres MVP z PRD, oddawany w oknie hackathonu.
- **Source materials:** `context/foundation/prd.md` (v1)
- **Done when:** every F-NN and S-NN below is `done`.
- **Scope anchors:** FR-001–FR-011, FR-016 (must-have), US-01. FR-012–FR-015 (nice-to-have) parked.

## Vision recap

Mieszkaniec Małopolski z problemem społecznym nie ma jednego miejsca, gdzie znajdzie rozwiązanie — dziś szuka w Google albo dzwoni do różnych instytucji. HubMI łączy rozproszone źródła (innowacje, statystyki, raporty, ludzi) w jedną odpowiedź na potoczny opis problemu, dostępną także głosem w kiosku, a każde pytanie bez odpowiedzi staje się sygnałem dla ROPS.

## North star

**S-01: Mieszkaniec wpisuje problem i widzi rozwiązania oraz oddzielone od nich rozwiązania pokrewne, z uzasadnieniem dopasowania** — to dowód reguły biznesowej i głównego kryterium sukcesu w najmniejszej formie; głos, akcje i panel dokładamy na tym rdzeniu.

> "North star" (gwiazda przewodnia) to najmniejszy kawałek od początku do końca, którego działanie udowadnia, że produkt ma sens — dlatego stoi tak wcześnie, jak pozwalają zależności; reszta ma znaczenie tylko wtedy, gdy on działa.

## At a glance

| ID   | Change ID                   | Outcome (user can …)                                                                 | Prerequisites | PRD refs                       | Status   |
| ---- | --------------------------- | ------------------------------------------------------------------------------------ | ------------- | ------------------------------ | -------- |
| F-01 | searchable-content-seed     | (foundation) pierwsza partia treści z jedną taksonomią jest w bazie i jest wyszukiwalna | —             | Business Logic, NFR (dane osobowe) | ready    |
| S-01 | text-search-results         | mieszkaniec wpisuje problem i widzi rozwiązania oraz oddzielone pokrewne z uzasadnieniem | F-01          | US-01, FR-001, FR-004          | proposed |
| S-02 | result-actions-takeaway     | mieszkaniec wykonuje akcję zależną od typu wyniku i zabiera wynik z kiosku              | S-01          | US-01, FR-005                  | proposed |
| S-03 | no-result-and-idea          | mieszkaniec bez wyniku dostaje komunikat o rozpatrzeniu, może zostawić kontakt albo zgłosić własny pomysł | S-01 | US-01, FR-007, FR-008 | proposed |
| S-04 | voice-input                 | mieszkaniec przełącza się na tryb głosowy i mówi problem lub pomysł                    | S-01          | US-01, FR-002, FR-007          | proposed |
| S-05 | read-aloud-on-demand        | mieszkaniec na żądanie odsłuchuje najlepiej dopasowany wynik                           | S-01          | US-01, FR-006                  | proposed |
| S-06 | operator-login              | operator loguje się stałym kontem; niezalogowany nie widzi danych panelu               | —             | FR-009                         | ready    |
| S-07 | submissions-inbox           | operator widzi listę zgłoszeń mieszkańców z kontaktem                                  | S-03, S-06    | FR-016                         | proposed |
| S-08 | knowledge-crud              | operator dodaje, edytuje i usuwa materiały, a zmiany są od razu wyszukiwalne           | F-01, S-06    | FR-010                         | proposed |
| S-09 | kiosk-start-recommendations | mieszkaniec przy kiosku widzi na starcie rekomendacje dobrane do miejsca kiosku         | S-01          | US-01, FR-003                  | proposed |
| S-10 | knowledge-catalog           | mieszkaniec przegląda bazę wiedzy w katalogu z filtrami                                | S-01          | FR-011                         | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                     | Chain                              | Note                                                                 |
| ------ | ------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| A      | Wyszukiwanie mieszkańca   | `F-01` → `S-01` → `S-02` → `S-03`  | Ścieżka konieczna pierwsza — zgodnie z celem `speed`.                |
| B      | Głos i kiosk              | `S-04` → `S-05` → `S-09`           | Dołącza do strumienia A w `S-01`; kolejność budowy z PRD (głos, odczyt, rekomendacje). |
| C      | Panel operatora           | `S-06` → `S-08` → `S-07`           | Startuje od razu, równolegle z A; `S-07` dołącza do A w `S-03`.      |
| D      | Zasobnik wiedzy           | `S-10`                             | Dołącza do A w `S-01`; najniższy priorytet budowy.                    |

## Baseline

What's already in place in the codebase as of `2026-10-03` (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — aplikacja webowa z routingiem i biblioteką komponentów, tryb instalowalny (PWA) skonfigurowany (`apps/web`); ekran startowy to demo template.
- **Backend / API:** present — serwer z typowanym API i `/health` (`apps/api/src/index.ts`, `router.ts`); procedury demo.
- **Data:** partial — baza relacyjna z ORM działa, ale schema ma tylko demo tabelę; brak treści, taksonomii i indeksu wyszukiwania (`apps/api/src/db/schema.ts`).
- **Auth:** absent — wszystkie procedury publiczne, brak logowania.
- **Deploy / infra:** present — kontener + auto-deploy z `main` (`Dockerfile`, `render.yaml`); brak CI.
- **Observability:** absent — tylko logi konsolowe.
- **AI / mowa:** partial — klient zewnętrznego serwisu decyzji w trybie mock; dostawca modelu językowego, embeddingów i mowy otwarty (per `tech-stack.md`).

## Foundations

### F-01: Pierwsza partia wyszukiwalnych treści

- **Outcome:** (foundation) pierwsza partia treści — innowacje z Biblioteki, fikcyjni helperzy, wybrane wskaźniki i fragmenty raportów — jest w bazie pod jedną taksonomią (obszar, grupa, typ, etap, lokalizacja), bez prawdziwych danych osobowych, i da się ją przeszukać.
- **Change ID:** searchable-content-seed
- **PRD refs:** Business Logic („baza wiedzy operatora”), NFR (brak prawdziwych danych osobowych; odpowiedzi tylko z bazy, ze źródłem)
- **Unlocks:** S-01 (bez treści wyszukiwanie nie ma czego dopasować), S-08, S-09, S-10; zmniejsza niewiadomą „ile innowacji da się zescrapować”.
- **Prerequisites:** —
- **Parallel with:** S-06
- **Blockers:** —
- **Unknowns:**
  - Ile innowacji da się zescrapować z Biblioteki Innowacji? — Owner: AI dev. Block: no.
  - Ilu fikcyjnych helperów przygotować? — Owner: zespół produktowy. Block: no.
  - Czy „baza miasta” obejmuje coś poza Obserwatorem i raportami? — Owner: zespół / mentorzy ROPS. Block: no.
- **Risk:** Najpierw, bo bez treści gwiazda przewodnia jest niewykonalna; ryzyko to zbyt szeroki import — zakres to pierwsza partia potrzebna do S-01, nie kompletna baza.
- **Status:** ready

## Slices

### S-01: Wyszukiwanie tekstowe z rozwiązaniami i pokrewnymi

- **Outcome:** mieszkaniec wpisuje problem lub potrzebę i widzi rozwiązania oraz — wyraźnie oddzielone — rozwiązania pokrewne, z uzasadnieniem dopasowania.
- **Change ID:** text-search-results
- **PRD refs:** US-01, FR-001, FR-004, NFR (potwierdzenie < 1 s, wyniki < 5 s; WCAG 2.1 AA; treść AI oznaczona ze źródłem)
- **Prerequisites:** F-01
- **Parallel with:** S-06
- **Blockers:** —
- **Unknowns:**
  - Który dostawca modelu językowego i embeddingów? — Owner: AI dev. Block: no.
  - Próg testu trafności (X z 15 opisów w pierwszej trójce). — Owner: zespół. Block: no.
- **Risk:** Gwiazda przewodnia — tu rozstrzyga się trafność i czas odpowiedzi; jeśli progi dopasowania są źle skalibrowane, wszystkie kolejne kawałki dziedziczą słabe wyniki.
- **Status:** proposed

### S-02: Akcje na wynikach i zabranie wyniku z kiosku

- **Outcome:** mieszkaniec wykonuje akcję zależną od typu wyniku (telefon, wideo, treść, link) i zabiera wynik z kiosku na własne urządzenie.
- **Change ID:** result-actions-takeaway
- **PRD refs:** US-01, FR-005
- **Prerequisites:** S-01
- **Parallel with:** S-03, S-04, S-05, S-09, S-10
- **Blockers:** —
- **Unknowns:**
  - Jak mieszkaniec zabiera wynik z kiosku na własne urządzenie? — Owner: zespół. Block: no.
- **Risk:** Domyka regułę biznesową („każdy wynik domknięty akcją”); bez tego wyniki są tylko listą.
- **Status:** proposed

### S-03: Brak wyniku i zgłoszenie własnego pomysłu

- **Outcome:** mieszkaniec, dla którego nic nie pasuje, dostaje komunikat, że problem zostanie rozpatrzony, może zostawić kontakt albo zaproponować własne rozwiązanie w formularzu z kontaktem; zapytanie bez wyniku zapisuje się jako luka.
- **Change ID:** no-result-and-idea
- **PRD refs:** US-01, FR-007, FR-008
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-04, S-05, S-09, S-10
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Zasila panel operatora (S-07); wymaga progu „brak odpowiedzi” z S-01 — sekwencjonowany zaraz za nim.
- **Status:** proposed

### S-04: Tryb głosowy

- **Outcome:** mieszkaniec przełącza się na tryb głosowy i mówi swój problem (oraz pomysł w formularzu z S-03).
- **Change ID:** voice-input
- **PRD refs:** US-01, FR-002, FR-007
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-03, S-05, S-09, S-10
- **Blockers:** —
- **Unknowns:**
  - Czy rozpoznawanie mowy po polsku działa na docelowym tablecie? — Owner: AI dev. Block: no.
- **Risk:** Zależność od urządzenia i hałasu w miejscu publicznym; po S-01, bo kolejność budowy z PRD stawia głos po tekście i można go uciąć bez utraty rdzenia.
- **Status:** proposed

### S-05: Odczyt wyniku na żądanie

- **Outcome:** mieszkaniec na żądanie odsłuchuje treść najlepiej dopasowanego wyniku; odczyt nigdy nie startuje sam.
- **Change ID:** read-aloud-on-demand
- **PRD refs:** US-01, FR-006
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-03, S-04, S-09, S-10
- **Blockers:** —
- **Unknowns:**
  - Czy synteza mowy po polsku działa na docelowym tablecie? — Owner: AI dev. Block: no.
- **Risk:** Niezależny od S-04 — może wejść nawet, jeśli rozpoznawanie mowy zawiedzie.
- **Status:** proposed

### S-06: Logowanie operatora

- **Outcome:** operator loguje się do panelu jednym stałym kontem; niezalogowany użytkownik na trasie panelu nie widzi żadnych danych panelu.
- **Change ID:** operator-login
- **PRD refs:** FR-009, Access Control
- **Prerequisites:** —
- **Parallel with:** F-01, S-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Bez zależności — może startować od razu równolegle z rdzeniem; chroni trendy i zgłoszenia (Access Control: uprawnienia, nie tylko ukrycie w menu).
- **Status:** ready

### S-07: Lista zgłoszeń dla operatora

- **Outcome:** operator widzi listę zgłoszeń mieszkańców (propozycje rozwiązań i problemy bez odpowiedzi) wraz z kontaktem, jeśli mieszkaniec go zostawił.
- **Change ID:** submissions-inbox
- **PRD refs:** FR-016
- **Prerequisites:** S-03, S-06
- **Parallel with:** S-08
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Domyka pętlę mieszkaniec–ROPS i kryterium drugorzędne; zależy od zgłoszeń z S-03, więc nie może iść wcześniej.
- **Status:** proposed

### S-08: Zarządzanie wiedzą w panelu

- **Outcome:** operator dodaje, przegląda, edytuje i usuwa materiały w bazie, a zmiany są od razu widoczne w wyszukiwaniu.
- **Change ID:** knowledge-crud
- **PRD refs:** FR-010
- **Prerequisites:** F-01, S-06
- **Parallel with:** S-01, S-07
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Dane przychodzą z F-01, więc CRUD służy poprawkom — ryzyko to edycja, która nie odświeża wyszukiwania.
- **Status:** proposed

### S-09: Rekomendacje na starcie kiosku

- **Outcome:** mieszkaniec przy kiosku widzi na ekranie startowym rekomendowane case studies, osoby i artykuły dobrane do miejsca, w którym stoi kiosk.
- **Change ID:** kiosk-start-recommendations
- **PRD refs:** US-01, FR-003
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-03, S-04, S-05, S-10
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Ostatnie w kolejności budowy z PRD — pierwsze do ucięcia przy braku czasu.
- **Status:** proposed

### S-10: Katalog wiedzy z filtrami

- **Outcome:** mieszkaniec przegląda bazę wiedzy w katalogu z filtrami, bez AI.
- **Change ID:** knowledge-catalog
- **PRD refs:** FR-011
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-03, S-04, S-05, S-09
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Niższy priorytet budowy (PRD); korzysta z kart wyników z S-01, więc idzie po nim.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                   | Suggested issue title                                        | Ready for `/10x-plan` | Notes                                  |
| ---------- | --------------------------- | ------------------------------------------------------------ | --------------------- | -------------------------------------- |
| F-01       | searchable-content-seed     | Zaimportuj pierwszą partię treści z taksonomią               | yes                   | Run `/10x-plan searchable-content-seed` |
| S-01       | text-search-results         | Wyszukiwanie tekstowe: rozwiązania i pokrewne z uzasadnieniem | no                    | Czeka na F-01                          |
| S-02       | result-actions-takeaway     | Akcje na wynikach i zabranie wyniku z kiosku                 | no                    | Czeka na S-01                          |
| S-03       | no-result-and-idea          | Brak wyniku: komunikat, kontakt, własny pomysł               | no                    | Czeka na S-01                          |
| S-04       | voice-input                 | Tryb głosowy wyszukiwania                                    | no                    | Czeka na S-01                          |
| S-05       | read-aloud-on-demand        | Odczyt najlepszego wyniku na żądanie                         | no                    | Czeka na S-01                          |
| S-06       | operator-login              | Logowanie operatora stałym kontem                            | yes                   | Run `/10x-plan operator-login`         |
| S-07       | submissions-inbox           | Lista zgłoszeń mieszkańców w panelu                          | no                    | Czeka na S-03, S-06                    |
| S-08       | knowledge-crud              | Zarządzanie materiałami w panelu                             | no                    | Czeka na F-01, S-06                    |
| S-09       | kiosk-start-recommendations | Rekomendacje na starcie kiosku wg lokalizacji                | no                    | Czeka na S-01                          |
| S-10       | knowledge-catalog           | Katalog wiedzy z filtrami                                    | no                    | Czeka na S-01                          |

## Open Roadmap Questions

1. **Próg testu trafności (X z 15 opisów w pierwszej trójce).** — Owner: zespół. Block: S-01 (no).
2. **Czy „baza miasta” obejmuje coś poza Obserwatorem i raportami?** — Owner: zespół / mentorzy ROPS. Block: F-01 (no).
3. **Ile innowacji da się zescrapować z Biblioteki Innowacji?** — Owner: AI dev. Block: F-01 (no).
4. **Ilu fikcyjnych helperów (osoby/organizacje) przygotować?** — Owner: zespół produktowy. Block: F-01 (no).
5. **Czy rozpoznawanie i synteza mowy po polsku działają na docelowym tablecie?** — Owner: AI dev. Block: S-04, S-05 (no).
6. **Jak mieszkaniec zabiera wynik z kiosku na własne urządzenie (FR-005)?** — Owner: zespół. Block: S-02 (no).
7. **target_scale.qps — oczekiwany ruch zapytań.** — Owner: zespół. Block: roadmap-wide (no).
8. **target_scale.data_volume — oczekiwany wolumen danych.** — Owner: zespół. Block: roadmap-wide (no).
9. **Dostawca modelu językowego, embeddingów i mowy (tech-stack: open).** — Owner: AI dev. Block: S-01, S-04, S-05 (no).

## Parked

- **Generator wniosków (FR-012, Kreator pomysłów cz. 2)** — Why parked: PRD nice-to-have; narzędzie dla NGO, nie dla persony głównej.
- **Zapis na testy innowacji (FR-013, Tester)** — Why parked: PRD nice-to-have; pierwszy w kolejce, jeśli zostanie czas.
- **Komunikacja mieszkaniec ↔ operator (FR-014)** — Why parked: PRD nice-to-have; wymaga kontaktu mieszkańca.
- **Middleman (FR-015)** — Why parked: PRD nice-to-have; persona instytucji, nie mieszkańca.
- **Konta mieszkańców i historia wyszukiwań** — Why parked: PRD Non-Goals.
- **Czat z AI** — Why parked: PRD Non-Goals.
- **Wiele ról w CRM (eksperci, NGO, JST)** — Why parked: PRD Non-Goals.
- **Integracje z systemami ROPS** — Why parked: PRD Non-Goals; dane przez scraping i import.

## Milestone History

## Done
