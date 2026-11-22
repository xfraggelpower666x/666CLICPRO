// CLIC R13 LYVRA audit projections: read-only evidence; never assume peer authority.
// This module complements existing PDI, StarBridge, causal learning and SVI.
const SHA=/^[a-f0-9]{40}$/i;
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const pending=(reason,status='READBACK_PENDING')=>({status,reason,advisory:true,write_authorized:false,foreign_write_authorized:false,host_verified:false});
function scope(x){return x?.owner==='666CLIC'&&SHA.test(x?.clic_head??'')&&x.clic_head===x.observed_clic_head;}
function peer(x){return x?.peer_system==='LYVRA'&&x?.peer_repo==='xfraggelpower666x/LYVRA-Living-Yielding-Vibration-and-Resonance-Architecture'&&x.peer_branch==='lyvra'&&SHA.test(x?.peer_head??'')&&x.peer_head===x.observed_peer_head;}
// Text equality is a fact; a semantic deviation requires a scoped reviewer decision.
export function assessDualSurfaceSemanticDelta(x={}){
 if(!scope(x)||!peer(x))return pending('CURRENT_NATIVE_AND_PEER_HEAD_REQUIRED');
 if(x.foreign_autoactivation===true||x.auto_release===true)return pending('FOREIGN_AUTOEXECUTION_OR_RELEASE_FORBIDDEN','CONFLICT_QUARANTINE');
 if(!Array.isArray(x.skills)||x.skills.length===0||!nonempty(x.native_release)||!nonempty(x.alive_release))return pending('TWO_RELEASES_AND_SKILL_EVIDENCE_REQUIRED');
 if(x.skills.some(s=>!nonempty(s?.path)||!nonempty(s?.native_text)||!nonempty(s?.alive_text)))return pending('FULL_COMPARABLE_SKILL_TEXT_REQUIRED');
 if(new Set(x.skills.map(s=>s.path)).size!==x.skills.length)return pending('DUPLICATE_SKILL_ID','CONFLICT_QUARANTINE');
 const differences=x.skills.filter(s=>s.native_text!==s.alive_text).map(s=>({path:s.path,status:'TEXT_DIFFERENCE_REQUIRES_BEHAVIOR_REVIEW'}));
 return {status:differences.length?'SEMANTIC_REVIEW_CANDIDATE':'EXACT_TEXT_PARITY_OBSERVED',compared:x.skills.length,equal:x.skills.length-differences.length,differences,full_plugin_parity:false,host_parity:false,write_authorized:false,foreign_write_authorized:false,host_verified:false};
}
// An index HEAD may be old while all exact referenced blobs are still current.
export function assessPinnedPeerIndex(x={}){
 if(!scope(x)||!peer(x)||!SHA.test(x.index_head??'')||!Array.isArray(x.entries)||!x.entries.length)return pending('PINNED_PEER_INDEX_REQUIRED');
 if(x.history_promotion===true||x.auto_update_peer===true)return pending('FOREIGN_OR_HISTORY_PROMOTION_FORBIDDEN','CONFLICT_QUARANTINE');
 if(x.entries.some(e=>!nonempty(e?.path)||!SHA.test(e?.indexed_blob??'')||!SHA.test(e?.current_blob??'')||e?.independent_readback!==true))return pending('EACH_ENTRY_REQUIRES_INDEPENDENT_BLOB_READBACK');
 const mismatches=x.entries.filter(e=>e.indexed_blob!==e.current_blob).map(e=>e.path);
 return {status:mismatches.length?'INDEX_CONTENT_DELTA_REVIEW':'INDEX_BLOBS_VALID_METADATA_HEAD_OLDER',indexed_head:x.index_head,observed_peer_head:x.peer_head,head_equal:x.index_head===x.peer_head,matching_entries:x.entries.length-mismatches.length,total:x.entries.length,mismatches,semantic_drift_proven:false,write_authorized:false,foreign_write_authorized:false,host_verified:false};
}
// A native CI/skill readback is never fresh plugin-host execution or real provider audio.
export function assessSourceDeliveryAdoptionHost(x={}){
 if(!scope(x)||!peer(x)||!nonempty(x.capability)||!nonempty(x.evidence_class))return pending('SCOPED_CAPABILITY_EVIDENCE_REQUIRED');
 if(x.foreign_mutation===true||x.auto_host_claim===true)return pending('UNAUTHORIZED_FOREIGN_MUTATION_OR_HOST_CLAIM','CONFLICT_QUARANTINE');
 const verified=x.independent_source_readback===true;
 if(!verified)return pending('SOURCE_PROOF_REQUIRED');
 const receipt=x.independent_recipient_receipt===true&&SHA.test(x.recipient_receipt_blob??'');
 const adoption=receipt&&x.native_owner_adoption===true&&x.independent_adoption_readback===true;
 const host=adoption&&x.real_plugin_host_execution===true&&x.real_host_trace_readback===true;
 return {status:host?'EVIDENCE_GATED_HOST_CANDIDATE':adoption?'EVIDENCE_GATED_ADOPTION_CANDIDATE':receipt?'RECEIPT_OBSERVED_NOT_ADOPTED':'SOURCE_VERIFIED_DELIVERY_OPEN',capability:x.capability,source_verified:true,delivery_receipt_verified:receipt,adoption_verified:adoption,host_execution_evidence:host,real_audio_verified:false,write_authorized:false,foreign_write_authorized:false,host_verified:false};
}
