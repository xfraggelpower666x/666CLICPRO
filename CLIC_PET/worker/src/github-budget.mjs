// Candidate budget ledger: one SQLite-backed Durable Object (Cloudflare) per CLIC PET.
// Does not claim actual Github use before a verified producer is connected.
export class ClicGithubBudget {
 constructor(ctx,env) {
  this.ctx=ctx;this.env=env;
  ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS github_reservations(id INTEGER PRIMARY KEY AUTOINCREMENT, at_ms INTEGER NOT NULL)");
  ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS github_cooldown(id INTEGER PRIMARY KEY CHECK(id=1), until_ms INTEGER NOT NULL)");
 }
 async fetch(request){
  const path=new URL(request.url).pathname,now=Date.now(),sql=this.ctx.storage.sql;
  if(path==="/status"&&request.method==="GET"){
   if(this.env.CLIC_PET_BUDGET_ACTIVE!=="true")return Response.json({status:"UNAVAILABLE",used:null,limit:null,remaining:null,cooldown_until:null,reason:"NO_NATIVE_GITHUB_PRODUCER"},{headers:{"Cache-Control":"no-store"}});
   try{
    const count=Number(sql.exec("SELECT COUNT(*) AS n FROM github_reservations WHERE at_ms > ?",now-3600000).one().n);
    const cooldown=Number(sql.exec("SELECT until_ms FROM github_cooldown WHERE id=1").toArray()[0]?.until_ms||0);
    const limit=Number(this.env.CLIC_PET_GITHUB_LIMIT);
    if(!Number.isSafeInteger(limit)||limit<1||limit>5000||!Number.isSafeInteger(count))throw Error("INVALID_BUDGET");
    return Response.json({status:"OK",used:count,limit,remaining:Math.max(0,limit-count),cooldown_until:cooldown>now?new Date(cooldown).toISOString():null},{headers:{"Cache-Control":"no-store"}});
   }catch{return Response.json({status:"UNAVAILABLE",used:null,limit:null,remaining:null},{status:503,headers:{"Cache-Control":"no-store"}});}
  }
  if(path==="/cooldown"&&request.method==="POST"&&this.env.CLIC_PET_BUDGET_ACTIVE==="true"){
   try{
    const data=await request.json();
    const until=Number(data.until_ms);
    if(!Number.isSafeInteger(until)||until<=now||until>now+3600000)return Response.json({accepted:false,reason:"INVALID_COOLDOWN"},{status:400});
    sql.exec("INSERT INTO github_cooldown(id,until_ms) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET until_ms=MAX(github_cooldown.until_ms,excluded.until_ms)",until);
    return Response.json({accepted:true,cooldown_until:new Date(until).toISOString()},{headers:{"Cache-Control":"no-store"}});
   }catch{return Response.json({accepted:false,reason:"INVALID_COOLDOWN"},{status:400});}
  }
  if(path!=="/reserve"||request.method!=="POST"||this.env.CLIC_PET_BUDGET_ACTIVE!=="true")return new Response("Forbidden",{status:403});
  // Internal binding only, never routed from the external worker.
  try{
   const limit=Number(this.env.CLIC_PET_GITHUB_LIMIT);
   if(!Number.isSafeInteger(limit)||limit<1||limit>5000)return Response.json({allowed:false,reason:"CONFIG_UNAVAILABLE"},{status:503});
   const cooldown=Number(sql.exec("SELECT until_ms FROM github_cooldown WHERE id=1").toArray()[0]?.until_ms||0);
   if(cooldown>now)return Response.json({allowed:false,reason:"COOLDOWN"},{status:429});
   sql.exec("DELETE FROM github_reservations WHERE at_ms <= ?",now-3600000);
   const count=Number(sql.exec("SELECT COUNT(*) AS n FROM github_reservations").one().n);
   if(count>=limit)return Response.json({allowed:false,reason:"LIMIT_REACHED"},{status:429});
   sql.exec("INSERT INTO github_reservations(at_ms) VALUES (?)",now);
   return Response.json({allowed:true});
  }catch{return Response.json({allowed:false,reason:"STORAGE_FAILURE"},{status:503});}
 }
}
export async function reserveBudgetedGitHubCall(env){
 if(!env?.CLIC_PET_GITHUB_BUDGET||env.CLIC_PET_BUDGET_ACTIVE!=="true")throw Error("BUDGET_NOT_READY");
 const ns=env.CLIC_PET_GITHUB_BUDGET;
 const r=await ns.get(ns.idFromName("whole-clic-pet-github-v1")).fetch("https://budget.internal/reserve",{method:"POST"});
 if(!r.ok||(await r.json()).allowed!==true)throw Error("BUDGET_DENIED");
}

export async function recordGitHubCooldown(env, response, {now=Date.now()}={}) {
 if(!env?.CLIC_PET_GITHUB_BUDGET||env.CLIC_PET_BUDGET_ACTIVE!=="true")throw Error("BUDGET_NOT_READY");
 const limited=response.status===429||(response.status===403&&(response.headers.get("x-ratelimit-remaining")==="0"||response.headers.has("retry-after")));
 if(!limited)return false;
 const retry=response.headers.get("retry-after"),reset=response.headers.get("x-ratelimit-reset");
 let until=now+60000;
 if(retry&&/^\d+$/.test(retry))until=now+Number(retry)*1000;
 else if(reset&&/^\d+$/.test(reset))until=Number(reset)*1000;
 if(!Number.isSafeInteger(until)||until<=now)until=now+60000;
 until=Math.min(until,now+3600000);
 const ns=env.CLIC_PET_GITHUB_BUDGET;
 const r=await ns.get(ns.idFromName("whole-clic-pet-github-v1")).fetch("https://budget.internal/cooldown",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({until_ms:until})});
 if(!r.ok||(await r.json()).accepted!==true)throw Error("COOLDOWN_WRITE_NOT_VERIFIED");
 return true;
}
