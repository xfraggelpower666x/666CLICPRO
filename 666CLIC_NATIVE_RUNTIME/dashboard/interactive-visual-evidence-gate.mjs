// IVI-08 GitHub-native evidence boundary. Pure trusted-readback adapter.
// This module does not fetch, authenticate, render UI or mutate a repository.
// A caller must independently verify exact GitHub commit/tree/blob references.
const SHA=/^[0-9a-f]{40}$/i;
const SAFE_PATH=p=>typeof p==="string"&&p.length>0&&!p.startsWith("/")&&!p.includes("\\")&&!p.split("/").includes("..")&&!p.split("/").includes("")&&!p.includes("\0");
const same=(a,b)=>String(a??"").toLowerCase()===String(b??"").toLowerCase();
export const IVI08_REQUIRED_REPO="xfraggelpower666x/666CLICPRO";
export const IVI08_BRANCH="clic-migration-rev79-staging";
export function verifyInteractiveSnapshotEvidence(snapshot={},readback={}){
 const errors=[];
 const provenance=readback.provenance??{};
 const sha=snapshot.source_commit;
 if(!SHA.test(sha??""))errors.push("INVALID_SOURCE_COMMIT");
 if(provenance.repository!==IVI08_REQUIRED_REPO||provenance.branch!==IVI08_BRANCH)errors.push("WRONG_NATIVE_REPOSITORY_OR_BRANCH");
 if(!SHA.test(provenance.head??"")||!same(provenance.head,sha))errors.push("SOURCE_HEAD_MISMATCH");
 if(readback.independently_fetched!==true||readback.authenticated_connector_readback!==true)errors.push("INDEPENDENT_AUTHENTICATED_READBACK_REQUIRED");
 if(readback.pointer_verified!==true||readback.manifest_verified!==true||readback.head_verified!==true)errors.push("CURRENT_POINTER_MANIFEST_HEAD_GATE");
 const paths=snapshot.source_paths;
 if(!Array.isArray(paths)||paths.length===0||paths.some(p=>!SAFE_PATH(p))||new Set(paths).size!==paths.length)errors.push("UNSAFE_OR_MISSING_SOURCE_PATHS");
 const blobs=readback.blobs;
 if(!Array.isArray(blobs))errors.push("NO_BLOB_READBACKS");
 else if(Array.isArray(paths)){
  const byPath=new Map();
  for(const b of blobs){
   if(!SAFE_PATH(b?.path)||!SHA.test(b?.blob_sha??"")||!SHA.test(b?.tree_commit??"")||!same(b.tree_commit,sha)||b.readback_verified!==true||b.blob_matches_commit_tree!==true){errors.push("UNTRUSTED_BLOB_READBACK");continue;}
   if(byPath.has(b.path)){errors.push("DUPLICATE_BLOB_PATH");continue;}
   byPath.set(b.path,b);
  }
  for(const p of paths)if(!byPath.has(p))errors.push("SOURCE_BLOB_UNVERIFIED:"+p);
 }
 if(!readback.proof_origin||typeof readback.proof_origin!=="string"||!readback.proof_origin.trim())errors.push("MISSING_PROOF_ORIGIN");
 return Object.freeze({valid:errors.length===0,status:errors.length===0?"SNAPSHOT_READBACK_VERIFIED":"UNVERIFIED_SOURCE",errors,source_commit:errors.length===0?sha:null,may_mutate:false,host_verified:false});
}
export function prepareTrustedInteractiveVisual(snapshot={},readback={},projectVisual,selection={}){
 const verification=verifyInteractiveSnapshotEvidence(snapshot,readback);
 if(!verification.valid)return {status:"READBACK_BLOCKED",verification,view:{schema:"CLIC_GPT6_INTERACTIVE_VISUAL_V01_4",type:"COMPACT_STATUS",nodes:[],edges:[],selected_node:null,valid_actions:[],presentation_only:true,no_automatic_dispatch:true,source_verified:false,missing_evidence_reason:"INDEPENDENT_GITHUB_READBACK_NOT_VERIFIED"},host_pass:false};
 if(typeof projectVisual!=="function")return {status:"NO_NATIVE_PROJECTOR",verification,view:null,host_pass:false};
 const view=projectVisual(snapshot,selection);
 return {status:"SOURCE_BOUND_VIEW_READY",verification,view:{...view,source_verified:true,source_readback_gate:"SNAPSHOT_READBACK_VERIFIED",host_acceptance:false},host_pass:false};
}
export function selectTrustedVisualNode(prepared={},nodeId){
 if(prepared.status!=="SOURCE_BOUND_VIEW_READY"||prepared.verification?.valid!==true)return {status:"SELECTION_BLOCKED",selected_node:null,host_pass:false};
 const node=Array.isArray(prepared.view?.nodes)?prepared.view.nodes.find(n=>n.id===nodeId):null;
 return {status:node?"LOCAL_SELECTION_READY":"NO_MATCHING_NODE",selected_node:node??null,source_commit:prepared.verification.source_commit,host_pass:false,mutated:false};
}
