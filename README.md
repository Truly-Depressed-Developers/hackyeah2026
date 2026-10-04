# HubMI

One place where residents of Małopolska describe a problem in their own words, by typing or by voice, on the web or at a kiosk, and find social innovations that can help. Every question without an answer becomes a signal for ROPS.

[Live demo](https://hackyeah2026.onrender.com) · [Kiosk mode](https://hackyeah2026.onrender.com/kiosk)

## Motivation

**HubMI** was created at <a href="https://hackyeah.pl/" target="_blank">HackYeah</a> 2026 Hackathon

- Topic: HubMI - challenge by Regionalny Ośrodek Polityki Społecznej w Krakowie (ROPS)
- Timeframe: 03-04.10.2026, 24 hours

## Features

- **Search in plain language** - describe a problem by text or voice and get matching innovations from the ROPS Library of Social Innovations (semantic search over the knowledge base)
- **Knowledge base** - browse all innovations by category, each with its own page: what it is, who it helps, test results, video, materials and a QR code to take it to your phone
- **Nothing found? Still a signal** - leave a contact or propose your own idea in a step-by-step form; every unanswered question is saved for ROPS
- **Kiosk mode** - a touch-first version for a tablet in a public place
- **Admin panel** - ROPS staff review needs, ideas and the knowledge base
- **Accessible** - built for WCAG 2.1 AA: text size switch, keyboard and screen reader support, reduced motion

## Installation

Install dependencies

```
pnpm i
```

Create `.env` from the example and fill in the AI service (`AI_URL`, `AI_API_KEY`, `AI_COLLECTION`). With `AI_URL` empty, search runs on a built-in mock

```
cp .env.example .env
```

Start the database, create the schema and the admin account

```
docker compose up -d
pnpm db:push
pnpm db:seed
```

Start the app

```
pnpm dev
```

Website will be available at [localhost:5173](http://localhost:5173), the kiosk at [localhost:5173/kiosk](http://localhost:5173/kiosk) and the admin panel at [localhost:5173/panel](http://localhost:5173/panel).

Scripts, project layout, deployment and the AI service contract are described in the [development guide](docs/development.md).

## Tech Stack

<img alt="REACTJS" src="https://img.shields.io/badge/React-61DAFB.svg?style=for-the-badge&logo=React&logoColor=black"/>
<img alt="TYPESCRIPT" src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white"/>
<img alt="VITE" src="https://img.shields.io/badge/Vite-646CFF.svg?style=for-the-badge&logo=Vite&logoColor=white"/>
<img alt="TANSTACK" src="https://img.shields.io/badge/TanStack-FF4154.svg?style=for-the-badge&logo=reactquery&logoColor=white"/>
<img alt="TAILWIND" src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4.svg?style=for-the-badge&logo=Tailwind-CSS&logoColor=white"/>
<img alt="SHADCN" src="https://img.shields.io/badge/shadcn/ui-000000.svg?style=for-the-badge&logo=shadcn/ui&logoColor=white"/>
<img alt="HONO" src="https://img.shields.io/badge/Hono-E36002.svg?style=for-the-badge&logo=hono&logoColor=white"/>
<img alt="TRPC" src="https://img.shields.io/badge/tRPC-2596BE?style=for-the-badge&logo=trpc&logoColor=white"/>
<img alt="POSTGRESQL" src="https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white"/>
<img alt="DRIZZLE" src="https://img.shields.io/badge/Drizzle-C5F74F.svg?style=for-the-badge&logo=drizzle&logoColor=black"/>
<img alt="PYTHON" src="https://img.shields.io/badge/Python-3776AB.svg?style=for-the-badge&logo=Python&logoColor=white"/>
<img alt="CHROMADB" src="https://img.shields.io/badge/ChromaDB-FF6446.svg?style=for-the-badge&logoColor=white"/>
<img alt="GEMINI" src="https://img.shields.io/badge/Gemini-8E75B2.svg?style=for-the-badge&logo=googlegemini&logoColor=white"/>

## Authors

- [@CALLmeDOMIN](https://github.com/CALLmeDOMIN)
- [@bartek-sosin](https://github.com/bartek-sosin)
- [@MSiorr](https://github.com/MSiorr)
