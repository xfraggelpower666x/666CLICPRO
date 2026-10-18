// CLIC existing GitHub host-binding: authenticated read-only Node execution in GitHub Actions.
// No new bridge, no repo write and no native system authority transfer.
import {createHash} from "node:crypto";
import {writeFileSync,mkdirSync} from "node:fs";
import {verifyClicPdiHostReadiness,bindClicReadOnlyHostTools,evaluateClicNativeHostDispatchAcceptance}
 from "./github-connector-binding.mjs";
import {inspectPfsSb05NativeReceipts} from "../../continuity/starbridge-receipt-readback.mjs";
const CLIC="xfraggelpower666x/666CLICPRO",BRANCH="clic-migration-rev79-staging";
const SB05_PATH="666CLIC_NATIVE_RUNTIME/outbox/666PFS/CLIC-STARBRIDGE-SB05-20261017-01.json";
const modPdi="666CLIC_NATIVE_RUNTIME/dashboard/development_progress/github-connector-binding.mjs";
const modSb05="666CLIC_NATIVE_RUNTIME/continuity/starbridge-receipt-readback.mjs";
const hash=s=>{const b=Buffer.from(s);return createHash("sha1").update(Buffer.concat([Buffer.from("blob "+b.length),Buffer.from([0])])).update(b).digest("hex")};
const token=process.env.GITHUB_TOKEN;
const source=process.env.GITHUB_SHA;
const outputFile=process.env.CLIC_EXECUTION_RECEIPT_PATH||"clic-native-execution-receipt.json";
if(!token||!/^([a-f0-9]{40})$/i.test(source??""))throw Error("REAL_GITHUB_ACTIONS_TOKEN_AND_SHA_REQUIRED");
const headers={authorization:"Bearer "+token,accept:"application/vnd.github+json","x-github-api-version":"2022-11-28","user-agent":"666CLIC-read-only-native-runner"};
let calls=0; const fetchGit=async ({url})=>{
 if(!url.startsWith("https://api.github.com/repos/"))throw Error("EXTERNAL_ENDPOINT_NOT_AUTHORIZED");
 calls++;
 const r=await fetch(url,{method:"GET",headers,redirect:"error"});
 if(!r.ok)throw Error("GITHUB_READ_FAILED_"+r.status+"_"+new URL(url).pathname.split("/").slice(-2).join("/"));
 return {result:{content:JSON.stringify(await r.json())}};
};
const fetchFile=async ({repository_full_name,path,ref})=>{
 if(!/^([a-f0-9]{40})$/i.test(ref??""))throw Error("PINNED_COMMIT_REQUIRED");
 const url="https://api.github.com/repos/"+repository_full_name+"/contents/"+path+"?ref="+ref;
 calls++;
 const r=await fetch(url,{method:"GET",headers,redirect:"error"});
 if(!r.ok)throw Error("GITHUB_FILE_READ_FAILED_"+r.status+"_"+repository_full_name);
 const f=await r.json();
 if(f.type!=="file"||f.encoding!=="base64"||typeof f.content!=="string")throw Error("GITHUB_FILE_ENCODING_UNEXPECTED");
 const content=Buffer.from(f.content.replace(/\s/g,""),"base64").toString("utf8");
 if(hash(content)!==f.sha)throw Error("GITHUB_FILE_CONTENT_SHA_MISMATCH");
 return {result:{content,sha:f.sha}};
};
const results={schema:"CLIC_GITHUB_ACTIONS_NATIVE_READONLY_EXECUTION_V1",runner_kind:"AUTHORIZED_NATIVE_NODE_RUNTIME",
 workflow_sha:source,github_run_id:process.env.GITHUB_RUN_ID??null,
 connector:"GITHUB_ACTIONS_GITHUB_TOKEN_READ_ONLY_REST",write_operations:0,
 event_cas_verified:false,delivery_verified:false,adoption_verified:false,chatgpt_fresh_host:false,
 facets:{},github_api_read_calls:0};
try{
 const binding=bindClicReadOnlyHostTools({fetch:fetchGit,fetch_file:fetchFile});
 const headReply=await fetchGit({url:"https://api.github.com/repos/"+CLIC+"/branches/"+BRANCH});
 const clicHead=JSON.parse(headReply.result.content).commit.sha;
 const treeReply=await fetchGit({url:"https://api.github.com/repos/"+CLIC+"/git/trees/"+clicHead+"?recursive=1"});
 const tree=JSON.parse(treeReply.result.content);
 if(tree.truncated!==false)throw Error("CLIC_TREE_TRUNCATED");
 const blobOf=path=>tree.tree.find(x=>x.path===path&&x.type==="blob")?.sha;
 const moduleBlobs={[modPdi]:blobOf(modPdi),[modSb05]:blobOf(modSb05)};
 if(!Object.values(moduleBlobs).every(s=>/^([a-f0-9]{40})$/i.test(s??"")))throw Error("MODULE_BLOBS_NOT_FOUND");
 // A workflow checkout must agree with the committed module contents.
 const {readFileSync}=await import("node:fs");
 for(const [path,sha] of Object.entries(moduleBlobs)){
   if(hash(readFileSync(path,"utf8"))!==sha)throw Error("CHECKOUT_MODULE_BLOB_NE_LIVE_HEAD_"+path);
 }
 const pdi=await verifyClicPdiHostReadiness({github:binding.github});
 const pdiReq={facet:"PDI_READONLY",export_name:"verifyClicPdiHostReadiness",repository:CLIC,branch:BRANCH,
  mode:"READ_ONLY",allow_foreign_write:false,allow_event_write:false,expected_head:clicHead};
 const pdiExec={runner_kind:"AUTHORIZED_NATIVE_NODE_RUNTIME",connector_injected:true,
  module_loaded_from_verified_head:true,module_git_blob_verified:true,export_invoked:true,
  real_run_receipt:true,source_head:clicHead,module_blob:moduleBlobs[modPdi],writes:0,output:pdi};
 const pdiGate=evaluateClicNativeHostDispatchAcceptance({request:pdiReq,execution:pdiExec});
 results.facets.PDI={status:pdi.status,reason:pdi.reason??null,ledger_blobs:pdi.ledger_blobs??[],native_acceptance:pdiGate.status};
 const envelope=JSON.parse((await binding.fetchFile({repository_full_name:CLIC,path:SB05_PATH,ref:clicHead})).result.content);
 const sb05=await inspectPfsSb05NativeReceipts({fetch:binding.fetch,fetchFile:binding.fetchFile,envelope});
 const sbReq={facet:"SB05_READONLY",export_name:"inspectPfsSb05NativeReceipts",repository:CLIC,branch:BRANCH,
  mode:"READ_ONLY",allow_foreign_write:false,allow_event_write:false,expected_head:clicHead};
 const sbExec={runner_kind:"AUTHORIZED_NATIVE_NODE_RUNTIME",connector_injected:true,
  module_loaded_from_verified_head:true,module_git_blob_verified:true,export_invoked:true,
  real_run_receipt:true,source_head:clicHead,module_blob:moduleBlobs[modSb05],writes:0,output:{...sb05,writes:0}};
 const sbGate=evaluateClicNativeHostDispatchAcceptance({request:sbReq,execution:sbExec});
 results.facets.SB05={status:sb05.status,reason:sb05.reason??null,readback_blob:sb05.readback_blob??null,
  additive_blob:sb05.additive_blob??null,native_acceptance:sbGate.status};
 results.clic_head=clicHead;
 results.module_blobs=moduleBlobs;
 results.status=pdiGate.module_executed&&sbGate.module_executed?"TWO_NATIVE_MODULE_EXECUTIONS_EVIDENCED":"PARTIAL_NATIVE_EXECUTION";
}catch(e){
 results.status="PARTIAL_OR_BLOCKED";
 results.error=String(e?.message??e);
}finally{
 results.github_api_read_calls=calls;
 mkdirSync(new URL(".", "file://"+process.cwd()+"/"+outputFile),{recursive:true});
 writeFileSync(outputFile,JSON.stringify(results,null,2)+"\n");
 console.log("CLIC_NATIVE_EXECUTION_RECEIPT="+JSON.stringify(results));
}
if(results.status!=="TWO_NATIVE_MODULE_EXECUTIONS_EVIDENCED")process.exitCode=1;
