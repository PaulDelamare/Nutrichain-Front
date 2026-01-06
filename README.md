# NutriChain Front — Application SvelteKit ⚙️

## 🔎 Présentation
Ce dépôt contient le client Web de NutriChain, une application SvelteKit + TypeScript conçue pour consulter la traçabilité des lots et surveiller la chaîne du froid en temps réel. L'application consomme l'API NutriChain (auth OIDC, endpoints d'événements et capteurs) et fournit une UI mobile-friendly pour le scan, l'historique et la gestion des alertes.

---

## 🧰 Stack technique
- SvelteKit (Vite)
- TypeScript
- Tailwind CSS
- Vitest (tests unitaires)
- Playwright (tests e2e)
- ESLint + Prettier

---

## ▶️ Scripts utiles
- `npm run dev` — serveur de dev (vite)
- `npm run build` — build de production
- `npm run preview` — prévisualiser le build
- `npm run check` — TypeScript + svelte-check
- `npm run lint` — lint & format check
- `npm run format` — formate tout le projet
- `npm run test:unit` — tests unitaires
- `npm run test:e2e` — tests Playwright
- `npm run test` — exécute unit + e2e

---

## ⚙️ Variables d'environnement
Crée `.env` à la racine (ne jamais committer `.env`). Exemple (`.env.example` à compléter) :

```env
VITE_API_URL=https://api.example.com
NODE_ENV=development
```

> Les variables frontend doivent commencer par `VITE_` pour être injectées à l'exécution par Vite.

---

## 📁 Architecture recommandée
- `src/routes/` : pages et routes SvelteKit
- `src/lib/components/` : composants réutilisables
- `src/lib/stores/` : état global (ex: user, settings)
- `src/lib/services/` : appels API (ex: auth, events, sensors)
- `src/lib/utils/` : helpers, formatters
- `static/` : assets publics

---

## 🧪 Tests & CI
- Tests unitaires : `vitest`
- Tests E2E : `playwright`
- Ajoute CI (GitHub Actions) pour : lint → tests unitaires → build → e2e sur preview

---

## ♿ Accessibilité et mobile
- Tester sur mobile et desktop (latence de scan < 500ms visée)
- Respecter les basiques d'accessibilité (labels, focus visible, contraste)
