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

test("HTTP 429 records cooldown in central ledger",async()=>{
 let reservation=0,cooldown=0;
 const env=fixture().env;
 env.CLIC_PET_GITHUB_BUDGET={idFromName:()=>({}),get:()=>({fetch:async(_url,opt)=>{if(_url.endsWith("/reserve")){reservation++;return Response.json({allowed:true})}if(_url.endsWith("/cooldown")){cooldown++;const d=JSON.parse(opt.body);assert.ok(Number.isSafeInteger(d.until_ms));return Response.json({accepted:true})}throw Error("Unexpected budget endpoint")}})};
 const r=await budgetedGitHubRead(env,ok,{fetchImpl:async()=>new Response("limited",{status:429,headers:{"retry-after":"60"}})});
 assert.equal(r.status,429);assert.equal(reservation,1);assert.equal(cooldown,1);
});
test("normal 403 without rate-limit headers does not set cooldown",async()=>{
 let calls=[];const x=fixture();
 x.env.CLIC_PET_GITHUB_BUDGET={idFromName:()=>({}),get:()=>({fetch:async(url)=>{calls.push(url);return Response.json({allowed:true})}})};
 const response=await budgetedGitHubRead(x.env,ok,{fetchImpl:async()=>new Response("forbidden",{status:403})});
 assert.equal(response.status,403);assert.equal(calls.length,1);
});
test("cooldown storage failure is fail-closed",async()=>{
 const x=fixture();
 x.env.CLIC_PET_GITHUB_BUDGET={idFromName:()=>({}),get:()=>({fetch:async(url)=>url.endsWith("/reserve")?Response.json({allowed:true}):Response.json({accepted:false},{status:503})})};
 await assert.rejects(budgetedGitHubRead(x.env,ok,{fetchImpl:async()=>new Response("limited",{status:429})}),/COOLDOWN_WRITE_NOT_VERIFIED/);
});
