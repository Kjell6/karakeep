# Kjell6 Karakeep Fork — Workflow Guide

> Kurzanleitung für den sauberen Fork-Workflow.

## Branch-Struktur

| Branch | Zweck |
|--------|-------|
| `main` | Exakte Kopie von `upstream/main`. **Nie hier entwickeln!** |
| `kjell/custom` | Deine eigenen Änderungen (Listen-Icons, Masonry, OCR, Metascraper, etc.) |

---

## 1. Upstream-Updates einholen

```bash
git fetch upstream
git checkout main
git reset --hard upstream/main
git push origin main
```

## 2. Eigene Features auf den neuesten Stand bringen (Rebase)

```bash
git checkout kjell/custom
git rebase main
# Falls Konflikte:
#   1. Dateien bearbeiten und lösen
#   2. git add <datei>
#   3. git rebase --continue
# Wiederholen bis fertig.
git push origin kjell/custom --force-with-lease
```

## 3. Neue Features entwickeln

```bash
git checkout kjell/custom
# ... Änderungen machen ...
git commit -m "feat: ..."
git push origin kjell/custom
```

**Wichtig:** Nie auf `main` committen!

---

## Hilfreiche Einstellung

`rerere` speichert, wie du Konflikte gelöst hast:

```bash
git config --global rerere.enabled true
```

---

## Troubleshooting

### "Force push" auf main notwendig?
Das ist normal und beabsichtigt. `main` soll immer exakt `upstream/main` entsprechen.

### Rebase zu viele Konflikte?
Alternative (weniger sauber, aber einfacher):
```bash
git checkout kjell/custom
git merge main
# Anstatt rebase
```
Aber: Rebase ist empfohlen, damit deine Commits immer "oben drauf" liegen.
