// CLIC R12: evidence-first CLS patterns. Pure, scoped, no I/O, no authority transfer.
// Existing PDI / continuity / semantic reader / source vault retain ownership.
const SHA40=/^[a-f0-9]{40}$/i;
const SHA256=/^[a-f0-9]{64}$/i;
const str=x=>typeof x==='string'&&x.trim().length>0;
const denied=(reason,status='READBACK_PENDING')=>({status,reason,advisory:true,write_authorized:false,host_accepted:false,executed:false});
const current=x=>x?.owner==='666CLIC'&&SHA40.test(x?.source_head??'')&&x.source_head===x.observed_head;
const safePath=x=>str(x)&&!x.startsWith('/')&&!x.split('/').includes('..')&&!x.includes('\\');

// The ledger and dashboard must describe the same native revision and objects.
export function assessArchiveMenuParity(x={}) {
 if(!current(x)||!str(x.scope)||!SHA40.test(x.ledger_blob??'')||!SHA40.test(x.menu_blob??''))return denied('PINNED_CLIC_LEDGER_AND_MENU_REQUIRED');
 if(x.foreign_execution===true||x.auto_reconcile===true)return denied('UNAUTHORIZED_MUTATION_OR_FOREIGN_EXECUTION','CONFLICT_QUARANTINE');
 if(!Array.isArray(x.entries)||!Array.isArray(x.menu))return denied('ENTRIES_AND_MENU_REQUIRED');
 const ids=x.entries.map(e=>e?.id), menuIds=x.menu.map(e=>e?.entry_id);
 if([...ids,...menuIds].some(id=>!str(id))||new Set(ids).size!==ids.length||new Set(menuIds).size!==menuIds.length)return denied('DUPLICATE_OR_INVALID_ENTRY_ID','CONFLICT_QUARANTINE');
 if(x.entries.some(e=>e.revision!==x.source_head)||x.menu.some(e=>e.revision!==x.source_head))return denied('REVISION_BOUND_PARITY_MISMATCH','CONFLICT_QUARANTINE');
 const missing=ids.filter(id=>!menuIds.includes(id)),orphans=menuIds.filter(id=>!ids.includes(id));
 if(missing.length||orphans.length)return {status:'PARITY_GAP_CANDIDATE',scope:x.scope,missing,orphans,write_authorized:false,host_accepted:false,executed:false};
 if(x.independent_readback!==true)return denied('INDEPENDENT_LEDGER_MENU_READBACK_REQUIRED');
 return {status:'CLIC_SCOPED_LEDGER_MENU_PARITY_CANDIDATE',scope:x.scope,count:ids.length,ledger_blob:x.ledger_blob,menu_blob:x.menu_blob,existing_owner:'PDI_AND_SVI',write_authorized:false,host_accepted:false,executed:false};
}

// Source vault only: no public-scope promotion from backup, historical imports or secret-containing evidence.
export function assessSourceVaultBoundary(x={}) {
 if(!current(x)||!str(x.source_id)||!safePath(x.path)||!SHA256.test(x.sha256??''))return denied('PINNED_SOURCE_AND_SAFE_PATH_REQUIRED');
 if(x.foreign_source_autoactivate===true||x.history_promote===true||x.backup_promote===true)return denied('FOREIGN_OR_HISTORY_PROMOTION_FORBIDDEN','CONFLICT_QUARANTINE');
 if(x.contains_secrets===true||x.private_original===true)return {status:'PRIVATE_SOURCE_VAULT_REQUIRED',source_id:x.source_id,public_allowed:false,write_authorized:false,host_accepted:false,executed:false};
 if(x.secret_scan_verified!==true||x.independent_byte_readback!==true)return denied('INDEPENDENT_BYTES_AND_SECRET_SCREEN_REQUIRED');
 if(x.classification!=='PUBLIC_SAFE_CANDIDATE')return denied('SOURCE_CLASSIFICATION_UNRESOLVED');
 return {status:'PUBLIC_SOURCE_CANDIDATE_ONLY',source_id:x.source_id,sha256:x.sha256,requires_existing_clic_native_write_gate:true,write_authorized:false,host_accepted:false,executed:false};
}

// Only model a reconstruction request; never run any foreign interpreter or content engine.
export function assessReconstructionProfile(x={}) {
 if(!current(x)||!str(x.request_id)||!str(x.profile_id)||!str(x.profile_version))return denied('NATIVE_PROFILE_AND_REQUEST_REQUIRED');
 if(x.foreign_execution===true||x.auto_invoke===true||x.authority_transfer===true)return denied('FOREIGN_EXECUTION_FORBIDDEN','CONFLICT_QUARANTINE');
 if(!Array.isArray(x.sources)||x.sources.length<1||x.sources.length>16||!Array.isArray(x.allowed_operations))return denied('SCOPED_SOURCE_AND_OPERATION_REGISTRY_REQUIRED');
 if(!str(x.operation)||!x.allowed_operations.includes(x.operation)||x.expected_profile_version!==x.profile_version)return denied('OPERATION_OR_PROFILE_VERSION_MISMATCH','CONFLICT_QUARANTINE');
 const ids=x.sources.map(s=>s?.source_id);
 if(ids.some(id=>!str(id))||new Set(ids).size!==ids.length||x.sources.some(s=>!SHA40.test(s?.source_blob??'')||s?.independent_readback!==true||s?.source_type==='SYSTEM_CONFIG'||s?.source_type==='UNCLEAR'))return denied('SOURCE_PROVENANCE_OR_TYPE_REQUIRED');
 if((x.operation==='MERGE'||x.sources.length>1)&&x.explicit_merge_approval!==true)return denied('EXPLICIT_MERGE_APPROVAL_REQUIRED','WRITE_BLOCKED');
 if(x.output_language&&!['de','en'].includes(x.output_language))return denied('UNSUPPORTED_LANGUAGE');
 if(x.source_specific_mantra===true&&x.mantra_authorized!==true)return denied('SOURCE_SPECIFIC_MANTRA_SCOPE_REQUIRED','CONFLICT_QUARANTINE');
 return {status:'CLIC_RECONSTRUCTION_PLAN_CANDIDATE',request_id:x.request_id,profile_id:x.profile_id,profile_version:x.profile_version,operation:x.operation,source_count:ids.length,owner:'EXISTING_CLIC_RECONSTRUCTION_AND_PROVENANCE',actual_execution:false,write_authorized:false,host_accepted:false,executed:false};
}
