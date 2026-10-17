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
 assert.equal(m.status,"SOURCE_ONLY_BINARY_AND_PROVIDER_RELEASE_BLOCKED");
 assert.equal(m.governance.provider_release,"NOT_PUBLISHED");
 assert.equal(m.governance.native_approval,"NOT_ISSUED");
 assert.equal(m.governance.no_write_to_frozen_release,true);
 assert.equal(m.governance.no_foreign_mutation,true);
 assert.equal(m.governance.pet,"PAUSED");
 assert.equal(m.governance.junior,"PRESERVED");
});
