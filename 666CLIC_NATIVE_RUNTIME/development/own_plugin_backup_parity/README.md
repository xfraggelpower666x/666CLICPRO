# CLIC — eigener Plugin-Release + vollständiges Backup-ZIP

STATUS=ISOLATED_DEV_CANDIDATE_NOT_LIVE
SCOPE=CLIC_OWN_PLUGIN_ONLY
SOURCE_METHOD=LYVRA_PATCH_FIRST_EXISTING_GOVERNANCE
FOREIGN_BACKUP_ORCHESTRATION=OUT_OF_SCOPE
NO_FOREIGN_AUTOACTIVATION=TRUE
NO_RELEASE_CREATED_BY_THIS_CANDIDATE=TRUE
NO_VAULT_WRITE=TRUE

## Ablauf zur nativen Integration
1. Eigenen aktuellen Pointer, eigene Plugin-ID und `current_release_id` frisch prüfen.
2. Nach Recovery und nativen Rechten ein gezieltes PATCH_FIRST-Overlay nur mit geänderten Skill- und Manifestdateien einsetzen. Bestehende Plugin-Creator-Funktion verwenden; kein neuer Router.
3. Plugin Creator `update_plugin` mit `expected_release_id` ausführen und die neue Version/Dateien direkt zurücklesen.
4. Das **vollständige Original-Archiv** dieser konkreten neuen Release-ID über einen autorisierten eigenen Export beziehen, nicht das PATCH_FIRST-Delta als Vollbackup etikettieren.
5. Unabhängige Bindungsdatei mit Plugin-ID, Version, Release-ID, SHA-256, Byte-Größe und Pflichtpfaden erzeugen. Unbekannte Hashes niemals schätzen.
6. `python verify_own_plugin_backup.py full-backup.zip binding.json`; Status belegt nur ZIP-Integrität, **nicht** die Herkunft vom Live-Release. Origin-/Release-Zuordnung separat anhand autorisierter Provider-Evidenz prüfen.
7. Nur den CLIC-eigenen Backup-Speicher nach eigener Authority schreiben; direkt bytegenau wieder zurücklesen und Restore-Eignung separat prüfen.
8. Bei offenem Export, Hash oder Backup-Readback: `PLUGIN_RELEASE_VERIFIED_BACKUP_PENDING` und neues Release behalten. Kein Rollback auf alte Version.
9. Native Registry, Visual Intelligence und Continuity abgleichen; Pointer **zuletzt** bei vollständigen nativen Abschluss-Gates. Danach keine weiteren Writes im selben Update.

## Isolation
- CLIC darf nur sein eigenes Plugin aktualisieren.
- LYVRA/CLIC/PFS als fremde Systeme behalten ihre unabhängige Authority.
- Bestehende PFS-Fremdbackup- und CLIC-Semantic-Visual-Governance werden nicht ersetzt.
- Für diesen Entwicklungszweig wurde **kein** Plugin veröffentlicht, kein Backup geschrieben und kein produktiver Current Pointer verändert.

## Isolierte Tests
`python -m unittest -v test_verify_own_plugin_backup.py`
Fünf reine Offline-Tests: gültiges Demo-ZIP, falscher Hash, falsche Größe, fehlendes Binärasset, falsche Manifestversion.
