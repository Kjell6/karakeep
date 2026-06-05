# Fork Workflow

## Branches

| Branch | Zweck |
|--------|-------|
| `main` | Exaktes `upstream/main`. **Nie hier entwickeln.** |
| `kjell/custom` | Deine Features. Immer hier arbeiten. |

## Update einholen

```bash
git fetch upstream
git checkout main && git reset --hard upstream/main && git push origin main
git checkout kjell/custom && git merge main
# Konflikte lösen, dann:
git push origin kjell/custom
```

## Features entwickeln

```bash
git checkout kjell/custom
# ... ändern ...
git commit -m "feat: ..." && git push origin kjell/custom
```

> **Wichtig:** Nie auf `main` committen. Immer `pnpm` statt `npm` nutzen.

## Docker Image

Dein Image wird bei jedem Push auf `kjell/custom` automatisch gebaut:

```
ghcr.io/kjell6/karakeep-aio:latest
ghcr.io/kjell6/karakeep-web:latest
ghcr.io/kjell6/karakeep-workers:latest
```

In `docker-compose.yml`:
```yaml
services:
  karakeep:
    image: ghcr.io/kjell6/karakeep-aio:latest
```

## Tips

```bash
# Konflikte merken
git config --global rerere.enabled true

# Vor DB-Änderungen: Backup!
pnpm db:migrate
```
