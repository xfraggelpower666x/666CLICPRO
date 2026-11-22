// CLIC R10 TDH-derived advisory patterns. No I/O, no router, no persistence,
// no authority transfer; reuse existing PDI, continuity, SVI and recovery.
const SHA=/^[a-f0-9]{40}$/i;
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const pending=(reason,status='READBACK_PENDING')=>({status,reason,write_authorized:false,host_accepted:false});
const cli=x=>x?.owner==='666CLIC'&&SHA.test(x?.head??'');

export function assessScopedSubfacetPosition(x={}) {
  if(!cli(x))return pending('CLIC_NATIVE_HEAD_REQUIRED');
  if(!nonempty(x.facet)||!nonempty(x.scope)||!nonempty(x.return_anchor)||!nonempty(x.development_position))return pending('FACET_SCOPE_POSITION_ANCHOR_REQUIRED');
  if(!SHA.test(x.observed_head??'')||!SHA.test(x.position_head??''))return pending('INDEPENDENT_REVISION_READBACK_REQUIRED');
  if(x.head!==x.observed_head||x.position_head!==x.head||x.foreign_child_selected===true||x.cross_facet_resume===true)return pending('STALE_OR_CROSS_FACET_POSITION','CONFLICT_QUARANTINE');
  if(x.facet_registered!==true||x.independent_readback!==true)return pending('REGISTERED_FACET_AND_SOURCE_READBACK_REQUIRED');
  return {status:'SCOPED_DEVELOPMENT_POSITION_CANDIDATE',facet:x.facet,scope:x.scope,return_anchor:x.return_anchor,development_position:x.development_position,source_head:x.head,native_store:'EXISTING_PDI_AND_LIVECIRCLE',advisory:true,write_authorized:false,host_accepted:false};
}

export function assessEvidenceBoundMenu(x={}) {
  if(!cli(x)||!Array.isArray(x.actions)||!Array.isArray(x.current_allowed_actions))return pending('CURRENT_MENU_REGISTRY_REQUIRED');
  if(x.foreign_autoload===true||x.host_action_claim===true)return pending('FORBIDDEN_ROUTE_OR_HOST_CLAIM','CONFLICT_QUARANTINE');
  if(x.visual_compliance==='FULL'&&x.real_host_readback!==true)return pending('VISUAL_FULL_REQUIRES_REAL_HOST_EVIDENCE','CONFLICT_QUARANTINE');
  const allowed=new Set(x.current_allowed_actions.filter(nonempty));
  const items=x.actions.map(a=>({id:a?.id??null,command:a?.command??null,disposition:nonempty(a?.id)&&nonempty(a?.command)&&allowed.has(a.command)&&a.native_scope==='666CLIC'&&a.evidence_bound===true?'COPY_ONLY_OR_NATIVE_USER_INTENT':'BLOCKED_UNVERIFIED_OR_FOREIGN'}));
  return {status:'EVIDENCE_BOUND_MENU_PROJECTION',items,holds:Array.isArray(x.holds)?x.holds:[],unknowns:Array.isArray(x.unknowns)?x.unknowns:[],visual_compliance:x.visual_compliance??'UNKNOWN',no_fake_buttons:true,dispatch_performed:false,write_authorized:false,host_accepted:false};
}

export function assessRevisionBoundRecoveryInventory(x={}) {
  if(!cli(x)||!SHA.test(x.tree??'')||!SHA.test(x.pointer_blob??''))return pending('COMMIT_TREE_POINTER_BINDING_REQUIRED');
  if(x.backup_is_live===true||x.foreign_vault_included===true||x.auto_restore===true)return pending('RECOVERY_AUTHORITY_OR_VAULT_VIOLATION','CONFLICT_QUARANTINE');
  if(!Array.isArray(x.inventory)||x.inventory.length===0)return pending('TRACKED_FILE_INVENTORY_REQUIRED');
  const seen=new Set();
  for(const f of x.inventory){
    const p=f?.path;
    if(!nonempty(p)||p.startsWith('/')||p.split('/').includes('..')||!SHA.test(f?.git_blob??'')||seen.has(p))return pending('UNSAFE_OR_DUPLICATE_INVENTORY','CONFLICT_QUARANTINE');
    seen.add(p);
  }
  if(x.clean_checkout!==true||x.independent_tree_readback!==true||x.archive_sha256_verified!==true||x.archive_crc_verified!==true||x.restorable_artifact_readback!==true)return pending('FULL_RECOVERY_ARCHIVE_INTEGRITY_PENDING');
  return {status:'REVISIONSGEBUNDENE_RECOVERY_EVIDENCE_CANDIDATE',head:x.head,tree:x.tree,files_seen:seen.size,existing_owner:'CLIC_NATIVE_RECOVERY_GOVERNANCE',restore_executed:false,auto_restore:false,write_authorized:false,host_accepted:false};
}
