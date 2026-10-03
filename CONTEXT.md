# HubMI

Resident-facing search over the ROPS knowledge base: a resident describes a problem in their own words and gets matched results, each closed with an action.

## Language

### People

**Mieszkaniec** (Resident):
Anonymous person describing a problem or need, on the web or at a kiosk. Has no account.
_Avoid_: user, citizen, client

**Pracownik ROPS** (ROPS staff member):
A person with an account in the Panel administratora; all of them have the same rights. The MVP has one predefined account.
_Avoid_: operator, admin, administrator, CRM user

### Panel

**Panel administratora** (Admin panel):
The closed part of the app where Pracownicy ROPS manage resident submissions and the knowledge base.
_Avoid_: CRM, panel operatora

### Search

**Zapytanie** (Query):
The resident's free-form description of a problem or need, in everyday language, typed or spoken.
_Avoid_: search term, prompt

**Wynik** (Result):
One item from the ROPS knowledge base returned for a Zapytanie. It always has a **Rodzaj** and a **Poziom dopasowania**.
_Avoid_: hit, answer, card (card is a UI element)

**Rodzaj wyniku** (Result kind):
What a Wynik is: an innovation / case study, a helper (person or organisation), or a fact (indicator or report excerpt). This is secondary to the tier, and shown as a label.

**Kategoria** (Category):
The resident group or area a Wynik is aimed at, e.g. "Innowacje dla seniorów". It corresponds to *obszar* in the taxonomy. It is shown as a label, not used to group results.
_Avoid_: tag, section

**Poziom dopasowania** (Match tier):
How well a Wynik matches *this* Zapytanie. It comes from one match score cut by two thresholds: high → **Rozwiązanie**, medium → **Rozwiązanie pokrewne**, below → not returned.

**Rozwiązanie** (Solution):
A Wynik with a high match to the Zapytanie.

**Rozwiązanie pokrewne** (Related solution):
A Wynik with a medium match to the *same* Zapytanie. It is always shown clearly apart from Rozwiązania.
_Avoid_: similar, recommended. It does NOT mean "similar to the top solution".

**Brak odpowiedzi** (No match):
The outcome when no Wynik passes the lower threshold.

**Uzasadnienie dopasowania** (Match rationale):
A short AI-written sentence on why a Wynik fits the Zapytanie. It is labeled as AI-generated, and it is based only on the Wynik's own content, with that Wynik as its source.

## Relationships

- One **Zapytanie** produces zero or more **Rozwiązania** and zero or more **Rozwiązania pokrewne**, or **Brak odpowiedzi**.
- Every returned **Wynik** has exactly one **Rodzaj**, one **Poziom dopasowania** and one **Uzasadnienie dopasowania**.

## Flagged ambiguities

- An early search contract grouped results by kind (solutions / helpers / facts). Resolved: the primary grouping is **Poziom dopasowania**, and kind is a label.
- The PRD and roadmap call the panel user **Operator** and assume a single fixed account. Resolved (HAC-6): the person is a **Pracownik ROPS**, the place is the **Panel administratora**; one predefined account in the MVP, more accounts possible later.
