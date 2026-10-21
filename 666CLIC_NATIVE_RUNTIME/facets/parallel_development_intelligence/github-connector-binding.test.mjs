import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {bindClicNativeGithubTools,bindClicReadOnlyHostTools,verifyClicPdiHostReadiness,inspectClicBoundHostReadbacks,evaluateClicNativeHostDispatchAcceptance} from "../../dashboard/development_progress/github-connector-binding.mjs";
const OWNER="xfraggelpower666x/666CLICPRO",branch="clic-migration-rev79-staging",h="a".repeat(40);
const fixedText='{"schema":"test"}';
const digest=s=>{const b=Buffer.from(s);return createHash("sha1").update(Buffer.concat([Buffer.from("blob "+b.length),Buffer.from([0])])).update(b).digest("hex")};
const fixedBlob=digest(fixedText);
const deps={fetch:async({url})=>({result:{content:JSON.stringify(url.includes("/branches/")?{commit:{sha:h}}:url.includes("/trees/")?{truncated:false,tree:[]}: {sha:h,parents:[{sha:h}]})}}),
 fetch_file:async()=>({result:{sha:h,content:'{"schema":"test"}'}}),
 update_file:async()=>({result:{commit_sha:h,content_sha:h}})};
test("actual connector tool-shaped binding allows narrow CLIC read and declared CAS path only",async()=>{
 const github=bindClicNativeGithubTools(deps);
 assert.equal((await github.readBranch({repository:OWNER,branch})).commit.sha,h);
 assert.equal((await github.fetchFile({repository:OWNER,path:"666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json",ref:branch})).sha,h);
 assert.equal((await github.updateFile({repository:OWNER,branch,path:"666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json",sha:h,content:"{}",message:"test"})).commit_sha,h);
});
test("foreign repos, nonledger writes, and forged expected SHA forbidden",async()=>{
 const github=bindClicNativeGithubTools(deps);
 await assert.rejects(()=>github.readBranch({repository:"foreign/repo",branch}),/CLIC_ONLY_SCOPE/);
 await assert.rejects(()=>github.updateFile({repository:OWNER,branch,path:"666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json",sha:h,content:"{}"}),/ALLOWLIST/);
 await assert.rejects(()=>github.updateFile({repository:OWNER,branch,path:"666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json",sha:"no",content:"{}"}),/EXACT_FILE/);
});

test("read-only host preflight verifies both persisted ledger blobs and unchanged head",async()=>{
 const paths=["666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json",
  "666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json"];
 let writes=0,heads=0;
 const github={readBranch:async()=>{heads++;return {commit:{sha:h}}},fetchTree:async()=>({truncated:false,tree:paths.map(path=>({path,sha:fixedBlob}))}),
  fetchFile:async()=>({sha:fixedBlob,content:fixedText}),updateFile:async()=>{writes++;throw Error("NO_WRITE")}};
 const x=await verifyClicPdiHostReadiness({github});
 assert.equal(x.status,"READ_ONLY_LEDGER_READBACK_VERIFIED");
 assert.equal(x.ledger_blobs.length,2);assert.equal(x.host_persistence_verified,false);
 assert.equal(x.host_dispatch_verified,false);assert.equal(x.writes,0);assert.equal(writes,0);assert.equal(heads,2);
});
test("read-only host preflight fails closed on tampered tree, racing head and foreign scope",async()=>{
 const paths=["666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json",
  "666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json"];
 let calls=0;
 const github={readBranch:async()=>({commit:{sha:++calls===1?h:"b".repeat(40)}}),
  fetchTree:async()=>({truncated:false,tree:paths.map(path=>({path,sha:fixedBlob}))}),
  fetchFile:async()=>({sha:fixedBlob,content:fixedText})};
 assert.equal((await verifyClicPdiHostReadiness({github})).reason,"CONCURRENT_HEAD_CHANGE");
 assert.equal((await verifyClicPdiHostReadiness({github,repository:"foreign/repo"})).status,"READBACK_PENDING");
 const altered={...github,readBranch:async()=>({commit:{sha:h}}),fetchTree:async()=>({truncated:false,tree:[]})};
 assert.match((await verifyClicPdiHostReadiness({github:altered})).reason,/LEDGER_TREE_BLOB_MISMATCH/);
});

test("native read-only host tool binding accepts real connector-shaped source and forbids all writes",async()=>{
 
 const blob=digest;
 const paths=["666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json",
  "666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json"];
 const files=Object.fromEntries(paths.map(path=>[path,JSON.stringify({schema:"live-fixture",path})]));
 const sha=Object.fromEntries(paths.map(path=>[path,blob(files[path])]));
 let calls=0;
 const fetch=async({url})=>{calls++;return {result:{content:JSON.stringify(url.includes("/branches/")?
  {commit:{sha:h}}:{truncated:false,tree:paths.map(path=>({path,type:"blob",sha:sha[path]}))})}}};
 const fetch_file=async({repository_full_name,path,ref})=>{
  assert.equal(repository_full_name,OWNER);assert.equal(ref,h);
  return {result:{content:files[path],sha:sha[path]}}};
 const binding=bindClicReadOnlyHostTools({fetch,fetch_file});
 assert.equal(binding.write_capability,false);
 assert.equal(binding.github.updateFile,undefined);
 const result=await verifyClicPdiHostReadiness({github:binding.github});
 assert.equal(result.status,"READ_ONLY_LEDGER_READBACK_VERIFIED");
 assert.equal(result.host_persistence_verified,false);
 assert.ok(calls>=3);
 await assert.rejects(()=>binding.fetch({url:"https://api.github.com/repos/foreign/repo/branches/main"}),/NOT_ALLOWLISTED/);
 await assert.rejects(()=>binding.fetchFile({repository_full_name:OWNER,path:"666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json",ref:h}),/DENIED/);
 await assert.rejects(()=>binding.github.fetchFile({repository:OWNER,path:"666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json",ref:h}),/SCOPE_ONLY/);
});
test("read-only host orchestrator does not fabricate PDI event-CAS or SB05 delivery",async()=>{
 const called=[];
 const fetch=async({url})=>{called.push(url);return {result:{content:JSON.stringify({commit:{sha:h}})}}};
 const fetch_file=async()=>{throw Error("SOURCE_NOT_AVAILABLE")};
 const result=await inspectClicBoundHostReadbacks({fetch,fetch_file});
 assert.equal(result.status,"READBACK_PENDING");
 assert.equal(result.event_cas_verified,false);
 assert.equal(result.delivery_verified,false);
 assert.equal(result.host_accepted,false);
 assert.equal(result.writes,0);
 assert.ok(called.length>0);
});

test("native module dispatch acceptance is narrow and never grants chat host or event CAS",()=>{
 const head="a".repeat(40),blob="b".repeat(40);
 const request={facet:"PDI_READONLY",export_name:"verifyClicPdiHostReadiness",
  repository:OWNER,branch,mode:"READ_ONLY",allow_foreign_write:false,allow_event_write:false,expected_head:head};
 const output={status:"READ_ONLY_LEDGER_READBACK_VERIFIED",writes:0,host_dispatch_verified:false};
 const execution={runner_kind:"AUTHORIZED_NATIVE_NODE_RUNTIME",connector_injected:true,
  module_loaded_from_verified_head:true,module_git_blob_verified:true,
  export_invoked:true,real_run_receipt:true,source_head:head,module_blob:blob,writes:0,output};
 const r=evaluateClicNativeHostDispatchAcceptance({request,execution});
 assert.equal(r.status,"NATIVE_MODULE_EXECUTION_EVIDENCED_NOT_CHAT_FRESH_HOST");
 assert.equal(r.module_executed,true);assert.equal(r.fresh_host_verified,false);
 assert.equal(r.event_cas_verified,false);assert.equal(r.delivery_verified,false);
 assert.equal(r.writes,0);
 assert.equal(evaluateClicNativeHostDispatchAcceptance({request,execution:{...execution,real_run_receipt:false}}).status,"HOST_DISPATCH_PENDING");
 assert.equal(evaluateClicNativeHostDispatchAcceptance({request:{...request,export_name:"updateFile"},execution}).status,"HOST_DISPATCH_PENDING");
 assert.equal(evaluateClicNativeHostDispatchAcceptance({request:{...request,allow_event_write:true},execution}).status,"HOST_DISPATCH_PENDING");
 assert.equal(evaluateClicNativeHostDispatchAcceptance({request,execution:{...execution,output:{...output,event_cas_verified:true}}}).status,"HOST_DISPATCH_PENDING");
 assert.equal(evaluateClicNativeHostDispatchAcceptance({request,execution:{...execution,writes:1}}).status,"HOST_DISPATCH_PENDING");
});
test("SB05 dispatch can attest native module invocation only with receipt and no delivery promotion",()=>{
 const head="a".repeat(40),blob="b".repeat(40);
 const request={facet:"SB05_READONLY",export_name:"inspectPfsSb05NativeReceipts",
  repository:OWNER,branch,mode:"READ_ONLY",allow_foreign_write:false,allow_event_write:false,expected_head:head};
 const output={status:"NATIVE_SB05_READBACK_EVIDENCED_DELIVERY_PENDING",
  native_receipts_verified:true,delivery_verified:false,adoption_verified:false,host_verified:false,writes:0};
 const execution={runner_kind:"AUTHORIZED_NATIVE_NODE_RUNTIME",connector_injected:true,
  module_loaded_from_verified_head:true,module_git_blob_verified:true,export_invoked:true,
  real_run_receipt:true,source_head:head,module_blob:blob,writes:0,output};
 assert.equal(evaluateClicNativeHostDispatchAcceptance({request,execution}).status,"NATIVE_MODULE_EXECUTION_EVIDENCED_NOT_CHAT_FRESH_HOST");
 assert.equal(evaluateClicNativeHostDispatchAcceptance({request,execution:{...execution,output:{...output,delivery_verified:true}}}).status,"HOST_DISPATCH_PENDING");
 assert.equal(evaluateClicNativeHostDispatchAcceptance({request,execution:{...execution,output:{...output,native_receipts_verified:false}}}).status,"HOST_DISPATCH_PENDING");
 assert.equal(evaluateClicNativeHostDispatchAcceptance({request,execution:{...execution,source_head:"c".repeat(40)}}).status,"HOST_DISPATCH_PENDING");
});

import {inspectClicPdiEventIngressBoundary as inspectPdiIngress} from "../../dashboard/development_progress/github-connector-binding.mjs";
const entry=()=>{
 const event={type:"START",event_id:"clic-event-20261021",source_revision:h,evidence_ref:"666CLIC_NATIVE_RUNTIME/current/CURRENT_STATE.md"};
 return {request:{repository:OWNER,branch,operation:"PDI_EVENT_SOURCE_PREFLIGHT",mode:"SOURCE_ONLY",allow_event_write:false,allow_foreign_write:false,allow_pointer_write:false},
  event,source:{repository:OWNER,commit:h,evidence_blob_sha:"b".repeat(40),evidence_path:event.evidence_ref},
  ledger:{base_head:h,observed_head:h,expected_blob:"c".repeat(40),observed_blob:"c".repeat(40),processed_event_ids:[]}};
};
test("PDI event ingress source gate never grants an actual write or host pass",()=>{
 const x=inspectPdiIngress(entry());
 assert.equal(x.status,"SOURCE_ONLY_CANDIDATE_HOST_AUTHORIZATION_PENDING");
 assert.equal(x.event_write_authorized,false);assert.equal(x.ledger_persisted,false);
 assert.equal(x.pdi_persisted,false);assert.equal(x.host_verified,false);
 assert.equal(x.required_export,"bindVerifiedCoreLedger");
});
test("PDI source gate rejects foreign repository and attempted write promotion",()=>{
 const x=entry();x.request.repository="foreign/repo";
 assert.equal(inspectPdiIngress(x).reason,"SOURCE_ONLY_CLIC_SCOPE_REQUIRED");
 const y=entry();y.request.allow_event_write=true;
 assert.equal(inspectPdiIngress(y).reason,"SOURCE_ONLY_CLIC_SCOPE_REQUIRED");
});
test("PDI source gate rejects forged event origin and cross-commit evidence",()=>{
 const x=entry();x.source.commit="d".repeat(40);
 assert.equal(inspectPdiIngress(x).reason,"SOURCE_COMMIT_BLOB_PATH_BINDING_MISMATCH");
 const y=entry();y.event.evidence_ref="";
 assert.equal(inspectPdiIngress(y).reason,"EVENT_IDENTITY_OR_PROVENANCE_MISSING");
});
test("PDI source gate rejects stale head or blob without rebase",()=>{
 const x=entry();x.ledger.observed_head="d".repeat(40);
 assert.equal(inspectPdiIngress(x).reason,"BRANCH_OR_BLOB_VERSION_CONFLICT");
 const y=entry();y.ledger.observed_blob="d".repeat(40);
 assert.equal(inspectPdiIngress(y).reason,"BRANCH_OR_BLOB_VERSION_CONFLICT");
});
test("PDI source gate prevents same event replay",()=>{
 const x=entry();x.ledger.processed_event_ids=[x.event.event_id];
 assert.equal(inspectPdiIngress(x).reason,"EVENT_REPLAY");
});
test("PDI ledger-only recovery requires first-stage receipt and never repeats event",()=>{
 const x=entry();x.stage="LEDGER_COMMITTED_PDI_PENDING";x.ledger.processed_event_ids=[x.event.event_id];
 assert.equal(inspectPdiIngress(x).reason,"RECONCILIATION_ORIGINAL_LEDGER_RECEIPT_REQUIRED");
 x.ledger.ledger_commit="d".repeat(40);x.ledger.ledger_blob="e".repeat(40);
 const o=inspectPdiIngress(x);
 assert.equal(o.status,"SOURCE_ONLY_RECONCILE_WITHOUT_REPLAY_PENDING");
 assert.equal(o.repeat_event_write,false);assert.equal(o.pdi_persisted,false);
});
test("PDI source gate fails closed on unsupported recovery stages",()=>{
 const x=entry();x.stage="PRETEND_SUCCESS";
 assert.equal(inspectPdiIngress(x).reason,"UNSUPPORTED_RECOVERY_STAGE");
});
