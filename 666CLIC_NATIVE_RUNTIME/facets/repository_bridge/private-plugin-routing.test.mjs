import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../../../",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");
const approval=JSON.parse(read("666clic-plugin/backup-circle/CLIC_V0122_PRIVATE_VAULT_APPROVAL_CANDIDATE_2026-10-17.json"));
const handoff=JSON.parse(read("666CLIC_NATIVE_RUNTIME/outbox/666PFS/CLIC_PRIVATE_PLUGIN_V0122_BACKUP_REQUEST_20261017.json"));
const routing=read("666CLIC_NATIVE_RUNTIME/facets/repository_bridge/PRIVATE_PLUGIN_ARTIFACT_ROUTING.md");
test("public development does not expose private plugin original",()=>{
 assert.match(routing,/PUBLIC_DEVELOPMENT_NE_PLUGIN_PUBLICATION=true/);
 assert.match(routing,/PRIVATE_ARCHIVE_TO_PUBLIC_GITHUB=FORBIDDEN/);
 assert.equal(approval.target.repo,handoff.target.repo);
 assert.equal(approval.target.repo,"xfraggelpower666x/LYVRA-PRIVATE-VAULT");
 assert.equal(handoff.target.visibility,"PRIVATE");
 assert.equal(handoff.archive.original_bytes_stored_in_public_repo,false);
});
test("current original v0.1.22 identity and exact CLIC leg stay bound",()=>{
 assert.equal(approval.plugin.id,handoff.plugin.id);
 assert.equal(approval.plugin.release,handoff.plugin.release_id);
 assert.equal(approval.immutable_source_bytes.sha256,handoff.archive.sha256);
 assert.equal(approval.immutable_source_bytes.bytes,handoff.archive.bytes);
 assert.equal(approval.target.namespace,handoff.target.path_root);
 assert.equal(approval.target.contract_blob,handoff.target.contract_blob);
});
test("old approval is superseded; new candidate cannot authorize PFS write",()=>{
 assert.equal(approval.status,"PREPARED_NOT_APPROVED_WRITE_BLOCKED");
 assert.equal(approval.approval.approved,false);
 assert.equal(approval.approval.authorization_for_pfs_write,false);
 assert.equal(approval.approval.old_v0_1_20_approval,"SUPERSEDED");
 assert.equal(handoff.gates.clic_approval,"PENDING_NO_EXACT_NATIVE_APPROVAL");
 assert.equal(handoff.gates.fingerprint,"NOT_APPROVED");
 assert.equal(handoff.gates.semantic_parity,"UNRESOLVED");
});
test("handoff cannot fake delivery, storage, host or foreign activation",()=>{
 assert.equal(handoff.status,"PREPARED_NOT_DELIVERED_NOT_APPROVED");
 assert.equal(handoff.gates.delivery,"NOT_EVIDENCED");
 assert.equal(handoff.gates.vault_write,"NOT_PERFORMED");
 assert.equal(handoff.separation.lyvra_autoactivation,false);
 assert.equal(handoff.separation.pfs_autoactivation,false);
 assert.equal(handoff.separation.foreign_writes,false);
 assert.equal(handoff.separation.private_archive_publication,false);
 assert.equal(handoff.separation.pet,"PAUSED");
 assert.equal(handoff.separation.junior,"PRESERVED");
});
