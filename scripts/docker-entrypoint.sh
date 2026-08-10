#!/bin/sh
set -eu

# Runs once per container start, in this order:
#   1. restore the SQLite file from the Litestream replica if the volume is
#      empty (a brand-new volume, or disaster recovery) — a no-op if the file
#      already exists or no replica has been created yet;
#   2. bring the schema current before anything can serve a request;
#   3. hand off to `node build` under Litestream's continuous replication.
#
# The persistent volume is never recreated or wiped by this script, and step
# 1 only ever restores into an *absent* file — a redeploy against an existing
# volume always skips straight to migrate, so in-flight Attempt handshakes
# survive (see docs/adr/0004-single-vm-sqlite-litestream-deploy.md).

if [ -z "${DATABASE_PATH:-}" ]; then
	echo "DATABASE_PATH must name the SQLite database file" >&2
	exit 1
fi

mkdir -p "$(dirname "$DATABASE_PATH")"

if [ ! -f "$DATABASE_PATH" ]; then
	echo "No database file at $DATABASE_PATH — attempting a Litestream restore"
	litestream restore -if-replica-exists -config /etc/litestream.yml "$DATABASE_PATH"
fi

node scripts/migrate.mjs

exec litestream replicate -exec "node build" -config /etc/litestream.yml
