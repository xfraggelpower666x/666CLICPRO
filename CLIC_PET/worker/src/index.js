// CLIC Shared PET read-only fail-closed Worker candidate; NOT DEPLOYED.
import {ClicGithubBudget} from "./github-budget.mjs";
export {ClicGithubBudget};
const h={"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff"};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:h});
export default {async fetch(request,env){
if(request.method!=="GET")return reply({status:"METHOD_NOT_ALLOWED"},405);
const path=new URL(request.url).pathname;
if(path==="/health")return reply({status:"SOURCE_CANDIDATE_NOT_DEPLOYED",native_event_verified:false});
if(path==="/status")return reply({status:"UNAVAILABLE",native_context:"NOT_BOUND",junior:"UNVERIFIED"});
if(path==="/expression")return reply({status:"UNAVAILABLE",actor:"UNKNOWN",expression:"neutral",verified:false});
if(path==="/facets")return reply({status:"PREPARED",pet:"ONE_SHARED_TWO_ACTOR_PERSPECTIVES",bridge:"WHOLE_CLIC_BY_REFERENCE"});
if(path==="/budget-status"){
 if(env?.CLIC_PET_BUDGET_ACTIVE==="true"&&env.CLIC_PET_GITHUB_BUDGET){
  try{const ns=env.CLIC_PET_GITHUB_BUDGET;const response=await ns.get(ns.idFromName("whole-clic-pet-github-v1")).fetch("https://budget.internal/status");const body=await response.json();if(response.ok&&body.status==="OK"&&Number.isSafeInteger(body.used)&&Number.isSafeInteger(body.limit)&&body.limit>0&&body.remaining===Math.max(0,body.limit-body.used))return reply(body);}
  catch{}
 }return reply({status:"UNAVAILABLE",used:null,limit:null,remaining:null,cooldown_until:null,reason:"NO_AUTHORITATIVE_LEDGER"});
}
if(path==="/"||path==="/pet"){const html='<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dr. C.L.I.C. + Junior PET</title><main style="margin:8vh auto;max-width:38rem;background:#15172c;color:#a8fff5;padding:2rem;border:1px solid #00eeee;border-radius:20px;font:16px system-ui"><h1>Dr. C.L.I.C. + Junior</h1><p>Gemeinsames PET · Source Candidate</p><p>Native Ereignisse: nicht verbunden</p><p>GitHub-Budget: Nicht verfügbar</p><small>Keine produktive PET-Oberfläche, Originalgrafik-Anbindung offen.</small></main></html>';return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"}});}
return reply({status:"NOT_FOUND"},404);
}};
