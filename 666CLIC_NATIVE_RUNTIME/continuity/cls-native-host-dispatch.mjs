// CLIC-owned native CLS dispatch preflight. GitHub Actions has GitHub GET only.
// This gate NEVER invokes CLS Docs without real authorized provider handles.
const REPO="xfraggelpower666x/666CLICPRO",BRANCH="clic-migration-rev79-staging";
const SOURCE="666CLIC_NATIVE_RUNTIME/outbox/666CLS/CLIC-STARBRIDGE-WHOLE-NET-666CLS-20261018-R01.json";
const SOURCE_BLOB="a075c30231fcdafd92d0968442c7a7c9c616fc6d";
const EXPORTED="inspectClsDocsFromHost";
const REQUIRED=["githubFetch","githubFetchFile","driveMetadata","driveRawFetch","driveRevisions","docsDocument","docsText"];
const SHA=/^[0-9a-f]{40}$/i;
const fail=reason=>({schema:"CLIC_CLS_NATIVE_DISPATCH_PREFLIGHT_V1",status:"HOST_BLOCKED",reason,
  source_verified:false,github_execution_verified:false,cls_export_invoked:false,
  delivery_verified:false,adoption_verified:false,host_verified:false,writes:0,cas_verified:false});
export function evaluateClsNativeInvocation({request={},execution={}}={}){
 if(request.repository!==REPO||request.branch!==BRANCH||request.export_name!==EXPORTED||
    request.mode!=="READ_ONLY"||request.allow_foreign_write!==false)
  return fail("EXACT_CLIC_CLS_SCOPE_REQUIRED");
 if(execution.runner_kind!=="AUTHORIZED_NATIVE_NODE_RUNTIME"||execution.github_live!==true||
    execution.module_blob_verified!==true||execution.github_tree_complete!==true||
    !SHA.test(execution.source_head??"")||execution.writes!==0)
  return fail("INDEPENDENT_GITHUB_EXECUTION_EVIDENCE_REQUIRED");
 if(!REQUIRED.every(k=>execution.available_handles?.includes(k))||
    execution.original_export_invoked!==true||execution.original_export_receipt!==true)
  return {...fail("AUTHORIZED_DRIVE_DOCS_HANDLES_AND_ORIGINAL_EXPORT_RECEIPT_REQUIRED"),
    source_verified:true,github_execution_verified:true,source_head:execution.source_head,
    source_blob:SOURCE_BLOB,required_handles:REQUIRED};
 // Even an actual read-only source intake is never delivery or fresh ChatGPT host acceptance.
 if(execution.output?.delivery_verified===true||execution.output?.adoption_verified===true||
    execution.output?.host_verified===true||execution.output?.status!=="NATIVE_DECISION_EVIDENCED_RECEIPT_PENDING")
  return fail("INVALID_OR_PROMOTED_CLS_SOURCE_RESULT");
 return {schema:"CLIC_CLS_NATIVE_DISPATCH_PREFLIGHT_V1",status:"NATIVE_SOURCE_EXECUTION_EVIDENCED_CHAT_FRESH_HOST_PENDING",
 source_verified:true,github_execution_verified:true,cls_export_invoked:true,
 delivery_verified:false,adoption_verified:false,host_verified:false,writes:0,cas_verified:false};
}
export function clsDispatchRequest(){return Object.freeze({
 repository:REPO,branch:BRANCH,export_name:EXPORTED,mode:"READ_ONLY",allow_foreign_write:false});}
export const CLS_SOURCE={repository:REPO,branch:BRANCH,path:SOURCE,blob:SOURCE_BLOB};
export const CLS_DISPATCH_HANDLES=Object.freeze(REQUIRED);
