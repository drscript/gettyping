# Deploying GetTyping

Single Fly.io VM, a persistent volume for the SQLite file, Litestream streaming that file to object storage. See [ADR 0004](adr/0004-single-vm-sqlite-litestream-deploy.md) for why.

The steps below need your Fly.io login and create real, billable cloud resources — they're written to be run by a person at a keyboard, not scripted unattended.

## One-time setup

```bash
fly auth login
fly launch --no-deploy --copy-config
```

`fly launch` reads the checked-in [`fly.toml`](../fly.toml) and offers to rename the placeholder `app` to something unique — accept the rename, it'll rewrite `fly.toml` for you.

Create the volume the SQLite file lives on:

```bash
fly volumes create gettyping_data --region iad --size 1
```

Create an object storage bucket for Litestream. Fly's own Tigris (S3-compatible, no separate account needed) is the simplest choice:

```bash
fly storage create
```

This prints a bucket name, endpoint, access key, and secret key. Set them as secrets — Litestream and the app both read these from the environment (see [`litestream.yml`](../litestream.yml)):

```bash
fly secrets set \
  LITESTREAM_BUCKET=<bucket-name> \
  LITESTREAM_ENDPOINT=<endpoint> \
  AWS_ACCESS_KEY_ID=<access-key> \
  AWS_SECRET_ACCESS_KEY=<secret-key>
```

Set `ORIGIN` once you know the app's real hostname — SvelteKit's CSRF check rejects form submissions without it:

```bash
fly secrets set ORIGIN=https://<your-app-name>.fly.dev
```

Set `ADMIN_TOKEN` to gate `/admin` — pick a long random value, there's no default and `/admin` is unreachable until this is set:

```bash
fly secrets set ADMIN_TOKEN=<a long random value>
```

## Deploying

```bash
fly deploy
```

Each deploy rebuilds the [`Dockerfile`](../Dockerfile) and restarts the VM. On start, [`scripts/docker-entrypoint.sh`](../scripts/docker-entrypoint.sh) restores from the Litestream replica only if the volume's SQLite file is missing, then always runs migrations, then hands off to the app under continuous replication. A normal redeploy finds the file already there and skips straight to migrate — the volume is never recreated, so in-flight Attempt handshakes survive the release.

## Proving the backup is real

Acceptance criterion for this ticket, not optional: actually restore once and check the data is there.

```bash
fly ssh console -C "litestream restore -config /etc/litestream.yml -o /tmp/restore-check.sqlite /data/gettyping.sqlite"
fly ssh console -C "sqlite3 /tmp/restore-check.sqlite 'select count(*) from players;'"
```

If that returns a sane row count, the replica is real and restorable. Delete `/tmp/restore-check.sqlite` afterward — it's a scratch copy, not a replacement for the live file.

## Upgrade path

If write volume or a genuine multi-region need ever justifies it, move to **Turso** — same SQLite dialect, the drizzle schema in `drizzle/` carries over unchanged. Not needed at launch; see [ADR 0004](adr/0004-single-vm-sqlite-litestream-deploy.md).
