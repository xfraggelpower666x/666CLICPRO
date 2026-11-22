// CLIC-native read-only peer-learning adapter. No daemon, controller or foreign authority.
const sha40=/^[a-f0-9]{40}$/i;
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const block=(reason,status='READBACK_PENDING')=>({status,reason,advisory:true,write_authorized:false,host_accepted:false});
const current=x=>x?.owner==='666CLIC'&&sha40.test(x?.head??'')&&nonempty(x?.scope)&&nonempty(x?.return_anchor);
export function assessSharedGuidanceProjection(input={}) {
 if(!current(input))return block('CLIC_CURRENT_SCOPE_HEAD_AND_RETURN_ANCHOR_REQUIRED');
 if(input.foreign_autoload===true||input.decision_authority===true)return block('AUTHORITY_BOUNDARY_VIOLATION','CONFLICT_QUARANTINE');
 if(!nonempty(input.facet)||!nonempty(input.adapter_source))return block('EXISTING_CLIC_FACET_AND_ADAPTER_SOURCE_REQUIRED');
 if(input.verified_facet!==true||input.verified_adapter!==true)return block('FACET_AND_ADAPTER_READBACK_REQUIRED');
 return {status:'CLIC_SCOPED_GUIDANCE_CANDIDATE',owner:'666CLIC',head:input.head,scope:input.scope,facet:input.facet,adapter_source:input.adapter_source,return_anchor:input.return_anchor,shared_state_mutated:false,foreign_activation:false,advisory:true,write_authorized:false,host_accepted:false};
}
export function translateEvidenceToMeaning(input={}) {
 if(!current(input)||!nonempty(input.source_path)||!sha40.test(input.source_blob??''))return block('CLIC_NATIVE_VERIFIED_SOURCE_REQUIRED');
 if(input.direct_readback!==true)return block('INDEPENDENT_SOURCE_READBACK_REQUIRED');
 if(input.authority_transfer===true)return block('SEMANTIC_TRANSLATION_CANNOT_TRANSFER_AUTHORITY','CONFLICT_QUARANTINE');
 const relations=Array.isArray(input.relations)?input.relations.filter(nonempty):[];
 const counterrelations=Array.isArray(input.counterrelations)?input.counterrelations.filter(nonempty):[];
 return {status:'EVIDENCE_BOUND_SEMANTIC_PROJECTION',source:{owner:'666CLIC',head:input.head,path:input.source_path,blob:input.source_blob},meaning:nonempty(input.meaning)?input.meaning:null,relations,counterrelations,uncertainty:nonempty(input.uncertainty)?input.uncertainty:'UNASSESSED',application:nonempty(input.application)?input.application:null,return_anchor:input.return_anchor,learning_promoted:false,advisory:true,write_authorized:false,host_accepted:false};
}
export function assessPeerCardFreshness(input={}) {
 if(input.owner!=='666CLIC'||!nonempty(input.peer)||!nonempty(input.peer_repo)||!nonempty(input.peer_branch)||!sha40.test(input.observed_head??''))return block('EXACT_PEER_IDENTITY_AND_CURRENT_HEAD_REQUIRED');
 if(input.foreign_activation===true||input.authority_transfer===true)return block('FOREIGN_AUTHORITY_VIOLATION','CONFLICT_QUARANTINE');
 if(!sha40.test(input.card_head??'')||!nonempty(input.card_source_path)||!sha40.test(input.card_blob??''))return block('PINNED_CARD_PROVENANCE_REQUIRED');
 if(input.observed_head!==input.card_head)return {status:'STALE_CARD_REVALIDATION_REQUIRED',peer:input.peer,observed_head:input.observed_head,card_head:input.card_head,action:'READ_TARGET_NATIVE_CURRENT_AND_SUPERSESSION_BEFORE_CARD_UPDATE',write_authorized:false,host_accepted:false};
 if(input.independent_commit_tree_blob_readback!==true)return block('COMMIT_TREE_BLOB_READBACK_REQUIRED');
 return {status:'PEER_CARD_SOURCE_CURRENT_CANDIDATE',peer:input.peer,source_head:input.observed_head,card_blob:input.card_blob,verified_source_only:true,host_accepted:false,adoption_verified:false,write_authorized:false};
}
