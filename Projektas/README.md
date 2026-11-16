# Fitness Tracker

Lokali sveikatos ir mitybos sekimo sistema. Projektas turi atskirą `backend` REST API ir `frontend` naršyklės klientą.

## Ko reikia

- Node.js 20 arba naujesnės versijos;
- veikiantis MySQL serveris;
- importuota projekto duomenų bazė iš savo MySQL dump failo.

## 1. Duomenų bazė

MySQL įrankyje sukurkite arba importuokite duomenų bazę. Tada `backend/.env` faile nurodykite jos prisijungimo duomenis:

```env
DB_NAME=fitness_tracker_l1
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
PORT=3000
GEMINI_API_KEY=
```

`GEMINI_API_KEY` neprivalomas. Be jo DI įžvalgos grąžina greitą vietinę rekomendaciją.

## 2. Backend

Naujame terminale:

```bash
cd backend
npm install
npm run dev
```

Patikrinimas: `http://localhost:3000/api/health`.

API dokumentacija naršyklėje: `http://localhost:3000/api/docs`.

## 3. Frontend

Kitame terminale:

```bash
cd frontend
npm install
npm run dev
```

Terminalas parodys frontend adresą, dažniausiai `http://localhost:5173`.

## 4. Postman demonstracija

1. Paleiskite backend.
2. Postman importuokite `postman/FitnessTracker_L2.postman_collection.json`.
3. Kolekcijos kintamojo `baseUrl` reikšmė turi būti `http://localhost:3000/api`.
4. Paleiskite kolekciją per Runner.

Kolekcijoje yra pagrindinių API metodų, `201`, `204`, `404` ir `422` testai.

## Katalogai

- `backend` - Express, Sequelize ir MySQL REST API.
- `frontend` - React naršyklės sąsaja.
- `postman` - Postman užklausų kolekcija.
- `backend/docs/api-spec.yaml` - privaloma OpenAPI specifikacija.

## 5. Publikavimas (Azure)

Pirmas patalpinimas ir perpublikavimas aprašyti faile [`DEPLOY.md`](DEPLOY.md). Perpublikuoti: `powershell -ExecutionPolicy Bypass -File .\deploy.ps1`.
