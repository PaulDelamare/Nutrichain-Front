# NutriChain Front — Application SvelteKit

## Présentation

Client Web NutriChain (SvelteKit + TypeScript) pour la traçabilité des lots, la chaîne du froid et la gestion qualité. L'application consomme l'API NutriChain via un proxy serveur (session Better-Auth + clé API).

---

## Stack technique

- SvelteKit (Vite)
- TypeScript
- Tailwind CSS
- Vitest (tests unitaires)
- Playwright (tests e2e)
- ESLint + Prettier

---

## Démarrage rapide

1. Démarrer l'API NutriChain (`Nutrichain-Api`) sur le port 3000
2. Copier `.env.example` vers `.env` et renseigner les variables
3. Lancer le front :

```bash
npm install
npm run dev
```

Compte démo (après seed API) : voir le README de `Nutrichain-Api`.

---

## Scripts utiles

- `npm run dev` — serveur de dev
- `npm run build` — build de production
- `npm run preview` — prévisualiser le build
- `npm run check` — TypeScript + svelte-check
- `npm run lint` — lint & format check
- `npm run test:unit` — tests unitaires
- `npm run test:e2e` — tests Playwright
- `npm run test` — unit + e2e

---

## Variables d'environnement

Créer `.env` à la racine (ne jamais committer `.env`) :

```env
API_URL=http://localhost:3000
API_KEY=your-api-key-here
NODE_ENV=development
```

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `API_URL` | Oui | URL de base de l'API (lue côté serveur par `client.server.ts`) |
| `API_KEY` | Oui | Clé API transmise en `x-api-key` — sans elle, les routes protégées échouent |
| `NODE_ENV` | Non | `development` ou `production` |

> Les variables `VITE_*` ne sont **pas** utilisées par ce projet : toute communication API passe par les routes serveur SvelteKit.

---

## Architecture

- `src/routes/` — pages et routes SvelteKit
- `src/lib/Api/` — clients API côté serveur
- `src/lib/components/` — composants réutilisables
- `src/lib/utils/` — helpers et mappers
- `static/` — assets publics

---

## Tests & CI

- Tests unitaires : Vitest
- Tests E2E : Playwright
- CI GitHub Actions : lint → tests → build

---

## Pages publiques

- `/scan/[id]` — fiche consommateur (scan QR produit expédié)
