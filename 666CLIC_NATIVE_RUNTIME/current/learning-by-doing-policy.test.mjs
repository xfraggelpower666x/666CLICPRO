import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("./",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");
test("native development LiveCircle caps verification at three across turns",()=>{
 const x=read("CROSS_SYSTEM_DEVELOPMENT_EXCHANGE_LIVECIRCLE.md");
 assert.match(x,/RULE=MAX_3_CHECKS_THEN_LEARNING_BY_DOING/);
 assert.match(x,/NO_AUTOMATIC_LOOP_RESET_ON_WEITER_UPDATE_OR_NEW_CHAT=true/);
 assert.match(x,/AFTER_THREE=BUILD_OR_TARGETED_REPAIR_OR_DOCUMENT_EXTERNAL_HOST_BLOCKER/);
});
test("visual subcircle retains honest native chat fallback without host overclaim",()=>{
 const x=read("../facets/semantic_visual_intelligence/SUB_LIFECIRCLE.md");
 assert.match(x,/CURRENT_COMPLETED_VERIFICATION_ROUND=THREE_PHASES_DONE_DO_NOT_RESTART/);
 assert.match(x,/NO_REPOSITORY_MODULE_HOST_PASS_FROM_CHAT_UI_DEMO=true/);
 assert.match(x,/GPT_NATIVE_CHAT_CONTROLLED_SELECTION_FROM_SERVER_VERIFIED_DATA/);
});
test("no identity merge or native foreign write is licensed",()=>{
 const x=read("CROSS_SYSTEM_DEVELOPMENT_EXCHANGE_LIVECIRCLE.md");
 assert.match(x,/NATIVE_BOUNDARIES=NO_FOREIGN_MUTATION;NO_FOREIGN_AUTOACTIVATION/);
 assert.match(x,/PRESERVE=JUNIOR_FOREGROUND\|PET_PAUSED\|STARBRIDGE_SB04_SB05/);
});
