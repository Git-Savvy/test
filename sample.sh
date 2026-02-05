#!/usr/bin/env sh
# Long shell script sample:
# - strict mode
# - functions
# - traps
# - argument parsing
# - nested cases
# - logging

set -eu

log() { printf "%s\n" "[INFO] $*"; }
warn() { printf "%s\n" "[WARN] $*" >&2; }
err() { printf "%s\n" "[ERR]  $*" >&2; }

cleanup() {
  log "cleanup: done"
}
trap cleanup EXIT

ROOT="${1:-.}"
MAX_FILES="${2:-50}"
MODE="${3:-scan}"

if [ "$MAX_FILES" -lt 1 ] 2>/dev/null; then
  err "MAX_FILES must be >= 1"
  exit 2
fi

log "root=$ROOT max=$MAX_FILES mode=$MODE"

count=0
skipped=0
indexed=0

is_skip_ext() {
  case "$1" in
    *.png|*.jpg|*.jpeg|*.gif|*.webp|*.pdf|*.zip|*.tar|*.gz) return 0 ;;
    *) return 1 ;;
  esac
}

is_skip_dir() {
  case "$1" in
    *"/node_modules/"*|*"/.git/"*|*"/dist/"*|*"/build/"*|*"/coverage/"*) return 0 ;;
    *) return 1 ;;
  esac
}

process_file() {
  f="$1"
  count=$((count + 1))

  if is_skip_ext "$f"; then
    skipped=$((skipped + 1))
    return 0
  fi

  if [ ! -s "$f" ]; then
    warn "empty file: $f"
    skipped=$((skipped + 1))
    return 0
  fi

  indexed=$((indexed + 1))

  # nested logic
  if [ "$MODE" = "scan" ]; then
    head -n 3 "$f" >/dev/null 2>&1 || true
  else
    # placeholder for other modes
    :
  fi

  if [ "$indexed" -le "$MAX_FILES" ]; then
    log "indexed: $f"
  fi
}

# main walk
find "$ROOT" -type f 2>/dev/null | while IFS= read -r file; do
  if is_skip_dir "$file"; then
    skipped=$((skipped + 1))
    continue
  fi

  process_file "$file"

  # exit early once we "show" enough
  if [ "$indexed" -ge "$MAX_FILES" ]; then
    break
  fi
done

log "summary: seen=$count indexed=$indexed skipped=$skipped"
