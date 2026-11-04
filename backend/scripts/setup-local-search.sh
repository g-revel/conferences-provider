#!/usr/bin/env bash
# Installe/démarre tout ce qu'il faut pour utiliser l'onglet "Rechercher" de
# l'admin en local : SearXNG (Docker) + Ollama (llama3.1:8b). Voir backend/SETUP.md
# pour le contexte complet. Idempotent : relançable sans risque si une étape a
# déjà été faite.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OS="$(uname -s)"

info()  { printf '\033[1;34m→\033[0m %s\n' "$1"; }
ok()    { printf '\033[1;32m✓\033[0m %s\n' "$1"; }
warn()  { printf '\033[1;33m!\033[0m %s\n' "$1"; }
fail()  { printf '\033[1;31m✗\033[0m %s\n' "$1"; }

# --- 1. Docker --------------------------------------------------------------
# Pas d'auto-install : Docker Desktop sur Mac nécessite une étape GUI (accepter
# la licence au premier lancement), pas fiable à scripter en aveugle.
info "Vérification de Docker..."
if ! command -v docker >/dev/null 2>&1; then
  fail "Docker n'est pas installé."
  echo "  → installe Docker Desktop : https://www.docker.com/products/docker-desktop/"
  echo "  → relance ce script une fois Docker installé et démarré."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  fail "Docker est installé mais le daemon ne tourne pas."
  echo "  → démarre Docker Desktop (ou le service docker), puis relance ce script."
  exit 1
fi
ok "Docker tourne."

# --- 2. Ollama ---------------------------------------------------------------
info "Vérification d'Ollama..."
if ! command -v ollama >/dev/null 2>&1; then
  info "Ollama absent, installation..."
  if [ "$OS" = "Darwin" ]; then
    if ! command -v brew >/dev/null 2>&1; then
      fail "Homebrew n'est pas installé — nécessaire pour installer Ollama sur Mac."
      echo "  → installe Homebrew : https://brew.sh, puis relance ce script."
      exit 1
    fi
    brew install ollama
    brew services start ollama
  elif [ "$OS" = "Linux" ]; then
    curl -fsSL https://ollama.com/install.sh | sh
  else
    fail "OS non reconnu ($OS) — installe Ollama manuellement : https://ollama.com/download"
    exit 1
  fi
else
  ok "Ollama déjà installé."
  if [ "$OS" = "Darwin" ] && command -v brew >/dev/null 2>&1; then
    brew services start ollama >/dev/null 2>&1 || true
  fi
fi

# --- 3. Modèle llama3.1:8b ----------------------------------------------------
# ~5 Go au premier run, incrémental/idempotent ensuite (ollama pull ne retélécharge
# pas ce qui est déjà présent).
info "Téléchargement du modèle llama3.1:8b (peut prendre plusieurs minutes la 1ère fois)..."
ollama pull llama3.1:8b
ok "Modèle llama3.1:8b prêt."

# --- 4. SearXNG ---------------------------------------------------------------
info "Démarrage de SearXNG..."
(cd "$BACKEND_DIR/searxng" && docker compose up -d)
ok "SearXNG démarré."

# --- 5. Vérification finale ---------------------------------------------------
info "Vérification..."
sleep 2
SEARXNG_OK=0
OLLAMA_OK=0
curl -sf "http://localhost:8080/search?q=test&format=json" >/dev/null 2>&1 && SEARXNG_OK=1
curl -sf "http://localhost:11434/api/tags" >/dev/null 2>&1 && OLLAMA_OK=1

echo ""
if [ "$SEARXNG_OK" = "1" ]; then ok "SearXNG répond sur http://localhost:8080"; else warn "SearXNG ne répond pas encore sur http://localhost:8080 (laisse-lui quelques secondes puis réessaie)"; fi
if [ "$OLLAMA_OK" = "1" ]; then ok "Ollama répond sur http://localhost:11434"; else warn "Ollama ne répond pas encore sur http://localhost:11434 (laisse-lui quelques secondes puis réessaie)"; fi

if [ "$SEARXNG_OK" = "1" ] && [ "$OLLAMA_OK" = "1" ]; then
  echo ""
  ok "Tout est prêt. Lance le backend (npm run dev) puis utilise l'onglet \"Rechercher\" de l'admin."
fi
