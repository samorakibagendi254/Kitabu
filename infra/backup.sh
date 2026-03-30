#!/usr/bin/env bash
set -euo pipefail

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_dir="${KITABU_BACKUP_DIR:-/var/backups/kitabu}"
mkdir -p "$backup_dir"

pg_dump "$KITABU_DATABASE_URL" | gzip > "$backup_dir/kitabu-api-$timestamp.sql.gz"

find "$backup_dir" -type f -name '*.sql.gz' -mtime +14 -delete
