import test from "node:test";
import assert from "node:assert/strict";
import {bindVerifiedCoreLedger} from "./core-ledger-evidence-binding.mjs";
import {createPdiState} from "./parallel-development.mjs";
const h="a".repeat(40),nextHead="b".repeat(40),oldBlob="c".repeat(40),newBlob="d".repeat(40);
const state=()=>createPdiState([
 {id:"CORE_DEVELOPMENT",return_anchor:"RETURN_CORE",obligations:[{id:"O1",evidence_ref:"existing/1"}],interruptions:[{event_id:"old",evidence_ref:"prior"}]},
 {id:"VISUAL_INTELLIGENCE",return_anchor:"RETURN_VISUAL",status:"WAITING"},
 {id:"STARBRIDGE",return_anchor:"RETURN_SB05",status:"WAITING"},
 {id:"CODEFORGE_RECOVERY",return_anchor:"RETURN_BRIDGE",status:"WAITING"}]);
const evt={event_id:"E001",type:"START",source_revision:h,evidence_ref:"git/source",title:"Core native",tasks:[{id:"T1",status:"OPEN",evidence:["git/source"]}]};
function setup({cas=true,source=true,stale=false,headChanged=false,readback=true,origin=true}={}){
 let ledger={schema:"666CLIC_DEVELOPMENT_PROGRESS_V1",authority:"666CLIC_REPO_CURRENT",status:"INACTIVE",current_work:null},blob=oldBlob,head=headChanged?nextHead:h;
 const transport={
  readHead:async()=>head,
  readCurrent:async()=>({blob_sha:blob,version_locked:true,ledger}),
  verifyEventSource:async()=>({verified:source,source_revision:h,evidence_ref_verified:source}),
  compareAndSwap:async(_,expected,next)=>{if(stale||!cas||expected!==blob)return {cas_accepted:false};ledger=next;blob=newBlob;head=nextHead;return {cas_accepted:true,new_blob_sha:newBlob}},
  readBack:async()=>({blob_sha:readback?newBlob:oldBlob,ledger})};
 const proof={source_commit_verified:true,source_evidence_verified:true,base_head:h,expected_ledger_blob:oldBlob,
  verifyCasCommit:async()=>origin,same_lineage_verified:true};
 return {transport,proof};
}
test("readback-bound Core candidate preserves other streams, anchors and outstanding obligations",async()=>{
 const {transport,proof}=setup();
 const result=await bindVerifiedCoreLedger({event:evt,pdi_state:state(),transport,proof});
 assert.equal(result.status,"PDI_CANDIDATE_READBACK_BOUND");
 assert.equal(result.ledger_blob_sha,newBlob);
 assert.equal(result.presenter.status,"ACTIVE");assert.equal(result.progress.percent,0);
 assert.equal(result.development_position.streams[0].task_count,1);
 assert.equal(result.pdi_candidate.streams[0].tasks[0].id,"T1");
 assert.equal(result.development_position.streams[0].status,"ACTIVE");
 assert.equal(result.pdi_candidate.streams[0].return_anchor,"RETURN_CORE");
 assert.equal(result.pdi_candidate.streams[0].obligations.length,1);
 assert.equal(result.pdi_candidate.streams[0].interruptions.length,1);
 assert.equal(result.pdi_candidate.streams[1].status,"WAITING");
 assert.equal(result.pdi_committed,false);assert.equal(result.pointer_published,false);assert.equal(result.host_verified,false);
});
test("untrusted source and missing authenticated transport never mutate PDI",async()=>{
 let x=setup({source:false});
 assert.equal((await bindVerifiedCoreLedger({event:evt,pdi_state:state(),...x})).status,"WRITE_BLOCKED");
 assert.equal((await bindVerifiedCoreLedger({event:evt,pdi_state:state(),transport:{},proof:x.proof})).status,"WRITE_BLOCKED");
});
test("stale HEAD and CAS conflict quarantine",async()=>{
 let x=setup({headChanged:true});
 assert.equal((await bindVerifiedCoreLedger({event:evt,pdi_state:state(),...x})).status,"CONFLICT_QUARANTINE");
 x=setup({stale:true});
 assert.equal((await bindVerifiedCoreLedger({event:evt,pdi_state:state(),...x})).status,"CONFLICT_QUARANTINE");
});
test("bad blob readback and false commit lineage cannot yield PDI candidate",async()=>{
 let x=setup({readback:false});
 assert.equal((await bindVerifiedCoreLedger({event:evt,pdi_state:state(),...x})).status,"READBACK_PENDING");
 x=setup({origin:false});
 assert.equal((await bindVerifiedCoreLedger({event:evt,pdi_state:state(),...x})).status,"READBACK_PENDING");
});
test("duplicate PDI event is blocked before ledger CAS",async()=>{
 const p=state();p.processed_event_ids.push(evt.event_id);
 const x=setup();
 assert.equal((await bindVerifiedCoreLedger({event:evt,pdi_state:p,...x})).reason,"PDI_EVENT_REPLAY");
});
test("no arbitrary prewritten completion/foreign workstream promotion",async()=>{
 const x=setup();
 const event={...evt,source_revision:"z".repeat(40)};
 assert.equal((await bindVerifiedCoreLedger({event,pdi_state:state(),...x})).status,"WRITE_BLOCKED");
});

test("ledger cannot silently drop existing PDI Core task",async()=>{
 const p=state();p.streams[0].tasks.push({id:"OLDER_TASK",status:"OPEN",evidence_ref:"older/evidence"});
 const x=setup();const r=await bindVerifiedCoreLedger({event:evt,pdi_state:p,...x});
 assert.equal(r.status,"CONFLICT_QUARANTINE");
 assert.equal(r.reason,"CORE_TASK_SUPERSESSION_UNVERIFIED");
 assert.equal(r.pdi_committed,false);
});
