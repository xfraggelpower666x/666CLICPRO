import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const base="666CLIC_NATIVE_RUNTIME/plugin_governance/";
const r=JSON.parse(fs.readFileSync(base+"PLUGIN_V0122_EXACT_TEXT_PARITY_READBACK_2026-10-09.json","utf8"));
test("all claimed v0.1.22 snapshot paths exist, unique and exactly 27",()=>{
 assert.equal(r.release_version,"0.1.22");assert.equal(r.files.length,27);
 assert.equal(new Set(r.files).size,27);
 for(const p of r.files)assert.ok(fs.existsSync("666clic-plugin/releases/v0.1.22/"+p),p);
 assert.equal(r.individually_compared,27);assert.equal(r.identical_content,27);
});
test("text match must not be promoted to binary parity or host deployment",()=>{
 assert.equal(r.scope,"LIVE_TEXT_CONTENT_PARITY_ONLY_NOT_BINARY_PARITY");
 assert.equal(r.logo_sha256,"UNKNOWN_NO_ORIGINAL_BYTES");
 assert.equal(r.archive_sha256,"UNKNOWN_NO_ORIGINAL_BYTES");
 assert.equal(r.live_new_neon_card_force,"NOT_PUBLISHED");
 assert.equal(r.no_release_attempted,true);
});
test("seven CLIC outbox notices remain prepared with no external receipts",()=>{
 const notices=JSON.parse(fs.readFileSync("666CLIC_NATIVE_RUNTIME/outbox/visual/UNIFIED_NEON_VISUAL_NOTICE_REGISTRY_CURRENT.json","utf8"));
 assert.equal(notices.notices.length,7);
 assert.equal(notices.notices.filter(x=>x.state==="PREPARED"&&x.receipts.length===0).length,7);
 assert.equal(r.pet,"PAUSED_NO_MUTATION");
});
