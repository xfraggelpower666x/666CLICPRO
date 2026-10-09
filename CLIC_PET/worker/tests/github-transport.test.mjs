import {test} from "node:test";
import assert from "node:assert/strict";
import {budgetedGitHubRead} from "../src/github-transport.mjs";
function fixture(allow=true){
let reserve=0,calls=0;
const binding={idFromName:()=>({}),get:()=>({fetch:async()=>{reserve++;return new Response(JSON.stringify({allowed:allow}),{status:allow?200:429,headers:{"content-type":"application/json"}})}})};
const env={CLIC_PET_GITHUB_BUDGET:binding,CLIC_PET_BUDGET_ACTIVE:"true",CLIC_PET_ALLOWED_REPOSITORY:"xfraggelpower666x/666CLICPRO"};
const fetchImpl=async()=>{calls++;return new Response("{}",{status:200})};
return {env,fetchImpl,stats:()=>({reserve,calls})};
}
const ok="https://api.github.com/repos/xfraggelpower666x/666CLICPRO/commits";
test("one budget reservation before each authorized request",async()=>{const x=fixture();const r=await budgetedGitHubRead(x.env,ok,{fetchImpl:x.fetchImpl});assert.equal(r.status,200);assert.deepEqual(x.stats(),{reserve:1,calls:1})});
test("budget refusal means no outgoing GitHub request",async()=>{const x=fixture(false);await assert.rejects(budgetedGitHubRead(x.env,ok,{fetchImpl:x.fetchImpl}),/BUDGET_DENIED/);assert.deepEqual(x.stats(),{reserve:1,calls:0})});
test("missing native binding fails closed",async()=>{const x=fixture();delete x.env.CLIC_PET_ALLOWED_REPOSITORY;await assert.rejects(budgetedGitHubRead(x.env,ok,{fetchImpl:x.fetchImpl}),/REPOSITORY_NOT_AUTHORIZED/);assert.deepEqual(x.stats(),{reserve:0,calls:0})});
test("non-Github origin rejected before accounting",async()=>{const x=fixture();await assert.rejects(budgetedGitHubRead(x.env,"https://evil.test/repos/xfraggelpower666x/666CLICPRO/commits",{fetchImpl:x.fetchImpl}),/NON_GITHUB_API_TARGET/);assert.deepEqual(x.stats(),{reserve:0,calls:0})});
test("unapproved Github repo rejected",async()=>{const x=fixture();await assert.rejects(budgetedGitHubRead(x.env,"https://api.github.com/repos/other/repo/commits",{fetchImpl:x.fetchImpl}),/REPOSITORY_NOT_AUTHORIZED/);assert.deepEqual(x.stats(),{reserve:0,calls:0})});
test("disabled producer fails before reservation",async()=>{const x=fixture();x.env.CLIC_PET_BUDGET_ACTIVE="false";await assert.rejects(budgetedGitHubRead(x.env,ok,{fetchImpl:x.fetchImpl}),/NATIVE_PRODUCER_NOT_CONNECTED/);assert.deepEqual(x.stats(),{reserve:0,calls:0})});
