import {test} from "node:test";
import assert from "node:assert/strict";
import {ClicGithubBudget} from "../src/github-budget.mjs";
function memorySql(){
 const reservations=[],cooldown={until:0};
 return {exec(query,...args){
  if(query.startsWith("CREATE TABLE"))return {};
  if(query.startsWith("SELECT until_ms"))return {toArray:()=>cooldown.until?[{until_ms:cooldown.until}]:[]};
  if(query.startsWith("SELECT COUNT(*)"))return {one:()=>({n:reservations.filter(t=>query.includes("WHERE at_ms")?t>args[0]:true).length})};
  if(query.startsWith("DELETE FROM")){for(let i=reservations.length-1;i>=0;i--)if(reservations[i]<=args[0])reservations.splice(i,1);return {};}
  if(query.startsWith("INSERT INTO github_reservations")){reservations.push(args[0]);return {};}
  if(query.startsWith("INSERT INTO github_cooldown")){cooldown.until=Math.max(cooldown.until,args[0]);return {};}
  throw Error("UNEXPECTED_SQL:"+query);
 }};
}
function setup(active=true,limit=2){const sql=memorySql();return new ClicGithubBudget({storage:{sql}},{CLIC_PET_BUDGET_ACTIVE:String(active),CLIC_PET_GITHUB_LIMIT:String(limit)})}
const req=(path,method="GET",body)=>new Request("https://budget.internal"+path,{method,headers:body?{"content-type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined});
const data=async r=>({status:r.status,value:await r.json()});
test("disabled ledger exposes unavailable not 0 / 300",async()=>{const d=await data(await setup(false).fetch(req("/status")));assert.equal(d.value.status,"UNAVAILABLE");assert.equal(d.value.used,null);assert.equal(d.value.limit,null)});
test("reservation limit and rolling status",async()=>{const doObj=setup();assert.equal((await data(await doObj.fetch(req("/reserve","POST")))).value.allowed,true);assert.equal((await data(await doObj.fetch(req("/reserve","POST")))).value.allowed,true);const denied=await data(await doObj.fetch(req("/reserve","POST")));assert.equal(denied.status,429);assert.equal(denied.value.reason,"LIMIT_REACHED");const st=await data(await doObj.fetch(req("/status")));assert.equal(st.value.used,2);assert.equal(st.value.remaining,0);assert.equal(st.value.limit,2)});
test("cooldown persists and blocks reservations",async()=>{const obj=setup();const now=Date.now();const c=await data(await obj.fetch(req("/cooldown","POST",{until_ms:now+120000})));assert.equal(c.value.accepted,true);const deny=await data(await obj.fetch(req("/reserve","POST")));assert.equal(deny.status,429);assert.equal(deny.value.reason,"COOLDOWN");const st=await data(await obj.fetch(req("/status")));assert.equal(st.value.status,"OK");assert.ok(st.value.cooldown_until)});
test("cooldown cannot be shortened and rejects future > 1 hour",async()=>{const obj=setup();const now=Date.now();await obj.fetch(req("/cooldown","POST",{until_ms:now+180000}));const before=(await data(await obj.fetch(req("/status")))).value.cooldown_until;await obj.fetch(req("/cooldown","POST",{until_ms:now+60000}));const after=(await data(await obj.fetch(req("/status")))).value.cooldown_until;assert.equal(before,after);const bad=await data(await obj.fetch(req("/cooldown","POST",{until_ms:now+7200000})));assert.equal(bad.status,400)});
test("internal writes forbidden when inactive",async()=>{const obj=setup(false);assert.equal((await obj.fetch(req("/reserve","POST"))).status,403);assert.equal((await obj.fetch(req("/cooldown","POST",{until_ms:Date.now()+60000}))).status,403)});
test("invalid limit fails closed",async()=>{const obj=setup(true,0);const denied=await data(await obj.fetch(req("/reserve","POST")));assert.equal(denied.status,503);assert.equal(denied.value.reason,"CONFIG_UNAVAILABLE")});
