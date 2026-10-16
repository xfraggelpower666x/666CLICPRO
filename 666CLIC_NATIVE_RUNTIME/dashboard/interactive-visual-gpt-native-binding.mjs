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
