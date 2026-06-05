# Kjell6 Fork — Umfassende Änderungsanalyse

> **Repo:** `Kjell6/karakeep` (Fork von `karakeep-app/karakeep`)  
> **Analysebasis:** `upstream/main` .. `HEAD` (kjell-0.8)  
> **Datum:** 2026-06-05  
> **Anzahl eigener Commits (ohne Merges):** ~60  

---

## Inhaltsverzeichnis

1. [CI/CD & Deployment](#1-cicd--deployment)
2. [Datenbank-Schema](#2-datenbank-schema)
3. [Listen-System (Lists)](#3-listen-system-lists)
4. [Bookmark UI & Layout](#4-bookmark-ui--layout)
5. [AI / Inference & Tagging](#5-ai--inference--tagging)
6. [Crawler & Metascraper](#6-crawler--metascraper)
7. [Search & OCR](#7-search--ocr)
8. [Mobile App](#8-mobile-app)
9. [Entfernte / Deaktivierte Features](#9-entfernte--deaktivierte-features)
10. [Weitere UI/UX Änderungen](#10-weitere-uiux-änderungen)
11. [Dokumentation](#11-dokumentation)
12. [Zusammenfassung der Beeinflussten Bereiche](#12-zusammenfassung-der-beeinflussten-bereiche)

---

## 1. CI/CD & Deployment

### 1.1 GHCR Image Publishing
- **Neu:** Docker-Images werden zu GitHub Container Registry (GHCR) gepublished
- **Kompatibilität:** Images werden zusätzlich unter `ghcr.io/mohamedbassem/...` gepublished (für Rückwärtskompatibilität)
- **Docker Login:** Von `secrets.GHCR_GITHUB_PAT` auf `secrets.GITHUB_TOKEN` umgestellt (sicherer, da kein separater PAT nötig)
- **Workflow-Versionen:** Von pinned SHA-Hashes auf semver-Tags (`@v4`, `@v3`, `@v5`) umgestellt (weniger sicher, aber wartungsfreundlicher)
- **Tags:** `kjell-*` Tags triggern GHCR-Publish mit `latest` Tag
- **Trigger:** Zuerst nur bei Tags, dann wieder auf Push auf `main` umgestellt

### 1.2 Docker Compose
- `KARAKEEP_IMAGE` Umgebungsvariable in `docker/docker-compose.yml` eingeführt, um das Image zu parametrisieren
- `karakeep-linux.sh` Start-Skript hinzugefügt
- `start-dev.sh` verbessert

### 1.3 Pre-commit & Linting
- `format` aus dem `preflight` Script entfernt (beschleunigt den Dev-Start)

---

## 2. Datenbank-Schema

### 2.1 Neue Felder

| Feld | Tabelle | Beschreibung |
|------|---------|--------------|
| `color` | `bookmarkLists` | Optionale Akzentfarbe (`#RRGGBB`) für Listen |
| `sortOrder` | `bookmarkLists` | Manuelle Sortierreihenfolge (Integer, Default 0) |
| `thisListOnly` | `bookmarkLists` | Boolean: Nur in dieser Liste anzeigen, nicht im globalen Feed |
| `isFolder` | `bookmarkLists` | Boolean: Ordner (keine Bookmarks direkt speicherbar) |
| `bannerImageExtractedText` | `bookmarkLinks` | OCR-Text aus dem Banner-Bild (für Search & Tagging) |

### 2.2 Entfernte Felder
- `embeddingStatus` aus `bookmarks` entfernt (Embedding-Feature komplett deaktiviert)

### 2.3 Migrationen
- `0085_add_fork_list_customizations.sql`
- `0085_add_link_banner_extracted_text.sql`
- `0086_add_link_banner_extracted_text.sql` (Korrektur)
- `0087_add_list_sidebar_folder.sql`

---

## 3. Listen-System (Lists)

Das ist das **größte zusammenhängende Feature-Set** im Fork.

### 3.1 List Icons (Lucide + Emoji)
- **Neue Datei:** `packages/shared/listIcons.ts`
- **386 Zeilen** neuer Code für Lucide-Icon-System
- Listen-Icons können jetzt entweder Emoji oder `lucide:IconName` sein
- **11 Icon-Gruppen** (General, Favorites, Home, Work, Communication, Media, Nature, Travel, Food, Sports, Health)
- **Validierung:** `isValidListIconField()` prüft erlaubte Icons
- **API-Abstraktion:** `bookmarkListIconToApiFields()` trennt zwischen `icon` (für UI) und `symbolicIcon` (für Storage)
- **Auswirkungen:** EditListModal, Sidebar, AllListsView, ListHeader, PublicListHeader

### 3.2 Akzentfarben (List Colors)
- Jede Liste kann eine `#RRGGBB` Akzentfarbe haben
- Farbe wird in der Sidebar als Stripe/Indicator angezeigt
- `ListColorPicker` Komponente hinzugefügt
- Farbe wird in `ListIcon` Komponente als `style={{ color }}` übergeben

### 3.3 Sidebar-Ordner (Folders)
- **Neues Feature:** `isFolder` — Listen-Ordner, die keine Bookmarks direkt halten
- **Verwendung:** Nur für Organisation in der Sidebar (z.B. "Arbeit", "Privat")
- **Regeln:** Ordner müssen manuell sein, dürfen keine Query haben
- **UI:** Ordner zeigen Triangle-Icon statt Chevron, keine Bookmark-Anzahl
- **API:** `flattenListFolders` Option in `lists.list` — für Bookmark-Picker werden Ordner-Ebenen flachgelegt

### 3.4 Manuelle Sortierung (Persistent Sidebar Ordering)
- **Neue tRPC Mutation:** `lists.reorder`
- Drag & Drop zum Umsortieren in der Sidebar
- `sortOrder` Integer-Spalte für deterministische Reihenfolge
- `compareBookmarkLists()` Funktion für Sortierung
- **Scope:** Nur eigene Listen (nicht Shared)

### 3.5 This-List-Only (Silo-Modus)
- **Neues Feld:** `thisListOnly` auf `bookmarkLists`
- **Funktion:** Bookmarks, die nur in `thisListOnly`-Listen sind, erscheinen **nicht** im globalen Home-Feed
- **Use Case:** Ordner für "Drafts", "Privat", "Später lesen" ohne Feed-Überladung
- **Logik:** `bookmarkVisibleOutsideThisListOnlySilos()` in `packages/trpc/lib/bookmarkGlobalListVisibility.ts`
- **Beeinflusst:** Home Feed, Favourites, Search, Tag-Seiten, Smart Lists
- **Archivierung:** Beim Löschen einer `thisListOnly`-Liste werden exklusive Bookmarks automatisch archiviert (nicht gelöscht)

### 3.6 Sidebar UI-Overhaul
- **Collapsible:** `CollapsibleTriggerTriangle` statt `CollapsibleTriggerChevron` (visuell subtiler)
- **Drag Handle:** Bookmarks können per Drag & Drop auf Listen in der Sidebar geschoben werden
- **BookmarkDragHandle:** Neues Icon (GripVertical) auf Cards, nur bei Hover sichtbar
- **Drop Highlight:** Visuelles Feedback beim Drag-over
- **Aufbau:** Eigene Listen (owned) werden getrennt von Shared Lists angezeigt
- **List Icons:** Lucide-Icons mit Stroke-Width und Color-Support
- **Num Bookmarks:** Anzahl wird nur noch bei Hover angezeigt (saubereres UI)

### 3.7 EditListModal Erweiterungen
- **Ordner erstellen:** `isFolder` Prefill-Support
- **ListIconPicker:** Ersetzt Emoji-Mart Picker (kein `emoji-mart` mehr nötig)
- **ColorPicker:** Neue Farbauswahl
- **thisListOnly Toggle:** Für manuelle Listen
- **Switch Typ:** Smart/Manual umstellen mit Auto-Reset von `thisListOnly`
- **Form Reset:** Besserer Reset bei Öffnen/Schließen

### 3.8 ListHeader Redesign
- **Größeres Icon:** 24px statt Emoji in 4xl
- **Collaborators:** Avatar-Stack mit Tooltips statt separater Section
- **thisListOnly Badge:** Sichtbarer Badge im Header
- **Privacy Label entfernt:** Weniger visueller Noise
- **Item Count entfernt:** Aus Header entfernt (war redundant)

### 3.9 AllListsView & PublicListHeader
- Lucide-Icons + Akzentfarben übernommen
- Symbolische Icons für API-Clients

---

## 4. Bookmark UI & Layout

### 4.1 Masonry Layout (Eigenimplementierung)
- **Neues System:** `apps/web/lib/masonry/` (4 neue Dateien)
- **Balanced Masonry:** Greedy-Algorithmus verteilt Bookmarks in Spalten basierend auf geschätzter Höhe
- **Höhenschätzung:**
  - Links mit Banner: `base + 140 + hash * 420`
  - Links ohne Banner: `base + 48`
  - Text: `base + min(340, 100 + textLen * 0.12)`
  - Assets (Bilder): `base + 120 + hash * 400`
  - Editor Card: `220px` fix
- **Breakpoints:** Responsive Spaltenanzahl (default, 640, 768, 1024, 1280, 1536)
- **Sentinel:** IntersectionObserver auf jeder Spalte für "Load More" (vorher nur eine globale)
- **Skeleton:** Angepasst an Masonry-Layout (spaltenbasiert statt grid)
- **Vorteil:** Kein vertikaler Whitespace wie bei CSS-Masonry, besseres Balancing

### 4.2 Bookmark Cards Redesign
- **Luminance-basierte Action Buttons:** `useImageTopRightIsDark` Hook
  - Prüft, ob die obere rechte Ecke des Banner-Bildes dunkel ist
  - Action Buttons (Favorisieren, Öffnen, More) passen Farbe an (weiß/hell auf dunkel, schwarz auf hell)
  - Fallback: `mix-blend-difference`
- **Image Overlay Variant:** `variant="image-overlay"` für ActionBar auf dem Bild
- **Drag Handle:** `BookmarkDragHandle` — GripVertical Icon, nur bei Hover, unterstützt `image-overlay`
- **Link Cards:** Links werden in Masonry bündig links ausgerichtet (statt zentriert)
- **Asset Cards:** Nutzen `<img>` statt Next.js `<Image>` für natürliche Höhe in Masonry
  - Nur bei expliziter Höhe (z.B. Grid-Layout) wird Next.js Image verwendet

### 4.3 ViewOptions (Global Actions)
- **Vereinfacht:** Layout-Switcher entfernt (Masonry ist Standard/Fix)
- **Verbleibend:** Spalten-Slider (Grid Columns), "Full Titles" Toggle
- **Per-List Settings:** `listViewOptions.ts` — speichert `showFullTitles` pro URL in localStorage

### 4.4 Full Titles Option
- **Neue Einstellung:** `showFullTitles` (global + per-list)
- **Wirkung:** Bookmark-Titel werden nicht mehr gekürzt (kein `truncate`), sondern vollständig angezeigt
- **Default:** `false` (also standardmäßig weiterhin gekürzt)

### 4.5 Loading / Skeleton
- **Blur-Image:** `blur.avif` aktualisiert, `blur.gif` hinzugefügt (Loading-Animation)
- **Masonry Skeleton:** Spaltenbasiert, passt sich an Breakpoints an
- **Load More Trigger:** Von `400px` auf `1500px` erhöht (früheres Prefetching)

### 4.6 Card Tweaks (v0.0.1)
- Hover-Image Border
- Title Sizing angepasst
- Background/Borders für non-text Cards entfernt (cleaner Look)

---

## 5. AI / Inference & Tagging

### 5.1 Prompt-System Überarbeitung
- **Neue Prompts:** `buildLinkBannerPrompt()` — Kombiniert Link-Metadaten + Banner-Bild + OCR-Text für Tagging
- **Tag-Anzahl:** Von 3-5 Tags auf **~10 Tags** angehoben (für Text + Link-Banner)
- **Image Prompts:** Von 10-15 auf **10-15 Tags** (unverändert, aber ohne `curatedTags` und `potentialRelevantTags`)
- **Text Prompts:** Truncation basiert auf echte Token-Anzahl (tiktoken `o200k_base`)
- **Lazy Loading:** `js-tiktoken` wird erst bei Bedarf geladen (reduziert Memory-Footprint)
- **Entfernt:** `curatedTags` und `potentialRelevantTags` aus allen Prompts entfernt
  - **Auswirkung:** `AISettings.tsx` — Prompt-Demo zeigt keine Curated Tags mehr
  - **Auswirkung:** `tagging.ts` Worker — keine Relevant-Tag-Abfrage mehr

### 5.2 Banner-Bild OCR (Link Banner OCR)
- **Neue Datei:** `apps/workers/lib/linkBannerImageOcr.ts`
- **Prozess:**
  1. Liest Banner-Bild aus AssetDB
  2. Überspringt GIFs
  3. Extrahiert Text via `imageOcr.ts`
  4. Speichert in `bookmarkLinks.bannerImageExtractedText`
  5. Triggert Search Reindex
- **Integration:** In `assetPreprocessingWorker.ts` und `crawlerWorker.ts` eingebunden
- **Use Case:** Text auf Banner-Bildern (z.B. Screenshots, Memes, Twitter-Images) wird für Search & Tagging nutzbar

### 5.3 Tagging Worker Erweiterungen
- **Link Banner Inference:** `inferTagsFromLinkBannerImage()`
  - Kombiniert Link-Text + Banner-Bild für Tagging
  - Max Asset Size Check
  - Fallback auf Text-Only wenn Bild nicht lesbar
- **Prompt-Expansion:** `$content` und `$tags` Placeholder in Custom Prompts
- **Deaktiviert:** Embedding-basierte "potentially relevant tags" werden nicht mehr in LLM-Kontext gegeben

### 5.4 Embedding-System (Deaktiviert)
- **Entfernt:** `vectorStore.ts` (gesamte Datei)
- **Entfernt:** `embeddingStatus` aus DB Schema
- **Entfernt:** `embeddingStatus` aus `shared/types/bookmarks.ts`
- **Entfernt:** `EMBEDDING_ENABLE_AUTO_INDEXING`, `EMBEDDING_DIMENSIONS`, `EMBEDDING_CONTEXT_LENGTH`, `EMBEDDING_NUM_WORKERS`, `EMBEDDING_JOB_TIMEOUT_SEC` aus Config
- **Worker:** `embeddingsWorker.ts` ist noch vorhanden aber inaktiv/gedrosselt
- **Plugins:** `vectorstore-meilisearch` noch im Code, aber nicht genutzt
- **Tests:** `embeddings.test.ts` vorhanden

---

## 6. Crawler & Metascraper

### 6.1 Neue Metascraper-Plugins

#### 6.1.1 TikTok oEmbed
- **Datei:** `apps/workers/metascraper-plugins/metascraper-tiktok.ts`
- Nutzt TikTok oEmbed API für Titel, Thumbnail, Author
- Bypassed TikTok's Anti-Scraping

#### 6.1.2 Pinterest oEmbed
- **Datei:** `apps/workers/metascraper-plugins/metascraper-pinterest.ts`
- **296 Zeilen** — sehr robustes Plugin
- Nutzt Pinterest oEmbed API
- **A11y-Boilerplate-Filter:** Erkennt und entfernt UI-Copy ("autocomplete results", "touch device users", "swipe gestures")
- **Cache:** In-Memory Cache mit 60s TTL für oEmbed-Requests
- **Fallback:** Meta-Description/Title aus DOM wenn oEmbed fehlschlägt
- **HTML-Escaping:** Sichere HTML-Generierung für Readability

#### 6.1.3 YouTube Shorts
- **Datei:** `apps/workers/metascraper-plugins/metascraper-youtube-shorts.ts`
- Spezifisches Scraping für YouTube Shorts URLs
- Extrahiert korrekte Metadaten (Titel, Dauer, Thumbnail)

#### 6.1.4 Twitter/X (fxtwitter)
- **Datei:** `apps/workers/metascraper-plugins/metascraper-twitter.ts` (implizit in `crawlerWorker.ts`)
- Nutzt fxtwitter API für bessere Twitter/X-Metadaten
- **Datei:** `patches/react-tweet@3.2.2.patch` entfernt (kein Patch mehr nötig)

### 6.2 Crawler Worker Änderungen
- **Twitter/X Support:** Integration von fxtwitter
- **Parse HTML Subprocess:** Anpassungen für neue Metascraper-Plugins
- **Asset Preprocessing:** Integration von Banner-OCR
- **Feed Worker:** Unverändert außer Anpassungen an Config

---

## 7. Search & OCR

### 7.1 Banner OCR in Search
- `bannerImageExtractedText` wird in die Search-Indexierung einbezogen
- **Datei:** `packages/trpc/lib/search.ts` — Anpassungen für Search-Query
- **Tests:** `packages/trpc/lib/__tests__/search.test.ts` erweitert

### 7.2 Image OCR
- **Datei:** `apps/workers/lib/imageOcr.ts` (angepasst)
- Unterstützt verschiedene Bildformate (kein GIF)
- Integration mit `linkBannerImageOcr.ts`

---

## 8. Mobile App

### 8.1 Entfernte Komponenten
- **ActionBar.tsx** (`apps/mobile/components/bookmarks/card/ActionBar.tsx`) — **entfernt**
  - Enthielt Bookmark-Menü (Share, Delete, Archive, Favorite, Edit)
  - **Auswirkung:** Mobile Bookmark-Cards haben kein Action-Menü mehr (oder es wurde in eine andere Komponente verschoben)
- **BookmarkListHeader.tsx** — **entfernt**
- **highlights.tsx** (`apps/mobile/app/dashboard/bookmarks/[slug]/highlights.tsx`) — **entfernt**
  - Highlights-Page für Bookmarks existiert nicht mehr

### 8.2 Geänderte Komponenten
- **BookmarkCard.tsx** — Redesign, Anpassung an neue Layout-Logik
- **BookmarkList.tsx** — Anpassungen an Listen-Icons und Sortierung
- **TagPill.tsx** — UI-Anpassungen
- **BookmarkListHeader** entfernt, stattdessen direkte Integration in Screens
- **AndroidSearchBar.tsx** — Anpassungen
- **manage_lists.tsx** — Anpassungen an neue Listen-Features (Icons, Farben, Ordner)
- **info.tsx** — Anpassungen
- **List-Screens** (`lists/[slug]/index.tsx`) — Anpassungen an neue List-Header und UI

### 8.3 App Config
- `.npmrc` hinzugefügt
- `app.config.js` angepasst
- `package.json` angepasst

### 8.4 Layouts
- `_layout.tsx` Anpassungen für Dashboard-Navigation
- `dashboard/(tabs)/(home)/_layout.tsx` und `index.tsx` angepasst

---

## 9. Entfernte / Deaktivierte Features

### 9.1 Embedding / Vektor-Suche (Komplett deaktiviert)
- **Grund:** Wahrscheinlich Performance/Kosten/Complexity
- **Entfernte Dateien:** `packages/shared/vectorStore.ts`
- **Entfernte DB-Spalte:** `bookmarks.embeddingStatus`
- **Entfernte Env-Vars:**
  - `EMBEDDING_ENABLE_AUTO_INDEXING`
  - `EMBEDDING_DIMENSIONS`
  - `EMBEDDING_CONTEXT_LENGTH`
  - `EMBEDDING_NUM_WORKERS`
  - `EMBEDDING_JOB_TIMEOUT_SEC`
- **Verbleibend:** `EMBEDDING_TEXT_MODEL` (wird evtl. noch für etwas genutzt?)
- **Beeinflusste Bereiche:**
  - `workers/inference/tagging.ts` — keine "potentially relevant tags" mehr
  - `packages/plugins/vectorstore-meilisearch` — inaktiv
  - `packages/trpc/stats.ts` — keine Embedding-Statistiken mehr
  - `AISettings.tsx` — keine Embedding-Settings mehr

### 9.2 Curated Tags (in AI Prompts)
- **Entfernt:** `curatedTags` und `potentialRelevantTags` aus allen Prompts
- **Entfernt:** `getCuratedTagsPrompt`, `getPotentialRelevantTagsPrompt` aus `packages/shared/utils/tag.ts`
- **Beeinflusste Bereiche:**
  - `AISettings.tsx` — Prompt-Demo zeigt keine Tag-Listen mehr
  - `tagging.ts` — Keine Vorauswahl von Tags basierend auf Embeddings

### 9.3 Emoji-Mart (in EditListModal)
- **Entfernt:** `@emoji-mart/data` und `@emoji-mart/react` aus EditListModal
- **Ersatz:** `ListIconPicker` mit Lucide-Icons
- **Beeinflusste Bereiche:** `EditListModal.tsx`, `package.json` (Dependencies)

### 9.4 react-tweet Patch
- **Entfernt:** `patches/react-tweet@3.2.2.patch`
- **Grund:** Ersatz durch fxtwitter-Integration oder upstream Fix

### 9.5 Mobile ActionBar / Highlights
- **Entfernt:** `ActionBar.tsx`, `highlights.tsx`, `BookmarkListHeader.tsx`
- **Grund:** UI-Vereinfachung oder Umbau auf andere Navigation

---

## 10. Weitere UI/UX Änderungen

### 10.1 Web App
- **GlobalActions:** `ButtonWithTooltip` auf `Button` umgestellt (vereinfacht)
- **Admin:** `BackgroundJobs.tsx`, `BookmarkDebugger.tsx`, `ServiceConnections.tsx` — ggf. Anpassungen
- **Settings:** `AISettings.tsx` — Anpassungen für entfernte Features (Curated Tags, Embeddings)
- **Public Lists:** `PublicBookmarkGrid.tsx`, `PublicListHeader.tsx` — Anpassungen an neue List-Icons/Farben
- **Keyboard Shortcuts:** Unverändert, aber GlobalActions-Button verändert

### 10.2 i18n (Internationalisierung)
- **Alle Sprachen:** Neue Keys für Listen-Features hinzugefügt
  - `icon_group_*` (11 Gruppen)
  - `lists.new_folder`, `lists.folder_name_placeholder`
  - `lists.this_list_only_badge`
  - `lists.drag_bookmark_handle`
  - `lists.reorder`
  - `view_options.full_titles`
- **Deutsch:** Übersetzungen für alle neuen Keys

### 10.3 Icons & Assets
- **Neue SVGs:** `karakeep-full-white.svg`, `logo-*.png` (verschiedene Größen)
- **Screenshots:** `desktop.png`, `mobile.png` — aktualisiert für PWA/Manifest
- **Manifest:** `manifest.json` und `manifest.ts` angepasst

### 10.4 API / SDK
- **API-Spec:** `packages/open-api/karakeep-openapi-spec.json` — Anpassungen für neue Endpoints
- **SDK Typings:** `packages/sdk/src/karakeep-api.d.ts` — Anpassungen für `symbolicIcon`, `color`, `thisListOnly`, `isFolder`
- **API Routes:** `packages/api/routes/bookmarks.ts`, `packages/api/routes/metrics.ts` — Anpassungen

### 10.5 Shared Packages
- **listIcons.ts:** Neues zentrales Icon-System
- **listUtils.ts:** `compareBookmarkLists()`, `ZBookmarkListTreeNode`
- **listFolders.ts:** `flattenBookmarkListFoldersForBookmarkPickers()`
- **prompts.ts:** Neue Prompt-Funktionen, Lazy-Loading, Token-Truncation
- **prompts.server.ts:** Anpassungen für entfernte Curated Tags
- **prompts.test.ts:** Neue Tests für Prompt-System
- **types/lists.ts:** `zListColorHex`, `zReorderBookmarkListsSchema`, `symbolicIcon`, `thisListOnly`, `isFolder`
- **types/bookmarks.ts:** `embeddingStatus` entfernt

### 10.6 tRPC
- **Router:** `lists.ts` — `reorder` Mutation, `flattenListFolders` Option, `getCollaborators` Output erweitert
- **Model:** `packages/trpc/models/lists.ts` — `reorderOwned()`, `sortOrder`, `isFolder`, `thisListOnly`, `color`, `symbolicIcon`
- **Model:** `packages/trpc/models/bookmarks.ts` — Anpassungen für `bookmarkGlobalListVisibility`
- **Model:** `packages/trpc/models/assets.ts` — Anpassungen für Banner-Assets
- **Lib:** `packages/trpc/lib/bookmarkGlobalListVisibility.ts` — Neue SQL-Helper für `thisListOnly`
- **Lib:** `packages/trpc/lib/search.ts` — Banner-OCR in Search
- **Stats:** `packages/trpc/stats.ts` — Anpassungen (keine Embedding-Stats mehr)
- **Tests:** `lists.test.ts`, `bookmarks.test.ts` — Anpassungen für neue Features

### 10.7 E2E Tests
- **Bookmarks Test:** Anpassungen für `thisListOnly`, `symbolicIcon`
- **Embeddings Test:** Vorhanden aber möglicherweise inaktiv
- **Docker Compose:** Anpassungen für Test-Setup

### 10.8 Tools & Scripts
- **seed-snapshot:** Neues Tool (`tools/seed-snapshot/`) für DB-Seeding
  - `apply.ts`, `index.ts`, `docker-compose.yml`
  - **Entfernt:** `snapshots/seed-data-2026-05-20-163735.json` und `.tar.gz` (aus Repo entfernt)

---

## 11. Dokumentation

### 11.1 README.md
- **Kjell6 Fork Section:** Eigenes Kapitel mit Beschreibung der Fork-Features
- **UI Screenshot:** `kjell6-fork-ui.png` eingebunden
- **Beschreibung:** Liste der Fork-Features (Listen, Icons, Farben, Masonry, OCR, Metascraper, etc.)
- **Image Source:** Aktualisiert (Screenshot)

### 11.2 AGENTS.md
- Aktualisiert für den Fork-Kontext

### 11.3 docs/
- **Konfiguration:** `docs/docs/03-configuration/01-environment-variables.md` — Anpassungen für entfernte Env-Vars
- **FAQ:** `versioned_docs/version-v0.32.0/06-administration/02-FAQ.md` — Anpassungen

---

## 12. Zusammenfassung der Beeinflussten Bereiche

### 12.1 Kritische Änderungen (Breaking Changes)

1. **Datenbank-Schema:** Neue Spalten erfordern Migrationen (`drizzle migrate`)
2. **API-Typen:** `ZBookmarkList` hat neue Felder (`symbolicIcon`, `color`, `sortOrder`, `thisListOnly`, `isFolder`) — SDK-Clients müssen aktualisiert werden
3. **Embedding-Deaktivierung:** Wenn Upstream Embedding nutzt, ist dies im Fork nicht verfügbar
4. **Env-Vars:** `EMBEDDING_*` Variablen entfernt, `GITHUB_TOKEN` statt `GHCR_GITHUB_PAT`
5. **Mobile UI:** ActionBar entfernt — mobile UX ist grundlegend anders

### 12.2 Feature-Matrix: Was ist neu vs. entfernt vs. geändert

| Feature | Status | Details |
|---------|--------|---------|
| **Listen-Icons (Lucide)** | ✅ Neu | 386 Zeilen, 11 Gruppen |
| **Listen-Farben** | ✅ Neu | `#RRGGBB` Akzentfarben |
| **Listen-Ordner** | ✅ Neu | `isFolder`, Sidebar-only |
| **Manuelle Sortierung** | ✅ Neu | Drag & Drop in Sidebar |
| **This-List-Only** | ✅ Neu | Silo-Modus für Listen |
| **Masonry Layout** | ✅ Neu | Eigenimplementierung mit Balancing |
| **Luminance Action Buttons** | ✅ Neu | Adaptive Farben auf Bildern |
| **Banner OCR** | ✅ Neu | OCR für Link-Banner-Bilder |
| **Link Banner Tagging** | ✅ Neu | AI-Tagging mit Bild + Text |
| **TikTok oEmbed** | ✅ Neu | Metascraper Plugin |
| **Pinterest oEmbed** | ✅ Neu | A11y-Filter, Cache |
| **YouTube Shorts** | ✅ Neu | Metascraper Plugin |
| **Twitter/X fxtwitter** | ✅ Neu | Crawler Support |
| **Full Titles Option** | ✅ Neu | Per-List + Global |
| **Drag & Drop Bookmarks** | ✅ Neu | Auf Sidebar-Listen |
| **GHCR Publishing** | ✅ Neu | CI/CD für Docker |
| **Embedding/Vektor-Suche** | ❌ Entfernt | Komplett deaktiviert |
| **Curated Tags in AI** | ❌ Entfernt | Aus Prompts entfernt |
| **Emoji-Mart** | ❌ Entfernt | Ersatz durch ListIconPicker |
| **Mobile ActionBar** | ❌ Entfernt | Kein Menü mehr |
| **Mobile Highlights** | ❌ Entfernt | Page entfernt |
| **Bookmark Grid Layout** | 🔄 Geändert | Grid/List/Compact entfernt, Masonry fix |
| **ViewOptions** | 🔄 Geändert | Vereinfacht |
| **Tagging Prompts** | 🔄 Geändert | ~10 Tags, kein Curated |
| **Prompt System** | 🔄 Geändert | Lazy tiktoken, Truncation |
| **Docker Login** | 🔄 Geändert | `GITHUB_TOKEN` statt PAT |
| **react-tweet Patch** | ❌ Entfernt | Nicht mehr nötig |

### 12.3 Dateien mit den meisten Änderungen

| Datei | Änderung | Bedeutung |
|-------|----------|-----------|
| `packages/shared/listIcons.ts` | +386 neu | Zentrales Icon-System |
| `apps/workers/metascraper-plugins/metascraper-pinterest.ts` | +296 neu | Pinterest Plugin |
| `packages/trpc/models/lists.ts` | ~+100 | List-Model mit Sortierung, Ordner, Farben |
| `apps/web/components/dashboard/lists/EditListModal.tsx` | ~+80 | Erweiterte Listen-Bearbeitung |
| `apps/web/lib/masonry/balancedMasonry.ts` | +146 neu | Masonry-Algorithmus |
| `apps/web/components/dashboard/sidebar/AllLists.tsx` | ~+100 | Sidebar-Redesign |
| `packages/shared/prompts.ts` | ~+120 | Prompt-System Überarbeitung |
| `apps/web/components/dashboard/bookmarks/BookmarkActionBar.tsx` | ~+40 | Luminance-Overlay |
| `apps/web/components/dashboard/lists/ListHeader.tsx` | ~+80 | Header-Redesign |
| `packages/trpc/lib/bookmarkGlobalListVisibility.ts` | +42 neu | thisListOnly SQL-Logik |
| `apps/workers/lib/linkBannerImageOcr.ts` | +108 neu | Banner OCR |
| `packages/db/schema.ts` | ~+8 | Neue Spalten |

### 12.4 Mögliche Seiteneffekte / Regressions

1. **thisListOnly + Smart Lists:** Smart Lists sehen Bookmarks aus `thisListOnly`-Listen möglicherweise nicht, da `bookmarkGlobalListVisibility` nur für manuelle Listen gilt. Das ist beabsichtigt, aber könnte überraschend sein.
2. **Masonry + Next.js Image:** AssetCards nutzen `<img>` statt Next.js Image für Masonry. Das verliert Lazy-Loading und Optimierung, gewinnt aber natürliche Höhen.
3. **Embedding-Entfernung:** Wenn Upstream in Zukunft Embedding-basierte Features (z.B. "ähnliche Bookmarks", "Semantic Search") einführt, sind diese im Fork nicht verfügbar.
4. **Mobile ActionBar:** Entfernung der ActionBar könnte mobile Nutzer verwirren, die gewohnt waren, Bookmarks über das Menü zu archivieren/löschen.
5. **Per-List Settings:** `localStorage` basierte Settings (`listViewOptions.ts`) sind nicht synchronisiert über Geräte (im Gegensatz zu serverseitigen Settings).
6. **Sidebar Reorder:** Nur clientseitig mit tRPC. Keine Optimistic UI für Sortierung (keine useOptimistic verwendet).
7. **Pinterest Cache:** In-Memory Cache (60s) im Worker-Prozess. Bei mehreren Worker-Instanzen nicht geteilt. Das ist akzeptabel, aber nicht optimal.
8. **Lucide Icons:** `ALLOWED_LUCIDE_ICON_NAMES` ist ein statisches Set. Neue Lucide-Icons müssen manuell hinzugefügt werden.

---

*Analyse erstellt durch gründliche Betrachtung der Git-Commit-Historie und aller Datei-Diffs zwischen `upstream/main` und `HEAD`.*
