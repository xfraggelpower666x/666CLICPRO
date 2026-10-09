import test from "node:test";import assert from "node:assert/strict";
import{evaluateNeonSourceParity,gateHostAcceptance}from "./neon-host-parity.mjs";
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
