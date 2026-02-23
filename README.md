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
- Les “performances historiques” utilisées pour l’estimation sont **synthétiques** (`web/src/data/sample-performances.ts`) afin de poser l’architecture. La prochaine étape est d’ingérer des résultats réels (CSV/scraping/API partenaire).

