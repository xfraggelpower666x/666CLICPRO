import test from "node:test";
import assert from "node:assert/strict";
import {createClicGithubCasTransport} from "../../dashboard/development_progress/github-cas-transport.mjs";
import {reconcilePdiLedger,PDI_LEDGER_PATH} from "./pdi-ledger-reconciliation.mjs";
import {createPdiState} from "./parallel-development.mjs";
import {CLIC_LEDGER_PATH} from "../../dashboard/development_progress/development-ledger-store.mjs";
const repo="xfraggelpower666x/666CLICPRO",branch="clic-migration-rev79-staging";
const H="a".repeat(40),N="b".repeat(40),O="c".repeat(40),P="d".repeat(40),B="e".repeat(40);
const event={event_id:"evt-1",type:"START",source_revision:H,evidence_ref:"git/event",title:"verified",tasks:[{id:"task",status:"OPEN",evidence:["git/evidence"]}]};
function native(){return createPdiState([{id:"CORE_DEVELOPMENT",return_anchor:"core"},{id:"VISUAL_INTELLIGENCE",return_anchor:"visual"},{id:"STARBRIDGE",return_anchor:"peer"},{id:"CODEFORGE_RECOVERY",return_anchor:"bridge"}])}
function fixture(){
 let head=H, ledger={schema:"666CLIC_DEVELOPMENT_PROGRESS_V1",authority:"666CLIC_REPO_CURRENT",status:"INACTIVE",current_work:null},
 ledgerBlob=O,pdi=native(),pdiBlob=P, changed=null, writeCount=0;
 const github={
  readBranch:async()=>({commit:{sha:head}}),
  fetchFile:async({path})=>path===CLIC_LEDGER_PATH?
   {sha:ledgerBlob,content:JSON.stringify(ledger)}:
   {sha:pdiBlob,content:JSON.stringify(pdi)},
  updateFile:async({path,sha,content})=>{
   if(path===CLIC_LEDGER_PATH){if(sha!==ledgerBlob)throw Error("stale ledger");ledger=JSON.parse(content);ledgerBlob=B;changed={from:head,to:N,blob:B,path};head=N}
   else {if(sha!==pdiBlob)throw Error("stale pdi");pdi=JSON.parse(content);pdiBlob=B;changed={from:head,to:O,blob:B,path};head=O}
   writeCount++;return {commit_sha:head,content_sha:B};
  },
  fetchCommit:async()=>({parents:[{sha:changed.from}]}),
  fetchTree:async()=>({truncated:false,tree:[{path:changed.path,sha:changed.blob}]}),
 };
 return {github,read:()=>({head,ledger,pdi,writeCount,ledgerBlob,pdiBlob})};
}
test("native CLIC scope and real connector methods are required",()=>{
 assert.throws(()=>createClicGithubCasTransport({repository:"foreign",branch,github:{},verifyEventSource:()=>true}),/CLIC_NATIVE/);
});
test("CAS transport enforces expected file SHA, commit ancestry and exact tree readback",async()=>{
 const f=fixture();
 const t=createClicGithubCasTransport({repository:repo,branch,github:f.github,verifyEventSource:async e=>({verified:true,source_revision:e.source_revision,evidence_ref_verified:true})});
 assert.equal(await t.readHead(),H);
 const old=await t.readCurrent(CLIC_LEDGER_PATH);assert.equal(old.blob_sha,O);
 const next={...old.ledger,status:"ACTIVE",source_revision:H,last_event_id:"evt-1",processed_event_ids:["evt-1"],tasks:event.tasks,current_work:"verified"};
 const c=await t.compareAndSwap(CLIC_LEDGER_PATH,O,next);
 assert.equal(c.cas_accepted,true);
 const back=await t.readBack(CLIC_LEDGER_PATH);
 assert.equal(back.blob_sha,B);
 assert.equal(await t.verifyLatestCasLineage({base_head:H,head:N,blob_sha:B}),true);
 assert.equal((await t.compareAndSwap(CLIC_LEDGER_PATH,O,next)).cas_accepted,false);
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
 assert.equal((await reconcilePdiLedger({...base,expected_pdi_blob:O,verifyOrigin:async()=>({verified:true,ledger_event_verified:true,lineage_verified:true,ledger_blob_sha:B})})).status,"CONFLICT_QUARANTINE");
 assert.equal((await reconcilePdiLedger({...base,pdi_candidate:native()})).status,"WRITE_BLOCKED");
 assert.equal(f.read().writeCount,0);
});
