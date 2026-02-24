#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[deploy-home] %s\n' "$1"
}

require_env() {
  local var_name="$1"
  if [ -z "${!var_name:-}" ]; then
    printf '[deploy-home] Variable requise absente: %s\n' "$var_name" >&2
    exit 1
  fi
}

require_env "SSH_HOST"
require_env "SSH_USER"
require_env "SSH_PRIVATE_KEY"
require_env "GITHUB_REPOSITORY"

SSH_PORT="${SSH_PORT:-22}"
DEPLOY_REF="${DEPLOY_REF:-main}"
DEPLOY_ENVIRONMENT="${DEPLOY_ENVIRONMENT:-home}"
REPO_SLUG="${GITHUB_REPOSITORY}"
REPO_TOKEN="${GITHUB_TOKEN:-}"

if [ "$DEPLOY_ENVIRONMENT" != "home" ]; then
  log "Environnement '${DEPLOY_ENVIRONMENT}' non reconnu pour ce script (attendu: home)."
  exit 1
fi

log "Déploiement de ${REPO_SLUG}@${DEPLOY_REF} vers ${SSH_USER}@${SSH_HOST}:${SSH_PORT}."

ssh_key_file="$(mktemp)"
cleanup() {
  rm -f "$ssh_key_file"
}
trap cleanup EXIT

umask 077
printf '%s\n' "$SSH_PRIVATE_KEY" >"$ssh_key_file"
chmod 600 "$ssh_key_file"

ssh_opts=(
  -i "$ssh_key_file"
  -p "$SSH_PORT"
  -o BatchMode=yes
  -o StrictHostKeyChecking=accept-new
  -o ConnectTimeout=10
)

ssh "${ssh_opts[@]}" "${SSH_USER}@${SSH_HOST}" \
  bash -se -- "$DEPLOY_REF" "$REPO_SLUG" "$REPO_TOKEN" <<'REMOTE_SCRIPT'
set -euo pipefail

log() {
  printf '[remote] %s\n' "$1"
}

DEPLOY_REF="$1"
REPO_SLUG="$2"
REPO_TOKEN="${3:-}"
REPO_URL="https://github.com/${REPO_SLUG}.git"

git_with_auth() {
  if [ -n "$REPO_TOKEN" ]; then
    local auth_header
    auth_header="$(printf 'x-access-token:%s' "$REPO_TOKEN" | base64 | tr -d '\n')"
    git -c "http.extraheader=AUTHORIZATION: basic ${auth_header}" "$@"
    return
  fi

  git "$@"
}

APP_DIR="/home/arnaud/apps/tetrigular"
APP_PARENT_DIR="$(dirname "$APP_DIR")"

log "Préparation du dossier ${APP_DIR}"
mkdir -p "$APP_PARENT_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  log "Repository absent, clonage initial."
  if ! git_with_auth clone "$REPO_URL" "$APP_DIR"; then
    log "Clonage impossible. Si le repo est privé, vérifier que GITHUB_TOKEN est transmis."
    exit 1
  fi
fi

cd "$APP_DIR"
git remote set-url origin "$REPO_URL"

log "Mise à jour Git et résolution de la référence ${DEPLOY_REF}"
git_with_auth fetch --prune --tags origin

if [[ "$DEPLOY_REF" =~ ^[0-9a-f]{7,40}$ ]]; then
  log "Référence détectée comme SHA, checkout détaché."
  git checkout --detach "$DEPLOY_REF"
elif git rev-parse -q --verify "refs/tags/${DEPLOY_REF}" >/dev/null; then
  log "Référence détectée comme tag, checkout détaché."
  git checkout --detach "refs/tags/${DEPLOY_REF}"
else
  log "Référence détectée comme branche, alignement sur origin/${DEPLOY_REF}."
  git checkout -B "$DEPLOY_REF" "origin/${DEPLOY_REF}"
  git reset --hard "origin/${DEPLOY_REF}"
fi

deployed_commit="$(git rev-parse --short HEAD)"
log "Commit déployé: ${deployed_commit}"

log "Build de l'image Docker"
docker build -t tetris-app:latest .

if docker ps -a --format '{{.Names}}' | grep -Fxq 'tetris'; then
  log "Suppression du conteneur existant tetris"
  docker rm -f tetris
else
  log "Aucun conteneur tetris existant"
fi

log "Démarrage du conteneur tetris (8081 -> 80)"
docker run -d --name tetris -p 8081:80 --restart unless-stopped tetris-app:latest

log "Vérification HTTP locale sur 127.0.0.1:8081 (attente max 60s)"
max_attempts=30
sleep_seconds=2
http_status=""

for ((attempt=1; attempt<=max_attempts; attempt+=1)); do
  http_status="$(curl -sS -o /dev/null -I -w '%{http_code}' --connect-timeout 2 --max-time 5 http://127.0.0.1:8081 || true)"

  if [ "$http_status" = "200" ]; then
    log "Healthcheck OK (tentative ${attempt}/${max_attempts})"
    break
  fi

  log "Service pas encore prêt (tentative ${attempt}/${max_attempts}, code: ${http_status:-n/a})"
  sleep "$sleep_seconds"
done

if [ "$http_status" != "200" ]; then
  log "La vérification HTTP a échoué après ${max_attempts} tentatives (dernier code: ${http_status:-n/a})"
  log "Etat du conteneur tetris:"
  docker ps -a --filter name=tetris || true
  log "Derniers logs du conteneur tetris:"
  docker logs --tail 120 tetris || true
  exit 1
fi

log "Déploiement terminé avec succès (HTTP ${http_status})"
REMOTE_SCRIPT

log "Script terminé."
