// IVI08 native ChatGPT presentation contract; a pure projection consumed by a GPT-native
// conversation host, NOT an executable host plugin. No network, writes, callbacks or secrets.
// Host interaction is supported only when the calling host binds controlled local selection.
import {prepareClicNativeChatView,selectClicNativeChatView} from "./interactive-visual-gpt-native-binding.mjs";
const str=x=>typeof x==="string"?x:"";
const safeDetails=d=>d&&typeof d==="object"?{id:str(d.id),label:str(d.label),origin:str(d.origin),evidence_class:str(d.evidence_class),evidence_refs:Array.isArray(d.evidence_refs)?d.evidence_refs.filter(x=>typeof x==="string"):[]}:null;
export function projectHostPresentation(prepared={}){
 const ui=prepared.ui??{};
 if(prepared.status!=="READY_FOR_HOST_RENDER"||ui.kind!=="CLIC_NATIVE_INTERACTIVE_EVIDENCE_V1")return {schema:"CLIC_GPT_NATIVE_PRESENTATION_CONTRACT_V1",status:"COMPACT_STATUS",items:[],selected_id:null,details:null,unknowns:["SNAPSHOT_NOT_VERIFIED"],controls:[],actions:[],host_execution_claim:false};
 const options=Array.isArray(ui.selector?.options)?ui.selector.options.filter(x=>typeof x?.value==="string"&&typeof x?.label==="string"&&x.value.length>0):[];
 const seen=new Set(),items=options.filter(x=>{if(seen.has(x.value))return false;seen.add(x.value);return true}).map(x=>({id:x.value,label:x.label}));
 const validSelected=items.some(x=>x.id===ui.selected_id);
 const details=validSelected&&ui.details?.id===ui.selected_id?safeDetails(ui.details):null;
 return {schema:"CLIC_GPT_NATIVE_PRESENTATION_CONTRACT_V1",status:"SOURCE_VIEW_READY",source_head:ui.source_head,view_type:ui.view_type,items,selected_id:details?ui.selected_id:null,details,unknowns:ui.unknowns??[],controls:items.length?[{type:items.length<=5?"segmented-control":"select",value:details?ui.selected_id:null,options:items.map(x=>({label:x.label,value:x.id})),controlled:true,local_only:true}]:[],actions:[],return_anchor:ui.return_anchor??null,host_execution_claim:false,host_render_pass:false,requires_native_host_state:true};
}
export async function prepareHostPresentation({connector,snapshot,selection}={}){
 const prepared=await prepareClicNativeChatView({connector,snapshot,selection});
 return {prepared,presentation:projectHostPresentation(prepared)};
}
export function changeHostPresentationSelection(prepared={},nodeId){
 const next=selectClicNativeChatView(prepared,nodeId);
 return {prepared:next,presentation:projectHostPresentation(next)};
}
// Full native host PASS is external evidence from an actually rendered view and interaction.
// Source tests and changing a presentation object must never set host_render_pass=true.
