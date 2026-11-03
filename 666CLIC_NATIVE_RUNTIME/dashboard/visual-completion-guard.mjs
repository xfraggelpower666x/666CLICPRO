// CLIC-native post-rehydration menu guard; existing presenter extension, not a visual engine.
// An evidence-complete REHYDRATION is distinct from process-round closure and fresh-host PASS.
const SHA=/^[a-f0-9]{40}$/i;
export const CLIC_FIVE_CHOICES=Object.freeze([
 {id:"WHOLE_CLIC",label:"Whole CLIC"},
 {id:"INTEGRATION_AUDIT",label:"Integration Audit"},
 {id:"SYSTEM_CARDS",label:"System Cards"},
 {id:"VISUAL_INTELLIGENCE",label:"Visual Intelligence"},
 {id:"DEVELOPMENT",label:"Bearbeiten & Weiterentwickeln"}
]);
const blocked=(reason,anchor=null)=>({schema:"CLIC_NATIVE_VISUAL_COMPLETION_V1",status:"BLOCKED",reason,rehydration_complete:false,options:[],development_topics:[],return_anchor:anchor,write_authority:false,host_pass:false,plugin_parity:false,auto_activation:false});
const good=x=>typeof x==="string"&&x.trim().length>0;
export function completeClicVisualRehydration({current,facets,work,development_topics=[]}={}){
 const anchor=good(work?.return_anchor)?work.return_anchor:null;
 if(!current||!SHA.test(current.head??"")||!SHA.test(current.pointer_blob??"")||
 !SHA.test(current.manifest_blob??"")||current.head_readback_verified!==true||
 current.pointer_readback_verified!==true||current.manifest_readback_verified!==true||
 current.pointer_matches_head!==true||current.manifest_required_order_verified!==true)
  return blocked("WHOLE_CURRENT_POINTER_MANIFEST_NOT_VERIFIED",anchor);
 if(current.conflict_verified===true||current.superseded===true)return blocked("CURRENT_CONFLICT_OR_SUPERSESSION",anchor);
 if(!facets||facets.registered_rehydrated_reachable!==true||facets.foreign_autoactivation===true||
 facets.global_facets_foreground===true||facets.visual_facet_ready!==true)
  return blocked("RECURSIVE_FACET_BOUNDARY_UNVERIFIED",anchor);
 if(!work||work.interruptions_preserved!==true||work.obligations_preserved!==true||
 work.return_anchor_verified!==true||!anchor||work.pet_paused!==true||work.junior_preserved!==true)
  return blocked("WORK_CONTINUITY_OR_PET_JUNIOR_GUARD",anchor);
 if(!Array.isArray(development_topics))return blocked("DEVELOPMENT_TOPICS_INVALID",anchor);
 const ids=new Set(),topics=[];
 for(const t of development_topics){
  if(!t||!good(t.id)||ids.has(t.id)||!good(t.label)||!good(t.source_ref)||
    !SHA.test(t.source_head??"")||!["OPEN","WAITING","BLOCKED"].includes(t.status)||
    t.readback_verified!==true||t.native_scope!=="666CLIC")
    return blocked("UNVERIFIED_OR_DUPLICATE_DEVELOPMENT_TOPIC",anchor);
  ids.add(t.id);
  topics.push({id:t.id,label:t.label,status:t.status,source_ref:t.source_ref,source_head:t.source_head,blocker:good(t.blocker)?t.blocker:null});
 }
 return {schema:"CLIC_NATIVE_VISUAL_COMPLETION_V1",status:"SOURCE_MENU_READY",
  rehydration_complete:true,process_round_closed:true,evidence_complete:false,
  options:CLIC_FIVE_CHOICES.map(x=>({...x})),development_topics:topics,
  fifth_choice_read_only:true,source_head:current.head,return_anchor:anchor,
  write_authority:false,host_pass:false,plugin_parity:false,auto_activation:false,
  no_fabricated_progress:true,unknown_topics_hidden:true};
}
export function selectClicVisualCompletion(menu,choice,topicId=null){
 if(menu?.status!=="SOURCE_MENU_READY"||menu.rehydration_complete!==true)
  return {status:"BLOCKED",reason:"MENU_NOT_VERIFIED",write_authority:false};
 const item=CLIC_FIVE_CHOICES.find(x=>x.id===choice);
 if(!item)return {status:"BLOCKED",reason:"INVALID_USER_SELECTION",write_authority:false};
 if(choice==="DEVELOPMENT"){
  if(topicId===null)return {status:"READ_ONLY_TOPIC_MENU",topics:menu.development_topics,write_authority:false,auto_update:false};
  const topic=menu.development_topics.find(x=>x.id===topicId);
  if(!topic)return {status:"BLOCKED",reason:"TOPIC_NOT_VERIFIED",write_authority:false};
  return {status:"SELECTED_VERIFIED_TOPIC",topic,requires_direct_native_update:true,write_authority:false,auto_update:false};
 }
 return {status:"USER_SELECTED",choice:item.id,label:item.label,return_anchor:menu.return_anchor,
  write_authority:false,auto_activation:false,host_pass:false};
}
