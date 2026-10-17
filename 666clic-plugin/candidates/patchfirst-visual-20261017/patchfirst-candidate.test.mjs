import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";import {createHash} from "node:crypto";
const dir=new URL("./",import.meta.url);
const read=p=>readFileSync(new URL(p,dir),"utf8");
const hash=s=>{const bytes=Buffer.from(s);return createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0")).update(bytes).digest("hex")};
const root="../../";
const m=JSON.parse(read("PATCH_FIRST_CANDIDATE.json"));
test("three candidate skills are byte-identical to the latest CLIC source snapshot",()=>{
 assert.equal(m.three_source_skills.length,3);
 for(const item of m.three_source_skills){
  const candidate=read("skills/"+item.name+"/SKILL.md");
  const source=read("../../source/skills/"+item.name+"/SKILL.md");
  const frozen=read("../../releases/v0.1.22/skills/"+item.name+"/SKILL.md");
  assert.equal(candidate,source,item.name+" candidate must exactly copy source");
  assert.equal(hash(candidate),item.source_blob);
  assert.equal(hash(frozen),item.frozen_release_blob);
  assert.notEqual(candidate,frozen,"historical v0.1.22 remains separate");
 }
});
test("all skill roles preserve native triggers and boundaries",()=>{
 const visual=read("skills/666clic-visual-interface/SKILL.md");
 const dash=read("skills/666clic-dashboard/SKILL.md");
 const continuity=read("skills/666clic-continuity/SKILL.md");
 assert.match(visual,/Presentation only/);
 assert.match(dash,/Never mutate or activate a foreign system/);
 assert.match(continuity,/No reset|No global|never restart|never treat FORCE as implicit UPDATE/i);
});
test("candidate is not a release, backup approval, PET launch, or foreign mutation",()=>{
 assert.equal(m.status,"SOURCE_CANDIDATE_VISUAL_COMPLETION_SYNC_BINARY_PROVIDER_HOST_GATES_OPEN");
 assert.equal(m.governance.provider_release,"NOT_PUBLISHED");
 assert.equal(m.governance.native_approval,"NOT_ISSUED");
 assert.equal(m.governance.no_write_to_frozen_release,true);
 assert.equal(m.governance.no_foreign_mutation,true);
 assert.equal(m.governance.pet,"PAUSED");
 assert.equal(m.governance.junior,"PRESERVED");
});

test("five-option CLIC completion keeps all three existing skill surfaces semantically aligned",()=>{
 const v=read("skills/666clic-visual-interface/SKILL.md"),d=read("skills/666clic-dashboard/SKILL.md"),c=read("skills/666clic-continuity/SKILL.md");
 for(const text of [v,d,c]){
  assert.match(text,/visual-completion-guard\.mjs/);
  assert.match(text,/no auto|never authorizes UPDATE|not a.*UPDATE/i);
  assert.match(text,/PET/i);
  assert.match(text,/Junior/i);
 }
 assert.equal(m.visual_completion_2026_10_17.five_options_preserved,true);
 assert.equal(m.visual_completion_2026_10_17.plugin_update,"NOT_PUBLISHED");
 assert.equal(m.visual_completion_2026_10_17.fresh_host,"NOT_TESTED");
 assert.equal(m.visual_completion_2026_10_17.second_provider_plugin,"NOT_VERIFIED");
});
