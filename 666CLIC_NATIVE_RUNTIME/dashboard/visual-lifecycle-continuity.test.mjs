import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {presentWholeClic,checkNoticeRegistry} from "./verified-visual-presenter.mjs";
const read=(p)=>fs.readFileSync(p,"utf8");
const base="666CLIC_NATIVE_RUNTIME/";
const contract=()=>read(base+"facets/semantic_visual_intelligence/UNIFIED_NEON_VISUAL_CONTRACT.md");
const circle=()=>read(base+"facets/semantic_visual_intelligence/SUB_LIFECIRCLE.md");
const rehydration=()=>read(base+"facets/semantic_visual_intelligence/SUB_REHYDRATION.md");
const visualSkill=()=>read("666clic-plugin/source/skills/666clic-visual-interface/SKILL.md");
const dashboardSkill=()=>read("666clic-plugin/source/skills/666clic-dashboard/SKILL.md");
const identity={system_id:"666CLIC",name:"C.L.I.C.",type:"SYSTEM",status:"VERIFIED",authority:"GITHUB_CURRENT",evidence:"git-current"};
test("Whole Visual continuity: each required current-user trigger covered across three source contracts",()=>{
  for(const trigger of ["SYSTEMSTART","UPDATE","FORCE_UPDATE","WEITER","NEW_CHAT","NEXT_CHAT","DASHBOARD","CARD","VISUAL","INTEGRATION_AUDIT"]){
    assert.ok(contract().includes(trigger),trigger+" missing visual contract");
    assert.ok(rehydration().includes(trigger),trigger+" missing rehydration");
  }
  for(const word of ["SYSTEMSTART","UPDATE","WEITER","DASHBOARD","CARD","VISUAL","INTEGRATION AUDIT"])assert.ok(visualSkill().includes(word),word);
});
test("visual facet inherited without authority or involuntary foreground",()=>{
  assert.match(contract(),/VISUAL_FACET_DEFAULT=REHYDRATED_IDLE_REACHABLE/);
  assert.match(contract(),/VISUAL_FOREGROUND=ONLY_DIRECT_VISUAL_TRIGGER_OR_VALID_NON_SUPERSEDED_ANCHOR/);
  assert.match(circle(),/NO_AUTO_FOREGROUND_FROM_PRESENTATION=true/);
  assert.match(rehydration(),/REHYDRATED_REACHABLE_NE_FOREGROUND=true/);
});
test("pinned Junior survives inactive developer state and PET stays paused",()=>{
  const inactive=presentWholeClic({identity,development:{status:"INACTIVE"}});
  assert.equal(inactive.junior.visible,true);assert.equal(inactive.developer.visible,false);
  assert.equal(inactive.junior.pet_development,"PAUSED");
  assert.match(dashboardSkill(),/Keep CLIC Junior independently pinned/);
});
test("incomplete active task evidence must not yield numeric completion",()=>{
  const r=presentWholeClic({identity,development:{status:"ACTIVE",authority:"666CLIC_REPO_CURRENT",tasks:[{id:"A",status:"DONE"}]}});
  assert.equal(r.developer.progress,null);
});
test("all native notices remain evidence-bound, not promoted from PREPARED",()=>{
  const n=JSON.parse(read(base+"outbox/visual/UNIFIED_NEON_VISUAL_NOTICE_REGISTRY_CURRENT.json"));
  const audit=checkNoticeRegistry(n);assert.equal(audit.valid,true);assert.equal(audit.prepared,7);assert.equal(audit.delivery_confirmed,0);
});
test("all native facets retain registry-governed contracts, subcircles and rehydration",()=>{
  const r=JSON.parse(read(base+"continuity/RECURSIVE_FACET_REHYDRATION_REGISTRY_2026-10-09.json"));
  const facets=r.facets;
  assert.ok(Array.isArray(facets) && facets.length>0,"native facet registry required");
  assert.equal(facets.length,r.verification.root_facets_found,"current native count must match registry verification");
  assert.equal(new Set(facets.map(f=>f.id)).size,facets.length,"duplicate native facet IDs forbidden");
  for(const id of ["repository_bridge","semantic_visual_intelligence","card_intelligence","semantic_force_decision","cross_surface_learning","parallel_development_intelligence"]){
    assert.ok(facets.some(f=>f.id===id),"preserve valid native facet "+id);
  }
  for(const f of facets){
    assert.equal(f.parent,"WHOLE_666CLIC",f.id+" must remain CLIC-owned");
    for(const key of ["contract","sub_lifecircle","sub_rehydration"]){
      assert.equal(typeof f[key],"string",f.id+" missing "+key);
      assert.ok(f[key].startsWith("facets/"+f.id+"/"),f.id+" invalid "+key+" scope");
      assert.ok(fs.existsSync(base+f[key]),f.id+" missing "+key+" file");
    }
  }
});
test("TDH unaffected and plugin source does not claim host acceptance",()=>{
  assert.ok(fs.existsSync(base+"relations/TDH_UNDERSTANDING_CARD_CURRENT_2026-10-09.md"));
  assert.match(visualSkill(),/source candidate until a governed/);
  assert.match(contract(),/SOURCE_TEST_NE_HOST_ACCEPTANCE=true/);
});
