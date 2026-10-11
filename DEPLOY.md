# Déploiement (Render)

Le repo contient un `render.yaml` à la racine qui déclare les deux services (backend Fastify + frontend statique). Render peut tout provisionner automatiquement à partir de ce fichier (Blueprint).

## Étapes (à faire une fois, manuellement sur render.com)

1. Créer un compte sur [render.com](https://render.com) (connexion avec GitHub recommandée — simplifie l'autorisation d'accès au repo).
2. **New** → **Blueprint**, sélectionner le repo `g-revel/conferences-provider`.
3. Render détecte `render.yaml` et propose de créer les deux services (`conferences-provider-backend`, `conferences-provider-frontend`). Valider.
4. Premier déploiement : quelques minutes (build + démarrage des deux services).
5. Le frontend sera accessible à `https://conferences-provider-frontend.onrender.com` (ou une variante si ce nom est déjà pris — Render l'indiquera).

## Fonctionnement

- Le frontend (site statique) proxifie `/api/*` vers le backend (règle de rewrite dans `render.yaml`) — aucun changement de code nécessaire, `HttpTalksClient` continue d'appeler `/api/talks` en relatif.
- Le backend sert `data/talks.json` (et les autres fichiers `data/`) directement depuis le repo Git — pas de base de données, pas de stockage persistant à configurer.

## Mettre à jour les données en ligne

Le pipeline de collecte (`refresh:*`) reste manuel et local (nécessite Ollama/SearXNG en local, voir `backend/CLAUDE.md`). Pour publier de nouvelles données :

```bash
cd backend
npm run refresh:events:light   # ou refresh:videos, refresh:priority-speakers...
git add data/talks.json
git commit -m "..."
git push
```

Render redéploie automatiquement les deux services à chaque push sur `main` (auto-deploy activé par défaut pour les Blueprints).

## ⚠️ Plan gratuit Render

Le plan `free` met le service en veille après ~15 min sans trafic — la première requête qui le réveille peut prendre 30 à 50 secondes (le backend et le frontend sont deux services indépendants, chacun peut être en veille séparément). Normal, pas un bug.
