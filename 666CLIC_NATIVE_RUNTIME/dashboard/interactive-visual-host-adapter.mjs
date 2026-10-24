// IVI-08 GPT-native view-model adapter. Client-only local selection, no UI host execution.
// The native host chooses its own supported controls; this never executes triggers.
import {prepareTrustedInteractiveVisual,selectTrustedVisualNode} from "./interactive-visual-evidence-gate.mjs";
import {projectInteractiveVisual} from "./verified-visual-presenter.mjs";
export function buildGptNativeInteractiveView(snapshot={},repositoryReadback={},selection={}){
 const prepared=prepareTrustedInteractiveVisual(snapshot,repositoryReadback,projectInteractiveVisual,selection);
 const view=prepared.view;
 const nodes=Array.isArray(view?.nodes)?view.nodes.map(n=>({id:n.id,label:typeof n.label==="string"?n.label:n.id,evidence_class:n.evidence_class,origin:n.origin,evidence_refs:n.evidence_refs})): [];
 const selectedId=view?.selected_node?.id??null;
 const selected=nodes.find(n=>n.id===selectedId)??null;
 const actions=prepared.status==="SOURCE_BOUND_VIEW_READY"?view.valid_actions.map(a=>({label:a.action,trigger:"666CLIC "+a.action.replaceAll("_"," "),requires_explicit_user_interaction:true,executed:false,evidence_ref:a.evidence_ref})):[];
 return {schema:"CLIC_GPT_NATIVE_INTERACTIVE_HOST_ADAPTER_V1",status:prepared.status,source_commit:prepared.verification.source_commit,view_type:view?.type??"COMPACT_STATUS",nodes,edges:view?.edges??[],selected_node:selected,details:selected?{label:selected.label,evidence_class:selected.evidence_class,origin:selected.origin,evidence_refs:selected.evidence_refs}:null,unknowns:view?.unknowns??[],decision_gates:view?.decision_gates??[],development_position:view?.development_position??null,handoff:view?.handoff??null,return_anchor:view?.return_anchor??null,actions,host_rendered:false,host_selection_tested:false,host_dispatch_verified:false,preparation:prepared};
}
export function updateLocalVisualSelection(model={},nodeId){
 const result=selectTrustedVisualNode(model.preparation,nodeId);
 const nodes=Array.isArray(model.nodes)?model.nodes:[];
 const item=result.status==="LOCAL_SELECTION_READY"?nodes.find(n=>n.id===nodeId):null;
 return {...model,selected_node:item??null,details:item?{label:item.label,evidence_class:item.evidence_class,origin:item.origin,evidence_refs:item.evidence_refs}:null,selection_status:result.status,host_selection_tested:false,host_rendered:false};
}
