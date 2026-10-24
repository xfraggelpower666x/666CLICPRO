// IVI08-A/B: minimal integration of trusted connector evidence and host-neutral GPT-native UI data.
// The actual ChatGPT renderer must consume the returned controls and wire a LOCAL selection state.
// No implied execution, no router, no dynamic host APIs, no foreign activation.
import {obtainTrustedClicSnapshot} from "./interactive-visual-github-connector.mjs";
import {buildGptNativeInteractiveView,updateLocalVisualSelection} from "./interactive-visual-host-adapter.mjs";
const safeString=s=>typeof s==="string"?s:"";
export async function prepareClicNativeChatView({connector,snapshot,selection}={}){
 if(!connector||!snapshot)return blocked("MISSING_CONNECTOR_OR_SNAPSHOT");
 const source=await obtainTrustedClicSnapshot(connector,snapshot);
 if(source.verified!==true)return blocked(source.status,source);
 const model=buildGptNativeInteractiveView(snapshot,source.readback,selection??{});
 if(model.status!=="SOURCE_BOUND_VIEW_READY")return blocked("VIEW_MODEL_REJECTED",source);
 return {status:"READY_FOR_HOST_RENDER",source_status:source.status,source_head:source.head,ui:toNativeUiModel(model),model,host_render_verified:false,host_selection_verified:false,plugin_host_dispatch_verified:false,foreign_mutation:false};
}
const blocked=(why,source=null)=>({status:"SAFE_FALLBACK",reason:why,source_status:source?.status??null,ui:{kind:"CLIC_NATIVE_STATUS",title:"CLIC · Evidenz fehlt",selected_id:null,options:[],details:null,unknowns:["GitHub-Snapshot nicht unabhängig verifiziert"],actions:[]},host_render_verified:false,host_selection_verified:false,plugin_host_dispatch_verified:false,foreign_mutation:false});
export function toNativeUiModel(model={}){
 if(model.status!=="SOURCE_BOUND_VIEW_READY")return blocked("UNVERIFIED_VIEW").ui;
 const nodes=Array.isArray(model.nodes)?model.nodes:[];
 const selected=nodes.find(x=>x.id===model.selected_node?.id)??null;
 return {kind:"CLIC_NATIVE_INTERACTIVE_EVIDENCE_V1",title:"666CLIC · Interactive Visual Intelligence",source_head:safeString(model.source_commit),view_type:model.view_type??"COMPACT_STATUS",selector:{component:"segmented-control",label:"Evidenzknoten",value:selected?.id??null,options:nodes.map(n=>({value:n.id,label:n.label}))},selected_id:selected?.id??null,details:selected?{id:selected.id,label:selected.label,origin:selected.origin,evidence_class:selected.evidence_class,evidence_refs:[...selected.evidence_refs]}:null,edges:Array.isArray(model.edges)?model.edges:[],unknowns:Array.isArray(model.unknowns)?model.unknowns:[],handoff:model.handoff??null,return_anchor:model.return_anchor??null,actions:Array.isArray(model.actions)?model.actions.map(a=>({label:a.label,proposed_direct_trigger:a.trigger,requires_direct_user_interaction:true,executed:false})):[],presentation_only:true};
}
export function selectClicNativeChatView(prepared={},selectedId){
 if(prepared.status!=="READY_FOR_HOST_RENDER")return blocked("UNVERIFIED_VIEW");
 const model=updateLocalVisualSelection(prepared.model,selectedId);
 return {...prepared,model,ui:toNativeUiModel(model),host_selection_verified:false,host_render_verified:false,plugin_host_dispatch_verified:false};
}


// Pure custom-input interruption/continuation protocol. Local view-state only:
// no host automation, no foreground takeover, no loss of parallel obligations.
export function prepareClicCustomInputContinuation({previous,input,decision}={}){
 const hold=reason=>({schema:"CLIC_CUSTOM_INPUT_CONTINUITY_V1",status:"CONTINUITY_HOLD",reason,
  host_verified:false,foreign_mutation:false,pointer_published:false,automatic_dispatch:false});
 const own=x=>x&&typeof x==="object"&&!Array.isArray(x);
 const valid=s=>typeof s==="string"&&s.trim().length>0;
 if(!own(previous)||previous.system_id!=="666CLIC"||!valid(previous.return_anchor)||
  !Array.isArray(previous.streams)||!Array.isArray(previous.obligations)||
  !own(previous.visual)||!valid(previous.visual.return_anchor)||
  !valid(previous.source_head)||!/^[a-f0-9]{40}$/i.test(previous.source_head))
  return hold("VERIFIED_PREVIOUS_CONTINUITY_REQUIRED");
 if(!own(input)||!valid(input.text)||!["QUESTION","INFORMATION","CORRECTION","NEW_TASK","EXPLICIT_REDIRECT"].includes(input.kind))
  return hold("INPUT_CLASSIFICATION_REQUIRED");
 if(input.kind==="EXPLICIT_REDIRECT"&&(!own(decision)||decision.explicit_user_redirect!==true||
  !valid(decision.new_return_anchor)))return hold("EXPLICIT_REDIRECT_AUTHORITY_REQUIRED");
 const stable=structuredClone(previous);
 const redirect=input.kind==="EXPLICIT_REDIRECT";
 // Redirect is an explicit user decision; carry old lineage as an interruption,
 // not as an erased stream. Other input kinds always resume the old anchor.
 return {schema:"CLIC_CUSTOM_INPUT_CONTINUITY_V1",status:redirect?"EXPLICIT_REDIRECT_CARRIED":"INGEST_THEN_RESUME",
  source_head:previous.source_head,classification:input.kind,
  resume_anchor:redirect?decision.new_return_anchor:previous.return_anchor,
  prior_anchor:previous.return_anchor,visual_return_anchor:previous.visual.return_anchor,
  visual_selection:stable.visual.selection??null,visual_foreground:stable.visual.foreground===true,
  preserved_streams:stable.streams,preserved_obligations:stable.obligations,
  interrupted_lineage:redirect?{return_anchor:previous.return_anchor,reason:"EXPLICIT_USER_REDIRECT"}:null,
  relevant_effects:"REVALIDATE_CAUSALLY_RELATED_CHANGES_BEFORE_RESUME",
  visible_junior:true,pet:"PAUSED",authoritative_write:false,
  host_verified:false,foreign_mutation:false,pointer_published:false,automatic_dispatch:false};
}
