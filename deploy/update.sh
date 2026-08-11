#!/usr/bin/env bash
#
# Battleship - deploy w modelu pull.
# Docelowa lokalizacja: /opt/stacks/battleship/update.sh (chmod 750, root)
#
# Przebieg:
#   1. flock - tylko jeden deploy naraz
#   2. porownanie obrazu zdalnego z uruchomionym; brak zmian => wyjscie 0
#   3. pg_dump PRZED zmiana (twardy warunek - nieudany dump przerywa deploy)
#   4. docker compose up -d --wait
#   5. przy niepowodzeniu healthchecka - automatyczny rollback na poprzedni obraz
#
# Uruchamiany przez systemd (battleship-update.service) - stdout/stderr ida do journald.

set -Eeuo pipefail

STACK_DIR="/opt/stacks/battleship"
BACKUP_DIR="/opt/backups"
RETENTION_DAYS=14
# Blokada w katalogu stacka - usluga chodzi jako norbert, ktory nie ma
# prawa zapisu do /var/lock.
LOCKFILE="/opt/stacks/battleship/.update.lock"
API_IMAGE="ghcr.io/norbertx23/battleship-api"
WEB_IMAGE="ghcr.io/norbertx23/battleship-web"
DB_CONTAINER="bs_db"
MIN_DUMP_BYTES=1024

log() { echo "[$(date +%H:%M:%S)] $*"; }

# --- 1. Blokada przed rownoleglymi deployami -------------------------------
exec 9>"$LOCKFILE"
if ! flock -n 9; then
    log "Inny deploy w toku - pomijam ten cykl."
    exit 0
fi

cd "$STACK_DIR"

# POSTGRES_* potrzebne do pg_dump
set -a
# shellcheck disable=SC1091
source "$STACK_DIR/.env"
set +a

image_id() { docker image inspect --format '{{.Id}}' "$1:${APP_TAG:-latest}" 2>/dev/null || echo "none"; }

# --- 2. Czy jest cos nowego? -----------------------------------------------
API_BEFORE=$(image_id "$API_IMAGE")
WEB_BEFORE=$(image_id "$WEB_IMAGE")

docker compose pull --quiet

API_AFTER=$(image_id "$API_IMAGE")
WEB_AFTER=$(image_id "$WEB_IMAGE")

if [[ "$API_BEFORE" == "$API_AFTER" && "$WEB_BEFORE" == "$WEB_AFTER" ]]; then
    log "Brak nowych obrazow - nic do zrobienia."
    exit 0
fi

log "Wykryto nowa wersje:"
log "  api: ${API_BEFORE:7:12} -> ${API_AFTER:7:12}"
log "  web: ${WEB_BEFORE:7:12} -> ${WEB_AFTER:7:12}"

# --- 3. Backup bazy - TWARDY warunek ---------------------------------------
mkdir -p "$BACKUP_DIR"
DUMP="$BACKUP_DIR/battleship-$(date +%FT%H%M).sql.gz"

log "Backup bazy -> $DUMP"
set +e
docker exec "$DB_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" 2>/dev/null | gzip > "$DUMP"
DUMP_RC=${PIPESTATUS[0]}
set -e

DUMP_SIZE=$(stat -c%s "$DUMP" 2>/dev/null || echo 0)
if [[ $DUMP_RC -ne 0 || $DUMP_SIZE -lt $MIN_DUMP_BYTES ]]; then
    log "BLAD: dump nieudany (rc=$DUMP_RC, rozmiar=${DUMP_SIZE}B). PRZERYWAM deploy - dane maja pierwszenstwo."
    rm -f "$DUMP"
    exit 1
fi
log "Backup OK (${DUMP_SIZE} B)."

find "$BACKUP_DIR" -name 'battleship-*.sql.gz' -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# --- 4. Deploy --------------------------------------------------------------
log "Uruchamiam nowa wersje..."
if docker compose up -d --wait; then
    log "SUKCES: stack zdrowy na nowej wersji."
    exit 0
fi

# --- 5. Rollback ------------------------------------------------------------
log "BLAD: healthcheck nie przeszedl. Rollback na poprzedni obraz."

if [[ "$API_BEFORE" == "none" || "$WEB_BEFORE" == "none" ]]; then
    log "KRYTYCZNE: brak poprzedniego obrazu (pierwsze uruchomienie) - rollback niemozliwy."
    docker compose logs --tail=50 || true
    exit 1
fi

docker tag "$API_BEFORE" "$API_IMAGE:rollback"
docker tag "$WEB_BEFORE" "$WEB_IMAGE:rollback"

if APP_TAG=rollback docker compose up -d --wait; then
    log "Rollback zakonczony - dziala poprzednia wersja. Dump: $DUMP"
    exit 1
fi

log "KRYTYCZNE: rollback rowniez sie nie powiodl. Wymagana interwencja."
docker compose logs --tail=50 || true
exit 2
