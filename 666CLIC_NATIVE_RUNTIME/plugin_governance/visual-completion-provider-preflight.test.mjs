import test from "node:test";
import assert from "node:assert/strict";
import {evaluateVisualCompletionProviderPreflight as evaluate} from "./visual-completion-provider-preflight.mjs";
const sha="f2f3897727b62aa22f9d99d2cb8dca2920b7ca26829c902d45795822edbb0b7d";
const fixture=()=>({
 provider:{plugin_id:"plugins_6abfb2e08fdc8191920dcdc4349c69c8",version:"0.1.22",release_id:"pluginrel_6ac6f4e703288191b8757f336d33e186",metadata_direct_readback:true,file_list_direct_readback:true,file_count:28,logo_path:"assets/clic-logo.png",logo_size:2929725},
 candidate:{expected_provider_release_id:"pluginrel_6ac6f4e703288191b8757f336d33e186",exact_source_candidate_parity:true,candidate_ci_pass:true},
 archive:{current_provider_archive_bytes_read:true,digest_measured_from_current_bytes:true,current_archive_sha256:"a".repeat(64),current_logo_bytes_read:true,logo_digest_measured_from_current_bytes:true,current_logo_sha256:sha,historical_archive_current_identity_independently_verified:true,all_28_provider_file_bytes_compared:true,logo_preserved:true},
 fingerprint:{canonical_semantic_scope_verified:true,fingerprint_sha256:"b".repeat(64),input_provenance_readback:true},
 governance:{native_approval_issued:true,approval_release_id:"pluginrel_6ac6f4e703288191b8757f336d33e186",approval_scope_verified:true,plugin_patch_preserves_untouched_files:true,prechange_backup_verified:true,host_compatibility_preflight:true,no_foreign_writes:true,pet_paused:true,junior_preserved:true}
});
test("all verifiable gates are necessary for evidence-ready prepublication; this is not publication",()=>{
 const r=evaluate(fixture());assert.equal(r.allowed,true);assert.equal(r.status,"PREPUBLISH_EVIDENCE_READY");assert.equal(r.live_plugin_updated,false);assert.equal(r.host_acceptance,false);
});
test("archive URL, historical tar checksum, and provider metadata do not prove current original bytes",()=>{
 const x=fixture();x.archive.current_provider_archive_bytes_read=false;x.archive.digest_measured_from_current_bytes=false;x.archive.current_logo_bytes_read=false;x.archive.logo_digest_measured_from_current_bytes=false;
 const r=evaluate(x);assert.equal(r.status,"WRITE_BLOCKED");assert.ok(r.blockers.includes("CURRENT_PROVIDER_ARCHIVE_BYTES_SHA256"));assert.ok(r.blockers.includes("CURRENT_PROVIDER_LOGO_BYTES_SHA256"));
});
test("missing native approval, canonical fingerprint or 28-file parity block release",()=>{
 const x=fixture();x.governance.native_approval_issued=false;x.fingerprint.input_provenance_readback=false;x.archive.all_28_provider_file_bytes_compared=false;
 const r=evaluate(x);assert.equal(r.allowed,false);for(const name of ["EXPLICIT_NATIVE_RELEASE_APPROVAL","FULL_RUNTIME_FINGERPRINT","CURRENT_28_FILE_BINARY_PARITY"])assert.ok(r.blockers.includes(name));
});
test("mismatched release, logo, missing backup and foreign mutation block release",()=>{
 const x=fixture();x.provider.release_id="pluginrel_different";x.archive.current_logo_sha256="0".repeat(64);x.governance.prechange_backup_verified=false;x.governance.no_foreign_writes=false;
 const r=evaluate(x);assert.equal(r.allowed,false);for(const name of ["PINNED_PROVIDER_RELEASE_READBACK","ORIGINAL_LOGO_BYTE_IDENTITY","PATCH_AND_RECOVERY_BINDING","HOST_AND_AUTHORITY_PRECHECK"])assert.ok(r.blockers.includes(name));
});
test("candidate/source success cannot claim current plugin host success",()=>{
 const x=fixture();x.governance.host_compatibility_preflight=false;let r=evaluate(x);assert.equal(r.allowed,false);assert.equal(r.host_acceptance,false);assert.equal(r.no_provider_publish_performed,true);
});
