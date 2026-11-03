import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createPdiState,applyPdiEvent,developmentPosition} from "./parallel-development.mjs";
const h="a".repeat(40), k="b".repeat(40);
const initial=()=>createPdiState([
 {id:"CORE_DEVELOPMENT",return_anchor:"CORE_WORK",tasks:[{id:"TASK1",status:"OPEN",evidence_ref:"source/1"}]},
 {id:"VISUAL_INTELLIGENCE",return_anchor:"VISUAL_HOST"},
 {id:"STARBRIDGE",return_anchor:"SB05_RECEIPT",status:"WAITING"},
 {id:"CODEFORGE_RECOVERY",return_anchor:"BRIDGE_BINARY",status:"WAITING"}]);
const ev=(id,action,stream_id="CORE_DEVELOPMENT")=>({event_id:id,action,stream_id,source_head:h,evidence_ref:"source/commit/"+id});
test("four independent native workstreams and no auto pointer/dispatch",()=>{
 const state=initial(),pos=developmentPosition(state);
 assert.equal(pos.streams.length,4);assert.equal(pos.may_write_pointer,false);assert.equal(pos.auto_dispatch,false);
});
test("pause preserves other streams, obligations and return anchor",()=>{
 const a=initial();const n=applyPdiEvent(a,{...ev("1","PAUSE"),obligation:{id:"O1",evidence_ref:"proof/1"},return_anchor:"RESUME_CORE"},{independent_source_readback:true});
 assert.equal(a.streams[0].status,"READY");assert.equal(n.streams[0].status,"PAUSED");assert.equal(n.streams[0].return_anchor,"RESUME_CORE");
 assert.equal(n.streams[0].interruptions.length,1);assert.equal(n.streams[0].obligations.length,1);
 assert.equal(n.streams[2].status,"WAITING");
});
test("unverified, duplicated, foreign, arbitrary status and silent supersession denied",()=>{
 const a=initial(),x=ev("1","ACTIVATE");
 assert.throws(()=>applyPdiEvent(a,x,{}),/UNVERIFIED/);
 assert.throws(()=>applyPdiEvent(a,{...x,stream_id:"LYVRA"},{independent_source_readback:true}),/UNVERIFIED/);
 const n=applyPdiEvent(a,x,{independent_source_readback:true});
 assert.throws(()=>applyPdiEvent(n,x,{independent_source_readback:true}),/DUPLICATE/);
 assert.throws(()=>applyPdiEvent(n,{...ev("2","READY"),source_head:k},{independent_source_readback:true}),/SUPERSESSION/);
 assert.throws(()=>applyPdiEvent(a,{...x,dependencies:[{from:"x",to:"y"}]},{independent_source_readback:true}),/DEPENDENCY/);
});
test("complete requires independent completion readback and verified task states",()=>{
 const a=initial();assert.throws(()=>applyPdiEvent(a,ev("1","COMPLETE"),{independent_source_readback:true,completion_readback:true}),/UNVERIFIED_COMPLETION/);
 const b=createPdiState([{id:"CORE_DEVELOPMENT",return_anchor:"A",tasks:[{id:"T",status:"DONE",completion_verified:true,evidence_ref:"proof"}]},{id:"VISUAL_INTELLIGENCE",return_anchor:"B"},{id:"STARBRIDGE",return_anchor:"C"},{id:"CODEFORGE_RECOVERY",return_anchor:"D"}]);
 assert.equal(applyPdiEvent(b,ev("2","COMPLETE"),{independent_source_readback:true,completion_readback:true}).streams[0].status,"COMPLETED");
});
test("rehydration registration is root-first and source-bound without foreground takeover",()=>{
 const native=new URL("./",import.meta.url),runtime=new URL("../../",native);
 const manifest=JSON.parse(readFileSync(new URL("REHYDRATION_MANIFEST.json",runtime),"utf8"));
 const registry=JSON.parse(readFileSync(new URL("continuity/RECURSIVE_FACET_REHYDRATION_REGISTRY_2026-10-09.json",runtime),"utf8"));
 const paths=["facets/parallel_development_intelligence/FACET_CONTRACT.md","facets/parallel_development_intelligence/CURRENT_STATE.json","facets/parallel_development_intelligence/SUB_LIFECIRCLE.md","facets/parallel_development_intelligence/SUB_REHYDRATION.md"];
 for(const p of paths)assert.ok(manifest.required_order.includes(p),p);
 assert.ok(registry.facets.some(f=>f.id==="parallel_development_intelligence"&&f.load_default==="REHYDRATED_IDLE_REACHABLE"&&f.writes==="NONE_ON_REHYDRATION"));
 const state=JSON.parse(readFileSync(new URL("CURRENT_STATE.json",native),"utf8"));
 assert.equal(state.streams.length,4);assert.equal(state.automatic_execution,false);
});
