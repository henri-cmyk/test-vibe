# Web app — Estimateur de temps (UTMB World Series)

## Lancer en local

```bash
npm install
npm run dev
```

## Où modifier les données

- **Courses**: `src/data/races.ts`
- **Performances réelles (à remplir)**: `src/data/real-performances.json`
- **Performances (fallback synthétique)**: `src/data/sample-performances.ts`

## Endpoints

- `GET /api/races`
- `POST /api/estimate`
