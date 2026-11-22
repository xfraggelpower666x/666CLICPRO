 // CLIC-owned R09 advisory functions based on verified PFS governance patterns.
// No filesystem/network effects, no scheduling, no foreign activation or writing.
const SHA = /^[a-f0-9]{40}$/i;
const DIGEST = /^[a-f0-9]{64}$/i;
const str = x => typeof x === 'string' && x.trim().length > 0;
const pending = reason => ({status:'READBACK_PENDING',reason,write_authorized:false,host_accepted:false});
const conflict = reason => ({status:'CONFLICT_QUARANTINE',reason,write_authorized:false,host_accepted:false});
export function assessAuthorityStorageBoundary(x = {}) {
  if (x.owner !== '666CLIC') return {status:'WRITE_BLOCKED',reason:'CLIC_NATIVE_OWNER_REQUIRED',write_authorized:false};
  if (!str(x.peer_system) || !str(x.source_repo) || !SHA.test(x.source_head??'') || !str(x.classification)) return pending('SOURCE_IDENTITY_AND_PROVENANCE_REQUIRED');
  if (!['EXTERNAL_BACKUP_CHILD','CLIC_LOCAL_LIVE_FACET','SYSTEM_ARTIFACT'].includes(x.classification)) return conflict('UNKNOWN_CLASSIFICATION');
  if (x.classification === 'EXTERNAL_BACKUP_CHILD' && (x.runtime_owner === '666CLIC' || x.foreign_write === true || x.autoactivate === true)) return conflict('FOREIGN_LIVE_AUTHORITY_CANNOT_BE_ASSUMED');
  if (x.classification === 'CLIC_LOCAL_LIVE_FACET' && (x.runtime_owner !== '666CLIC' || x.native_current_readback !== true)) return pending('CLIC_LOCAL_AUTHORITY_AND_CURRENT_REQUIRED');
  if (x.classification === 'SYSTEM_ARTIFACT' && (!DIGEST.test(x.sha256??'') || !Number.isSafeInteger(x.size_bytes) || x.size_bytes<=0 || x.binary_readback !== true)) return pending('ARTIFACT_BYTES_SIZE_HASH_READBACK_REQUIRED');
  return {status:'SCOPED_STORAGE_CLASSIFICATION_CANDIDATE',classification:x.classification,peer_system:x.peer_system,source_head:x.source_head,live_authority:x.runtime_owner??'EXTERNAL_OR_UNVERIFIED',backup_ne_live:true,automatic_reclassification:false,write_authorized:false,host_accepted:false};
}
export function assessForeignPluginBackupApproval(x = {}) {
  if (x.owner !== '666CLIC' || !str(x.plugin_id) || !str(x.target_release_id) || !str(x.target_version)) return pending('EXACT_NATIVE_PLUGIN_TARGET_REQUIRED');
  if (x.plugin_owner === '666CLIC') return conflict('OWN_PLUGIN_NOT_FOREIGN_BACKUP_SCOPE');
  const approval=x.approval;
  if (!approval || approval.explicit !== true || approval.plugin_id !== x.plugin_id || approval.release_id !== x.target_release_id || approval.version !== x.target_version) return {status:'WRITE_BLOCKED',reason:'RELEASE_BOUND_OWNER_APPROVAL_REQUIRED',write_authorized:false,host_accepted:false};
  if (!SHA.test(x.source_head??'') || approval.source_head !== x.source_head) return conflict('SOURCE_RELEASE_FRESHNESS_CONFLICT');
  if(x.binary_readback !== true) return pending('EXACT_PLUGIN_BINARY_READBACK_REQUIRED');
  return {status:'BACKUP_APPROVAL_EVIDENCE_CANDIDATE',plugin_id:x.plugin_id,release_id:x.target_release_id,version:x.target_version,write_authorized:false,host_accepted:false,backup_executed:false};
}
export function assessRegistryDetachContinuity(x = {}) {
  if(x.owner !== '666CLIC' || !str(x.entry_id) || !SHA.test(x.observed_head??'')) return pending('CLIC_REGISTRY_AND_HEAD_REQUIRED');
  if(!x.current || x.current.entry_id!==x.entry_id || !SHA.test(x.current.source_head??'')) return pending('BOUND_CURRENT_ENTRY_REQUIRED');
  if(x.current.source_head !== x.observed_head) return conflict('STALE_REGISTRY_CURRENT');
  if(x.current.detached===true){
    if(x.requested_live_selection===true || x.historical_runtime_promote===true) return conflict('DETACHED_CHILD_HISTORY_MUST_NOT_REACTIVATE');
    return {status:'HISTORY_ONLY_RETAINED',entry_id:x.entry_id,selectable:false,reference_readable:true,write_authorized:false,host_accepted:false};
  }
  if(x.current.independent_readback!==true) return pending('LIVE_ENTRY_READBACK_REQUIRED');
  return {status:'LIVE_ENTRY_SOURCE_CANDIDATE',entry_id:x.entry_id,selectable_by_explicit_native_intent_only:true,write_authorized:false,host_accepted:false};
}