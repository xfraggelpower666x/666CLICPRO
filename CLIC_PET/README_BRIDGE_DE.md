# CLIC PET · GitHub Bridge v0.2.0

**Status:** ASSET_BRIDGE_PREPARED · NO_REPO_WRITE · NO_DEPLOYMENT

Quelle: `Cyberpunk-System-Doctor-Duo-v2.1-REPARIERT.zip`. Komplettes ZIP geprüft: 422 Einträge, `testzip()` ohne Fehler. Der freigegebene transparente Atlas ist `CLIC_PET/assets/duo-v2.1/final/spritesheet-extended.png` (1536 × 2288, SHA-256 siehe `BRIDGE_MANIFEST.json`).

## Ziel

Repository `xfraggelpower666x/666CLICPRO`, verifizierter Arbeitsbranch `clic-migration-rev79-staging` (**nicht** historisches `main` aus dem Handoff). Alle zusätzlichen Dateien liegen isoliert in `CLIC_PET/`.

## Manuelle, nicht-destruktive Übernahme

1. Repository lokal im Branch `clic-migration-rev79-staging` auschecken.
2. Bridge-ZIP separat entpacken. In PowerShell `python verify_bridge.py` ausführen (optional Python 3).
3. Ordner `CLIC_PET/` in den Root des ausgecheckten Repos kopieren. Vorhandenes `CLIC_PET/` nicht überschreiben; bei Konflikten einzeln vergleichen.
4. `git status`, `git diff --stat`, Zielpfade und Manifest gegenprüfen.
5. Commit/Push ausschließlich bewusst und nach Governance-Backup/Readback/Pointer-last; keine automatischen Aktionen durch diese Bridge.

## Umfang

Finale Sprite-Atlanten, finale Einzel-Frames, animierte GIF-Vorschauen, die zugehörigen finalen Prüfbelege und die Quell-README. Keine verworfenen Reihen/QA-Experimente, keine fremden Keys und keine automatischen Writes.

## Native Integration bleibt offen

* CLIC und Junior behalten getrennte Identitäten; ein gemeinsames PET ist nur eine Ausdrucksoberfläche.
* CLIC Junior Current muss separat verifiziert werden.
* Der eigene Cloudflare Worker `clic-junior-pet`, signierte Ereignisse, Visual-/Dashboard-Bindings, `clic-pet`-Skill, Sub-LifeCircle und Rehydration sind **nicht** Bestandteil eines funktionierenden Deployments in dieser Bridge.
* Die Datei `final/update-receipt.json` ist eine historische Aussage des offiziellen GPT-PET-Pakets, **kein** Beleg für eine CLIC-Repository- oder Worker-Integration.
* Bestehender CLIC Current, Release v0.1.22 und offene Binary-Fingerprint-Governance dürfen nicht automatisch geändert werden.
