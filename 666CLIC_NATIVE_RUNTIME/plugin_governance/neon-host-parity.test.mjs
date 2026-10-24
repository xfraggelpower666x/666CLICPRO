import test from "node:test";import assert from "node:assert/strict";
import{evaluateNeonSourceParity,gateHostAcceptance,prepublishEvidence,postpublishEvidence}from "./neon-host-parity.mjs";
const root="666clic-plugin/source/";
test("source visual candidates contain Neon, Junior and paused PET contract",()=>{
 const x=evaluateNeonSourceParity({dashboard:root+"skills/666clic-dashboard/SKILL.md",visual:root+"skills/666clic-visual-interface/SKILL.md",reference:root+"references/visual-interface-contract.md"});
 assert.equal(x.status,"SOURCE_READY_HOST_UNVERIFIED");assert.equal(x.publish_allowed,false);
});
test("no original archive or host results means write blocked",()=>{
 const x=gateHostAcceptance({native_current_readback:"sha"});assert.equal(x.status,"WRITE_BLOCKED");assert.ok(x.missing.includes("original_archive_hash"));assert.ok(x.missing.includes("host_render_receipt"));
});
test("even complete inputs do not grant auto publication",()=>{
 const v=Object.fromEntries(["original_archive_hash","live_logo_hash","host_render_receipt","host_trigger_receipt","release_id_readback","native_current_readback"].map(k=>[k,"evidence"]));
 const x=gateHostAcceptance(v);assert.equal(x.status,"ELIGIBLE_FOR_NATIVE_RELEASE_REVIEW");assert.equal(x.automatic_publication,false);
});
test("PET mutation blocks",()=>assert.equal(gateHostAcceptance({pet_mutated:true}).status,"WRITE_BLOCKED"));

test("visual source does not prove live release or render acceptance",()=>{const p=evaluateNeonSourceParity({dashboard:"666clic-plugin/source/skills/666clic-dashboard/SKILL.md",visual:"666clic-plugin/source/skills/666clic-visual-interface/SKILL.md",reference:"666clic-plugin/source/references/visual-interface-contract.md"});assert.equal(p.host_tested,false);assert.equal(p.binary_verified,false);assert.equal(p.plugin_live_release,"0.1.22_UNCHANGED")});

test("prepublish only requires prepublication provenance and native approval",()=>{
 const p=prepublishEvidence({source_current_sha:"a",prechange_backup_sha:"a",original_archive_sha256:"archivehash",live_logo_sha256:"logohash",candidate_archive_sha256:"newhash",candidate_logo_sha256:"newlogo",authority_approval:"native"});
 assert.equal(p.status,"ELIGIBLE_FOR_NATIVE_PUBLICATION_REVIEW");assert.equal(p.may_publish_automatically,false)
});
test("postpublish host acceptance never inferred before release",()=>{
 const p=postpublishEvidence({});assert.equal(p.status,"READBACK_PENDING");assert.equal(p.live_accepted,false);assert.ok(p.missing.includes("published_release_id"));assert.ok(p.missing.includes("host_render_receipt"))
});
test("prepublish missing actual archive stays blocked",()=>{
 const p=prepublishEvidence({source_current_sha:"a",prechange_backup_sha:"a"});assert.equal(p.status,"WRITE_BLOCKED");assert.ok(p.missing.includes("original_archive_sha256"))
});
test("prepublish stale backup blocks",()=>{
 const p=prepublishEvidence({source_current_sha:"new",prechange_backup_sha:"old"});assert.ok(p.missing.includes("BACKUP_HEAD_MISMATCH"))
});
