// Existing GitHub-Actions Node authorization: real GitHub GET, no CLS Drive/Docs token.
import {createHash} from "node:crypto";
import {writeFileSync} from "node:fs";
import {CLS_SOURCE,clsDispatchRequest,evaluateClsNativeInvocation} from "./cls-native-host-dispatch.mjs";
const sha1=b=>createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const token=process.env.GITHUB_TOKEN,checkout=process.env.GITHUB_SHA;
if(!token||!(/^[a-f0-9]{40}$/i).test(checkout??""))throw Error("AUTHORIZED_GITHUB_ACTIONS_CONTEXT_REQUIRED");
const root="https://api.github.com/repos/"+CLS_SOURCE.repository;
const headers={authorization:"Bearer "+token,accept:"application/vnd.github+json","user-agent":"666CLIC-cls-readonly-host"};
let calls=0;
async function get(url){
 if(!url.startsWith(root+"/"))throw Error("GITHUB_ENDPOINT_NOT_ALLOWED");
 calls++;const r=await fetch(url,{method:"GET",headers,redirect:"error"});
 if(!r.ok)throw Error("GITHUB_READ_FAILED_"+r.status);
 return r.json();
}
const result={schema:"CLIC_CLS_GITHUB_ONLY_NATIVE_EXECUTION_V1",github_actions_run_id:process.env.GITHUB_RUN_ID??null,
 github_api_read_calls:0,writes:0,docs_handles_injected:false,drive_handles_injected:false,
 original_cls_export_invoked:false,delivery_verified:false,adoption_verified:false,host_verified:false};
try{
 const branch=await get(root+"/branches/"+CLS_SOURCE.branch);
 const head=branch.commit?.sha;
 if(!/^[a-f0-9]{40}$/i.test(head??""))throw Error("INVALID_CLIC_HEAD");
 const tree=await get(root+"/git/trees/"+head+"?recursive=1");
 if(tree.truncated!==false||!Array.isArray(tree.tree))throw Error("INCOMPLETE_SOURCE_TREE");
 const entry=tree.tree.find(x=>x.path===CLS_SOURCE.path&&x.type==="blob");
 if(entry?.sha!==CLS_SOURCE.blob)throw Error("SOURCE_TREE_BLOB_MISMATCH");
 const file=await get(root+"/contents/"+CLS_SOURCE.path+"?ref="+head);
 if(file.type!=="file"||file.encoding!=="base64")throw Error("INVALID_SOURCE_FILE");
 const bytes=Buffer.from(file.content.replace(/\s/g,""),"base64");
 if(sha1(bytes)!==CLS_SOURCE.blob||file.sha!==CLS_SOURCE.blob)throw Error("SOURCE_BLOB_READBACK_FAILED");
 const head2=(await get(root+"/branches/"+CLS_SOURCE.branch)).commit?.sha;
 if(head2!==head)throw Error("CONCURRENT_HEAD_CHANGE");
 const localPath="666CLIC_NATIVE_RUNTIME/continuity/cls-native-host-dispatch.mjs";
 const moduleEntry=tree.tree.find(x=>x.path===localPath&&x.type==="blob");
 const {readFileSync}=await import("node:fs");
 if(moduleEntry?.sha!==sha1(readFileSync(localPath)))throw Error("CHECKOUT_MODULE_BLOB_MISMATCH");
 const gate=evaluateClsNativeInvocation({request:clsDispatchRequest(),execution:{
   runner_kind:"AUTHORIZED_NATIVE_NODE_RUNTIME",github_live:true,module_blob_verified:true,github_tree_complete:true,
   source_head:head,writes:0,available_handles:["githubFetch","githubFetchFile"],original_export_invoked:false,
   original_export_receipt:false}});
 result.status="GITHUB_SOURCE_EXECUTED_CLS_DRIVE_DOCS_HANDLES_BLOCKED";
 result.source_head=head;result.source_blob=entry.sha;result.module_blob=moduleEntry.sha;
 result.native_gate=gate;result.github_api_read_calls=calls;
}catch(e){result.status="GITHUB_PREFLIGHT_BLOCKED";result.reason=String(e.message);result.github_api_read_calls=calls;}
writeFileSync("clic-cls-native-dispatch-readonly-receipt.json",JSON.stringify(result,null,2)+"\n");
console.log("CLIC_CLS_NATIVE_DISPATCH="+JSON.stringify(result));
if(result.status!=="GITHUB_SOURCE_EXECUTED_CLS_DRIVE_DOCS_HANDLES_BLOCKED")process.exitCode=1;
