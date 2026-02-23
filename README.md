# Estimateur de temps — UTMB World Series (MVP)

Cette repo contient une application web (Next.js) permettant d’estimer un temps de course sur une sélection de courses **UTMB World Series**, à partir de paramètres de performance (UTMB Index/ITRA/VO2max + temps route).

## Démarrer en local

```bash
npm --prefix web install
npm --prefix web run dev
```

Puis ouvrir `http://localhost:3000`.

## Notes (MVP)

- Les courses UTMB World Series sont pour l’instant une **liste de base** dans `web/src/data/races.ts`.
- Les “performances historiques” utilisées pour l’estimation sont **synthétiques** (`web/src/data/sample-performances.ts`) afin de poser l’architecture.

## Ajouter des résultats réels

Remplir `web/src/data/real-performances.json` avec un tableau d’objets:

```json
[
  { "raceId": "utmb-utmb", "utmbIndex": 500, "finishTimeSeconds": 120600, "year": 2024 },
  { "raceId": "utmb-utmb", "utmbIndex": 505, "finishTimeSeconds": 118200, "year": 2023 }
]
```

À partir du moment où ce fichier contient des lignes valides, l’app **utilise automatiquement** ces résultats (et n’utilise plus le dataset synthétique).

