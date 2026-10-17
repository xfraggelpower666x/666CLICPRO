import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>JSON.parse(readFileSync(p,"utf8"));
const e=read("666CLIC_NATIVE_RUNTIME/plugin_governance/V0122_RUNTIME_PLUGIN_FINGERPRINT_RECONCILIATION_2026-10-17.json");
const a=read("666clic-plugin/backup-circle/CLIC_V0122_PRIVATE_VAULT_APPROVAL_CANDIDATE_2026-10-17.json");
const h=read("666CLIC_NATIVE_RUNTIME/outbox/666PFS/CLIC_PRIVATE_PLUGIN_V0122_BACKUP_REQUEST_20261017.json");
test("exact original belongs to live v0.1.22 but remains separate from current development",()=>{
 assert.equal(e.plugin.release_id,h.plugin.release_id);
 assert.equal(e.provider_original.archive_sha256,h.archive.sha256);
 assert.equal(e.provider_original.regular_files,28);
 assert.notEqual(e.seven_inputs.repo_text_source_tree_sha.current_development_tree,e.seven_inputs.repo_text_source_tree_sha.historical_live_text_tree);
 assert.equal(e.skill_diff.length,3);
 for(const skill of e.skill_diff)assert.notEqual(skill.source_blob,skill.frozen_blob);
});
test("seven inputs exist and four remain unambiguous-approval blockers",()=>{
 assert.equal(Object.keys(e.seven_inputs).length,7);
 assert.equal(e.seven_inputs.plugin_id.status,"VERIFIED");
 assert.equal(e.seven_inputs.plugin_release_id.status,"VERIFIED");
 assert.equal(e.seven_inputs.runtime_semantic_body_head.status,"UNRESOLVED_FULL_SEMANTIC_DIFF_REVIEW_REQUIRED");
 assert.equal(e.decision.canonical_fingerprint_sha256,null);
 assert.equal(e.decision.canonical_fingerprint_issued,false);
});
test("no unapproved PFS execution, no foreign writes or mistaken provider release",()=>{
 assert.equal(a.approval.approved,false);
 assert.equal(a.approval.authorization_for_pfs_write,false);
 assert.equal(a.fingerprint_reconciliation_2026_10_17.fingerprint_sha256,null);
 assert.equal(h.gates.clic_approval,"PENDING_NO_EXACT_NATIVE_APPROVAL");
 assert.equal(h.fingerprint_reconciliation_2026_10_17.pfs_write_allowed,false);
 assert.equal(h.gates.delivery,"NOT_EVIDENCED");
 assert.equal(e.pfs.remote_private_vault_write,false);
 assert.equal(e.visual_impact.no_new_plugin_release,true);
 assert.equal(e.foreign_writes,false);
 assert.equal(e.pet,"PAUSED");
 assert.equal(e.junior,"PRESERVED");
});
