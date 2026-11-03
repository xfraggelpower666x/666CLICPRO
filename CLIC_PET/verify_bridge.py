#!/usr/bin/env python3
"""Read-only SHA-256 verification of extracted CLIC_PET bridge files."""
import json,hashlib,pathlib,sys
folder=pathlib.Path(__file__).resolve().parent
manifest=json.loads((folder/'BRIDGE_MANIFEST.json').read_text(encoding='utf-8'))
repo_root=folder.parent
errors=[]
for path,record in manifest['files'].items():
    file=repo_root/path
    if not file.is_file(): errors.append('MISSING '+path);continue
    digest=hashlib.sha256(file.read_bytes()).hexdigest()
    if digest!=record['sha256'] or file.stat().st_size!=record['bytes']:errors.append('MISMATCH '+path)
print(f"VERIFY: {len(manifest['files'])-len(errors)}/{len(manifest['files'])} assets")
for error in errors:print(error)
sys.exit(bool(errors))
