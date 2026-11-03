import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {inspectClicPatchFirstDelta as inspect} from "./patchfirst-integrity-plan.mjs";
const owner=new URL("./",import.meta.url);
const read=p=>readFileSync(new URL(p,owner),"utf8");
const blob=s=>{const b=Buffer.from(s);return createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex")};
const names=["666clic-continuity","666clic-dashboard","666clic-visual-interface"];
const manifest=JSON.parse(read("PATCH_FIRST_CANDIDATE.json"));
const known=[".app.json",".codex-plugin/plugin.json","README.md","assets/clic-logo.png","plugin.json",
"references/authority.md","references/binary-asset-binding.md","references/continuity-and-forensics.md",
"references/cross-system-development-proposals.md","references/development-exchange-lifecycle.md",
"references/external-learning-self-interest.md","references/local-adaptive-learning.md",
"references/managed-system-visual-compliance.md","references/plugin-backup-governance.md",
"references/runtime-plugin-state-fingerprint.md","references/scope-lifecycle-synthesis.md",
"references/semantic-visual-intelligence-facet.md","references/storage-connectors.md",
"references/visual-interface-contract.md","skills/666clic-audit/SKILL.md",
"skills/666clic-continuity/SKILL.md","skills/666clic-dashboard/SKILL.md",
"skills/666clic-integration-audit/SKILL.md","skills/666clic-local-learning/SKILL.md",
"skills/666clic-systemstart/SKILL.md","skills/666clic-update/SKILL.md",
"skills/666clic-visual/SKILL.md","skills/666clic-visual-interface/SKILL.md"];
const p=()=>({plugin_id:"plugins_6abfb2e08fdc8191920dcdc4349c69c8",
 release_id:"pluginrel_6ac6f4e703288191b8757f336d33e186",version:"0.1.22",
 scope:"USER",discoverability:"PRIVATE",files:[...known]});
const c=()=>({files:names.map(name=>{
 const entry=manifest.three_source_skills.find(x=>x.name===name);
 return {path:"skills/"+name+"/SKILL.md",source_blob:entry.source_blob,candidate_blob:blob(read("skills/"+name+"/SKILL.md")),live_blob:entry.frozen_release_blob};
})});
const proof=()=>({provider_file_list_direct_readback:true,source_and_candidate_blob_readback:true,
 live_text_readback:true,immutable_release_preserved:true});
test("existing source candidate yields exactly three changed skills, 25 preserved entries, no deletion or release",()=>{
 const out=inspect({provider:p(),candidate:c(),proof:proof()});
 assert.equal(out.status,"PATCH_DELTA_SOURCE_READY_RELEASE_BLOCKED");
 assert.equal(out.delta_paths.length,3);assert.equal(out.untouched_provider_paths.length,25);
 assert.ok(out.untouched_provider_paths.includes("assets/clic-logo.png"));
 assert.deepEqual(out.delete_paths,[]);assert.equal(out.provider_release_published,false);
 assert.equal(out.native_approval,false);assert.equal(out.host_verified,false);
 assert.ok(out.blockers.includes("CANONICAL_RUNTIME_PLUGIN_FINGERPRINT_REQUIRED"));
});
test("provider release CAS, privacy, full inventory and original logo are mandatory",()=>{
 const a=p();a.release_id="unexpected";assert.equal(inspect({provider:a,candidate:c(),proof:proof()}).status,"WRITE_BLOCKED");
 const b=p();b.files=b.files.filter(x=>x!=="assets/clic-logo.png");assert.equal(inspect({provider:b,candidate:c(),proof:proof()}).status,"WRITE_BLOCKED");
 const d=p();d.scope="WORKSPACE";assert.equal(inspect({provider:d,candidate:c(),proof:proof()}).status,"WRITE_BLOCKED");
});
test("candidate mutation, duplicate patch, unknown path and source mismatch fail closed",()=>{
 const a=c();a.files[0].candidate_blob="f".repeat(40);assert.equal(inspect({provider:p(),candidate:a,proof:proof()}).status,"WRITE_BLOCKED");
 const b=c();b.files[2].path=b.files[0].path;assert.equal(inspect({provider:p(),candidate:b,proof:proof()}).status,"WRITE_BLOCKED");
 const d=c();d.files[0].live_blob=d.files[0].source_blob;assert.equal(inspect({provider:p(),candidate:d,proof:proof()}).status,"WRITE_BLOCKED");
});
test("inferred or forged readbacks cannot promote source delta",()=>{
 const a=proof();a.live_text_readback=false;
 assert.equal(inspect({provider:p(),candidate:c(),proof:a}).reason,"INDEPENDENT_SOURCE_AND_PROVIDER_PROOF_REQUIRED");
 const b=proof();b.immutable_release_preserved=false;
 assert.equal(inspect({provider:p(),candidate:c(),proof:b}).status,"WRITE_BLOCKED");
});
