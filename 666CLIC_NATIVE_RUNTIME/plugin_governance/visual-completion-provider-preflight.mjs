// CLIC native visual-completion release-specific policy. Read-only pure evaluator.
// Do not infer provider archive bytes from a URL, historical digest, or a source ZIP.
import {evaluateReleaseGates} from "./release-gate-check.mjs";
const SHA256=/^[0-9a-f]{64}$/i;
const same=(a,b)=>typeof a==="string"&&a===b;
const ready=x=>x===true;
export function evaluateVisualCompletionProviderPreflight(e={}){
 const blockers=[];
 const add=(ok,label)=>{if(!ok)blockers.push(label);};
 const p=e.provider??{},c=e.candidate??{},a=e.archive??{},f=e.fingerprint??{},g=e.governance??{};
 add(same(p.plugin_id,"plugins_6abfb2e08fdc8191920dcdc4349c69c8"),"EXACT_NATIVE_PROVIDER_PLUGIN_ID");
 add(same(p.version,"0.1.22")&&same(p.release_id,"pluginrel_6ac6f4e703288191b8757f336d33e186"),"PINNED_PROVIDER_RELEASE_READBACK");
 add(ready(p.metadata_direct_readback)&&ready(p.file_list_direct_readback),"DIRECT_PROVIDER_READBACK");
 add(p.file_count===28&&p.logo_path==="assets/clic-logo.png"&&p.logo_size===2929725,"PROVIDER_FILE_LIST_AND_LOGO_METADATA");
 add(ready(c.exact_source_candidate_parity)&&ready(c.candidate_ci_pass),"PATCHFIRST_SOURCE_PARITY_CI");
 add(ready(a.current_provider_archive_bytes_read)&&ready(a.digest_measured_from_current_bytes)&&SHA256.test(a.current_archive_sha256??""),"CURRENT_PROVIDER_ARCHIVE_BYTES_SHA256");
 add(ready(a.current_logo_bytes_read)&&ready(a.logo_digest_measured_from_current_bytes)&&SHA256.test(a.current_logo_sha256??""),"CURRENT_PROVIDER_LOGO_BYTES_SHA256");
 add(ready(a.historical_archive_current_identity_independently_verified),"HISTORICAL_TO_CURRENT_PROVIDER_ARCHIVE_IDENTITY");
 add(ready(a.all_28_provider_file_bytes_compared),"CURRENT_28_FILE_BINARY_PARITY");
 add(ready(a.logo_preserved)&&same(a.current_logo_sha256,"f2f3897727b62aa22f9d99d2cb8dca2920b7ca26829c902d45795822edbb0b7d"),"ORIGINAL_LOGO_BYTE_IDENTITY");
 add(ready(f.canonical_semantic_scope_verified)&&SHA256.test(f.fingerprint_sha256??"")&&ready(f.input_provenance_readback),"FULL_RUNTIME_FINGERPRINT");
 add(ready(g.native_approval_issued)&&same(g.approval_release_id,p.release_id)&&ready(g.approval_scope_verified),"EXPLICIT_NATIVE_RELEASE_APPROVAL");
 add(ready(g.plugin_patch_preserves_untouched_files)&&ready(g.prechange_backup_verified),"PATCH_AND_RECOVERY_BINDING");
 add(ready(g.host_compatibility_preflight)&&ready(g.no_foreign_writes)&&ready(g.pet_paused)&&ready(g.junior_preserved),"HOST_AND_AUTHORITY_PRECHECK");
 const legacy=evaluateReleaseGates({
  pluginProviderReleaseId:p.release_id,repoCurrentReleaseId:c.expected_provider_release_id,
  archiveHash:ready(a.digest_measured_from_current_bytes)?a.current_archive_sha256:undefined,
  logoHash:ready(a.logo_digest_measured_from_current_bytes)?a.current_logo_sha256:undefined,
  expectedLogoHash:"f2f3897727b62aa22f9d99d2cb8dca2920b7ca26829c902d45795822edbb0b7d",
  binaryBackupVerified:ready(g.prechange_backup_verified),
  sourceParityVerified:ready(c.exact_source_candidate_parity),
  manifestValidated:ready(f.canonical_semantic_scope_verified),
  hostCompatibilityPreflight:ready(g.host_compatibility_preflight),
  foreignMutation:!ready(g.no_foreign_writes)
 },"PREPUBLISH");
 if(!legacy.allowed)blockers.push(...legacy.missing.map(x=>"EXISTING_RELEASE_GATE_"+x));
 return {schema:"CLIC_VISUAL_COMPLETION_PROVIDER_PREFLIGHT_V1",status:blockers.length?"WRITE_BLOCKED":"PREPUBLISH_EVIDENCE_READY",allowed:blockers.length===0,blockers:[...new Set(blockers)],live_plugin_updated:false,host_acceptance:false,no_provider_publish_performed:true};
}
