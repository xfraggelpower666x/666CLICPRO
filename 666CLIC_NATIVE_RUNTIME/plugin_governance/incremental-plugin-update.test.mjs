import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateReleaseGates} from "./release-gate-check.mjs";
import {assessRawLogo,validateArchiveEvidence} from "./archive-preflight.mjs";
import {classifyClicPath} from "./semantic-body-boundary.mjs";

const read=p=>readFileSync(p,"utf8");
const current=read("666CLIC_NATIVE_RUNTIME/plugin_governance/INCREMENTAL_PLUGIN_UPDATE_CANDIDATE_2026-10-30.md");
const release=read("666CLIC_NATIVE_RUNTIME/plugin_governance/CARD_FORCE_RELEASE_GATES.md");
const governance=read("666CLIC_NATIVE_RUNTIME/current/RUNTIME_PLUGIN_STATE_FINGERPRINT_APPROVAL_GOVERNANCE.md");
const approval=JSON.parse(read("666clic-plugin/backup-circle/CLIC_PLUGIN_BACKUP_APPROVAL_CURRENT.json"));
const pluginCurrent=JSON.parse(read("666clic-plugin/current/PLUGIN_CURRENT.json"));
const requiredPaths=[
 "plugin.json",".codex-plugin/plugin.json","README.md",
 "references/visual-interface-contract.md","references/card-intelligence.md",
 "references/cross-surface-learning.md","skills/666clic-continuity/SKILL.md",
 "skills/666clic-dashboard/SKILL.md","skills/666clic-visual-interface/SKILL.md",
 "skills/666clic-card/SKILL.md","skills/666clic-force/SKILL.md"
];
const proof=()=>({pluginProviderReleaseId:"release1",repoCurrentReleaseId:"release1",
 archiveHash:"archive-evidence",logoHash:"logo-evidence",expectedLogoHash:"logo-evidence",
 binaryBackupVerified:true,sourceParityVerified:true,manifestValidated:true,
 hostCompatibilityPreflight:true,foreignMutation:false});

test("incremental R01 is isolated, anchored and does not claim a release",()=>{
 assert.match(current,/STATUS=ISOLATED_SOURCE_CANDIDATE_NOT_PRODUCTIVE/);
 assert.match(current,/BASE_HEAD=b41b4a086682f7631c6dcfff3a0f4e6eb5e47983/);
 assert.match(current,/LATEST_SEMANTIC_CANDIDATE=fbb8abea3411972e424b84fc14531deb7662ae21/);
 assert.match(current,/HISTORICAL_153_AND_SUFFIX_13=PRESERVED_NO_REPLAY/);
 for(const s of ["NO_PLUGIN_PROMOTION=true","BACKUP_ZIP=NOT_UPDATED","POINTER=UNCHANGED","NO_FOREIGN_WRITES=true"])
   assert.ok(current.includes(s),s);
});
test("patch-first package has exactly eleven distinct text paths and no binary replacement",()=>{
 const segment=current.split("## Proposed v0.1.23 text overlay (not built)")[1]?.split("## Active hard blockers")[0]??"";
 const list=segment.split("\n").filter(x=>x.startsWith("- ")).map(x=>x.slice(2).trim());
 assert.deepEqual(list,requiredPaths);
 assert.equal(new Set(list).size,11);
 assert.ok(!list.some(x=>x.startsWith("assets/")));
 assert.match(current,/no delete_paths for unchanged original binary assets/);
 assert.equal(pluginCurrent.current_live_version,"0.1.22");
 assert.equal(pluginCurrent.current_live_release_id,"pluginrel_6ac6f4e703288191b8757f336d33e186");
});
test("metadata-only provider inventory cannot pass prepublish binary gate",()=>{
 assert.equal(release.includes("MISSING_BINARY_CANNOT_BE_WAIVED=true"),true);
 assert.equal(validateArchiveEvidence({plugin_id:"p",release_id:"r"}).status,"WRITE_BLOCKED");
 assert.equal(assessRawLogo(null,"a".repeat(64),100).status,"WRITE_BLOCKED");
 assert.equal(evaluateReleaseGates({...proof(),archiveHash:null}).allowed,false);
});
test("wrong provider release and wrong logo cannot be approved",()=>{
 assert.equal(evaluateReleaseGates({...proof(),repoCurrentReleaseId:"stale"}).allowed,false);
 assert.equal(evaluateReleaseGates({...proof(),logoHash:"mismatch"}).allowed,false);
 assert.equal(validateArchiveEvidence({plugin_id:"p",release_id:"stale",provider_release_id:"new",archive_sha256:"a",logo_sha256:"h",logo_size:2,expected_logo_sha256:"h",expected_logo_size:2}).status,"CONFLICT_QUARANTINE");
});
test("prepublish and postpublish gates are distinct",()=>{
 assert.equal(evaluateReleaseGates(proof(),"PREPUBLISH").allowed,true);
 assert.equal(evaluateReleaseGates(proof(),"POSTPUBLISH").allowed,false);
 assert.equal(evaluateReleaseGates({...proof(),hostAcceptance:true,publishedReleaseReadback:true},"POSTPUBLISH").allowed,true);
});
test("fingerprint freshness requires seven stable inputs and governance-only tails remain distinguishable",()=>{
 for(const key of ["PLUGIN_ID","PLUGIN_VERSION","PLUGIN_RELEASE_ID","REPO_TEXT_SOURCE_TREE_SHA",
 "BINARY_BINDING_MANIFEST_SHA_OR_NOT_APPLICABLE","RUNTIME_SEMANTIC_BODY_HEAD","PLUGIN_CURRENT_SEMANTIC_CLASS"])
  assert.ok(governance.includes(key),key);
 assert.match(governance,/FINGERPRINT_CHANGE_SUPERSEDES_APPROVAL=true/);
 assert.match(governance,/POINTER_TAIL_WRITE_NE_RUNTIME_STATE_CHANGE=true/);
 assert.equal(classifyClicPath("666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json"),"GOVERNANCE");
 assert.equal(classifyClicPath("666CLIC_NATIVE_RUNTIME/facets/semantic_force_decision/src/contextual-outcome.mjs"),"SEMANTIC");
});
test("previous approval is superseded; never infer a backup ZIP, PFS execution or receipt",()=>{
 assert.equal(approval.execution_allowed,false);
 assert.equal(approval.backup_write_status,"PENDING");
 assert.equal(approval.backup_readback_status,"PENDING");
 assert.equal(approval.receipt_status,"PENDING");
 assert.match(current,/HANDOFF != BACKUP_EXECUTION/);
 assert.match(current,/actual bytes, extraction and asset hashes need executor readback/);
 assert.equal(approval.exact_release.version,"0.1.20");
 assert.notEqual(approval.exact_release.release_id,pluginCurrent.current_live_release_id);
});
