# Installation — guide pour nouveaux arrivants

Ce document t'aide à faire tourner le projet en local, en particulier l'onglet
**"Rechercher"** de l'admin (découverte de nouveaux talks). Pour tout le reste
(conventions, architecture), voir `CLAUDE.md`/`architecture.md`.

## 1. Les bases

```bash
git clone <url-du-repo>
cd conferences-provider/backend
npm install
cp .env.example .env
```

Édite `.env` et renseigne `DATABASE_URL` — demande la connection string Neon à
un membre de l'équipe (c'est la même base que la prod : tout ce que tu fais en
local via l'admin est visible immédiatement sur le site en ligne).

À ce stade, `npm run dev` (backend) suffit pour que le site fonctionne et que
l'admin (sauf l'onglet "Rechercher") soit utilisable.

## 2. Pour utiliser l'onglet "Rechercher"

Cet onglet lance une vraie recherche (YouTube via SearXNG + extraction via un
LLM local Ollama) — **ça ne fonctionne qu'en local**, pas sur le site déployé
(Render n'a pas accès à ces services).

Une seule commande installe/démarre tout ce qu'il faut :

```bash
npm run setup:local-search
```

Concrètement, ce script :
1. Vérifie que Docker tourne (ne l'installe pas automatiquement — voir ci-dessous).
2. Installe Ollama s'il est absent (`brew install ollama` sur Mac, script officiel sur Linux).
3. Télécharge le modèle `llama3.1:8b` (**~5 Go**, une seule fois).
4. Démarre SearXNG (Docker).
5. Vérifie que tout répond.

Relançable sans risque à tout moment (idempotent).

### Si Docker n'est pas installé

Le script ne l'installe pas tout seul — l'installeur de Docker Desktop a une
étape graphique (accepter la licence) qu'un script ne peut pas automatiser
proprement. Installe-le manuellement une fois : https://www.docker.com/products/docker-desktop/
Relance ensuite `npm run setup:local-search`.

### Ce que ça coûte en ressources

- **Pas besoin de GPU** — `llama3.1:8b` tourne en CPU, lentement mais suffisamment
  (c'est une extraction de texte déjà connu, pas de la génération créative).
- **~5 Go de disque** pour le modèle, téléchargés une seule fois.
- Une recherche peut prendre de quelques dizaines de secondes à plusieurs
  minutes selon le nombre de résultats — c'est normal et volontairement accepté
  (fonctionnalité utilisée occasionnellement, pas en continu).

## 3. Lancer le projet

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Ouvre http://localhost:5173, clique sur "Admin" (mot de passe : voir
`ADMIN_PASSWORD` dans `.env`, ou demande-le à un membre de l'équipe), onglet
**"Rechercher"**.
