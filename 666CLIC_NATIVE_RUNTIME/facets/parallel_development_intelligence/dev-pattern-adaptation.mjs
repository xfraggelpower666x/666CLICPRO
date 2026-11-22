// CLIC-owned pure advisory adapter: three 666DEV-derived principles, no engine, I/O or scheduler.
// Consume only caller-verified CLIC-native PDI/evidence state. Never grant authority.
const SHA = /^[a-f0-9]{40}$/i;
const isSha = x => typeof x === 'string' && SHA.test(x);
const denied = reason => ({status:'READBACK_PENDING',reason,write_authorized:false,host_accepted:false});
export function assessScopedFacetCheckpoint({owner,scope,revision,pointer_blob,checkpoint_blob,observed_head,contradiction=false}={}) {
  if (owner!=='666CLIC' || scope!=='PARALLEL_DEVELOPMENT_INTELLIGENCE')
    return {status:'WRITE_BLOCKED',reason:'CLIC_NATIVE_SCOPE_REQUIRED',write_authorized:false};
  if (![revision,pointer_blob,checkpoint_blob,observed_head].every(isSha)) return denied('PINNED_FACET_EVIDENCE_REQUIRED');
  if (contradiction || revision!==observed_head)
    return {status:'CONFLICT_QUARANTINE',reason:'SOURCE_REVISION_OR_CHECKPOINT_CONFLICT',write_authorized:false};
  return {status:'SCOPED_CHECKPOINT_CANDIDATE',revision,pointer_blob,checkpoint_blob,
    native_store:'EXISTING_PDI_LEDGER_AND_FACET_CONTINUITY',write_authorized:false,host_accepted:false};
}
export function planRevisionBoundRecovery({owner,head,tree,artifact_sha256,archive_verified=false,bundle_verified=false}={}) {
  if(owner!=='666CLIC'||![head,tree].every(isSha))return denied('NATIVE_HEAD_AND_TREE_REQUIRED');
  const ok=typeof artifact_sha256==='string'&&/^[0-9a-f]{64}$/i.test(artifact_sha256)&&archive_verified===true&&bundle_verified===true;
  return {status:ok?'RECOVERY_EVIDENCE_CANDIDATE':'READBACK_PENDING',head,tree,
    reason:ok?null:'INDEPENDENT_ARCHIVE_BUNDLE_SHA256_READBACK_REQUIRED',
    requested_artifacts:['GIT_SOURCE_ARCHIVE','GIT_HISTORY_BUNDLE'],
    auto_restore:false,write_authorized:false,host_accepted:false};
}
export function planCausalRevalidation({owner,base_head,target_head,changed_paths,dependent_checks,unresolved_graph=false}={}) {
  if(owner!=='666CLIC'||![base_head,target_head].every(isSha)||!Array.isArray(changed_paths)||!Array.isArray(dependent_checks))
    return denied('EXACT_CAUSAL_REVISION_AND_DEPENDENCIES_REQUIRED');
  if(base_head===target_head && changed_paths.length)return {status:'CONFLICT_QUARANTINE',reason:'SAME_HEAD_WITH_CHANGED_FILES',write_authorized:false};
  const unsafe=changed_paths.some(p=>typeof p!=='string'||!p||p.startsWith('/')||p.split('/').includes('..'));
  if(unsafe)return {status:'CONFLICT_QUARANTINE',reason:'UNTRUSTED_DIFF_PATH',write_authorized:false};
  const checks=dependent_checks.map(c=>({id:c?.id??null,disposition:unresolved_graph||!Array.isArray(c?.inputs)||c.inputs.some(p=>changed_paths.includes(p))?'RECHECK':'UNIMPACTED_FOR_THIS_DIFF',executed:false}));
  return {status:'CLIC_NATIVE_READONLY_REVALIDATION_PLAN',base_head,target_head,checks,
    recheck_all:unresolved_graph,executed_checks:0,learning_promoted:false,write_authorized:false};
}
