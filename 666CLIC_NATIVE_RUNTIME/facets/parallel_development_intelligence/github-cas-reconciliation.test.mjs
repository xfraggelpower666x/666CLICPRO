import test from "node:test";
import assert from "node:assert/strict";
import {createClicGithubCasTransport,verifyClicPdiEventOrigin} from "../../dashboard/development_progress/github-cas-transport.mjs";
import {reconcilePdiLedger,PDI_LEDGER_PATH} from "./pdi-ledger-reconciliation.mjs";
import {createPdiState} from "./parallel-development.mjs";
import {CLIC_LEDGER_PATH} from "../../dashboard/development_progress/development-ledger-store.mjs";
const repo="xfraggelpower666x/666CLICPRO",branch="clic-migration-rev79-staging";
const H="a".repeat(40),N="b".repeat(40),O="c".repeat(40),P="d".repeat(40),B="e".repeat(40);
const event={event_id:"evt-1",type:"START",source_revision:H,evidence_ref:"git/event",title:"verified",tasks:[{id:"task",status:"OPEN",evidence:["git/evidence"]}]};
function native(){return createPdiState([{id:"CORE_DEVELOPMENT",return_anchor:"core"},{id:"VISUAL_INTELLIGENCE",return_anchor:"visual"},{id:"STARBRIDGE",return_anchor:"peer"},{id:"CODEFORGE_RECOVERY",return_anchor:"bridge"}])}
function fixture(){
 const commitTrees=new Map();let head=H, ledger={schema:"666CLIC_DEVELOPMENT_PROGRESS_V1",authority:"666CLIC_REPO_CURRENT",status:"INACTIVE",current_work:null},
 ledgerBlob=O,pdi=native(),pdiBlob=P, changed=null, writeCount=0;
 const github={
  readBranch:async()=>({commit:{sha:head}}),
  fetchFile:async({path})=>path===CLIC_LEDGER_PATH?
   {sha:ledgerBlob,content:JSON.stringify(ledger)}:
   {sha:pdiBlob,content:JSON.stringify(pdi)},
  updateFile:async({path,sha,content})=>{
   if(path===CLIC_LEDGER_PATH){if(sha!==ledgerBlob)throw Error("stale ledger");ledger=JSON.parse(content);ledgerBlob=B;changed={from:head,to:N,blob:B,path};commitTrees.set(N,[{path,sha:B}]);head=N}
   else {if(sha!==pdiBlob)throw Error("stale pdi");pdi=JSON.parse(content);pdiBlob=B;changed={from:head,to:O,blob:B,path};commitTrees.set(O,[{path,sha:B}]);head=O}
   writeCount++;return {commit_sha:head,content_sha:B};
  },
  fetchCommit:async()=>({parents:[{sha:changed.from}]}),
  fetchTree:async({ref})=>({truncated:false,tree:commitTrees.get(ref)??[]}),
 };
 return {github,read:()=>({head,ledger,pdi,writeCount,ledgerBlob,pdiBlob})};
}
test("native CLIC scope and real connector methods are required",()=>{
 assert.throws(()=>createClicGithubCasTransport({repository:"foreign",branch,github:{},verifyEventSource:()=>true}),/CLIC_NATIVE/);
});
test("CAS source refuses to write without independent atomic branch authority",async()=>{
 const f=fixture();
 const t=createClicGithubCasTransport({repository:repo,branch,github:f.github,
  verifyEventSource:async e=>({verified:true,source_revision:e.source_revision,evidence_ref_verified:true})});
 assert.equal(await t.readHead(),H);
 const before=await t.readCurrent(CLIC_LEDGER_PATH);
 const result=await t.compareAndSwap(CLIC_LEDGER_PATH,before.blob_sha,{...before.ledger,status:"ACTIVE"});
 assert.equal(result.cas_accepted,false);
 assert.equal(result.reason,"ATOMIC_BRANCH_CAS_HOST_AUTHORITY_NOT_VERIFIED");
 assert.equal(f.read().writeCount,0);
});
test("reconciliation starts after ledger proof and never replays ledger event",async()=>{
 const f=fixture();const p=native();p.processed_event_ids.push("evt-1");p.streams[0].status="ACTIVE";p.streams[0].tasks=[{id:"task",status:"OPEN",evidence_ref:"git/evidence"}];
 // prepare immutable already-written CAS ledger in simulated host
 await f.github.updateFile({path:CLIC_LEDGER_PATH,sha:O,content:JSON.stringify({schema:"666CLIC_DEVELOPMENT_PROGRESS_V1",authority:"666CLIC_REPO_CURRENT",processed_event_ids:["evt-1"],last_event_id:"evt-1",status:"ACTIVE",tasks:event.tasks,source_revision:H})});
 const n=await reconcilePdiLedger({event_id:"evt-1",ledger_commit:N,ledger_blob:B,pdi_candidate:p,github:f.github,repository:repo,branch,expected_pdi_blob:P,verifyOrigin:async()=>({verified:true,ledger_event_verified:true,lineage_verified:true,ledger_blob_sha:B})});
 assert.equal(n.status,"PDI_READBACK_VERIFIED");assert.equal(n.pdi_persisted,true);assert.equal(f.read().writeCount,2);
 const again=await reconcilePdiLedger({event_id:"evt-1",ledger_commit:N,ledger_blob:B,pdi_candidate:p,github:f.github,repository:repo,branch,expected_pdi_blob:B,verifyOrigin:async()=>({verified:true,ledger_event_verified:true,lineage_verified:true,ledger_blob_sha:B})});
 assert.equal(again.status,"PDI_ALREADY_RECONCILED");assert.equal(f.read().writeCount,2);
});
test("PDI stage refuses forged lineage, concurrent file state and missing event without replay",async()=>{
 const f=fixture();const p=native();p.processed_event_ids.push("evt-1");
 const base={event_id:"evt-1",ledger_commit:N,ledger_blob:B,pdi_candidate:p,github:f.github,repository:repo,branch,expected_pdi_blob:P,verifyOrigin:async()=>({verified:false})};
 assert.equal((await reconcilePdiLedger(base)).status,"READBACK_PENDING");
 assert.equal((await reconcilePdiLedger({...base,expected_pdi_blob:O,verifyOrigin:async()=>({verified:true,ledger_event_verified:true,lineage_verified:true,ledger_blob_sha:B})})).status,"READBACK_PENDING");
 assert.equal((await reconcilePdiLedger({...base,pdi_candidate:native()})).status,"WRITE_BLOCKED");
 assert.equal(f.read().writeCount,0);
});

test("event origin requires independently matching commit, tree, file bytes and identity",async()=>{
 const {createHash}=await import("node:crypto");
 const payload="{\"event\":\"verified\"}\n";
 const b=Buffer.from(payload);
 const blob=createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
 const path="666CLIC_NATIVE_RUNTIME/current/VERIFIED_EVENT.json";
 const ev={source_revision:H,event_id:"event-unique-one",evidence_ref:path};
 const git={fetchCommit:async()=>({sha:H}),fetchTree:async()=>({truncated:false,tree:[{path,type:"blob",sha:blob}]}),
  fetchFile:async()=>({sha:blob,content:payload})};
 const good=await verifyClicPdiEventOrigin({event:ev,github:git});
 assert.equal(good.verified,true);assert.equal(good.event_write_authorized,false);
 assert.equal((await verifyClicPdiEventOrigin({event:ev,github:git,processed_event_ids:[ev.event_id]})).reason,"EVENT_REPLAY");
 assert.equal((await verifyClicPdiEventOrigin({event:ev,github:{...git,fetchCommit:async()=>({sha:N})}})).reason,"COMMIT_IDENTITY_NOT_INDEPENDENTLY_BOUND");
 assert.equal((await verifyClicPdiEventOrigin({event:ev,github:{...git,fetchTree:async()=>({truncated:false,tree:[{path,type:"blob",sha:O}]})}})).reason,"COMMIT_TREE_BLOB_CONTENT_MISMATCH");
 assert.equal((await verifyClicPdiEventOrigin({event:ev,github:{...git,fetchFile:async()=>({sha:blob,content:"tampered"})}})).reason,"COMMIT_TREE_BLOB_CONTENT_MISMATCH");
 assert.equal((await verifyClicPdiEventOrigin({event:{...ev,evidence_ref:"../foreign"},github:git})).reason,"EVENT_SCOPE_OR_IDENTITY_INVALID");
});
test("caller-controlled source booleans cannot promote source without repository readback",async()=>{
 const f=fixture();
 const t=createClicGithubCasTransport({repository:repo,branch,github:f.github,
  verifyEventSource:async e=>({verified:true,source_revision:e.source_revision,evidence_ref_verified:true})});
 const proof=await t.verifyEventSource(event);
 assert.equal(proof.verified,false);
 assert.equal(f.read().writeCount,0);
});
