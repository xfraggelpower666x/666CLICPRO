// CLIC-owned, LYVRA-inspired checkout source verifier. Read-only; never host or provider acceptance.
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {resolve,relative} from "node:path";
const SHA=/^[0-9a-f]{40}$/i;
const ROOT="666CLIC_NATIVE_RUNTIME/";
const git=(root,...args)=>execFileSync("git",args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
function bounded(path){return typeof path==="string"&&path.startsWith(ROOT)&&!path.includes("..")&&!path.includes("\\")&&!path.includes("\0");}
export function verifyClicCheckout({root=".",expectedHead,manifestPath=ROOT+"REHYDRATION_MANIFEST.json"}={}){
 if(!SHA.test(expectedHead??"")||!bounded(manifestPath))return {status:"PARTIAL",reason:"INVALID_EXPECTED_HEAD_OR_PATH",verified:false};
 try {
  const head=git(root,"rev-parse","HEAD");
  if(head!==expectedHead)return {status:"CONFLICT_QUARANTINE",reason:"CHECKOUT_HEAD_MISMATCH",verified:false,head};
  const committed=execFileSync("git",["show","HEAD:"+manifestPath],{cwd:root,encoding:"utf8"});
  const onDisk=readFileSync(resolve(root,manifestPath),"utf8");
  if(committed!==onDisk)return {status:"CONFLICT_QUARANTINE",reason:"MANIFEST_WORKTREE_MISMATCH",verified:false};
  const manifest=JSON.parse(committed),paths=manifest.required_order;
  if(manifest.system!=="666CLIC"||manifest.authority!=="GITHUB_REPO_CURRENT"||!Array.isArray(paths)||paths.length===0||new Set(paths).size!==paths.length)
   return {status:"PARTIAL",reason:"INVALID_MANIFEST",verified:false};
  const evidence=[];
  for(const p of paths){
   const file=ROOT+p;
   if(!bounded(file))return {status:"CONFLICT_QUARANTINE",reason:"UNSAFE_CARRIER_PATH",verified:false,path:p};
   try{
    const blob=git(root,"rev-parse","HEAD:"+file);
    const source=execFileSync("git",["show","HEAD:"+file],{cwd:root,encoding:"utf8"});
    if(source!==readFileSync(resolve(root,file),"utf8"))return {status:"CONFLICT_QUARANTINE",reason:"CARRIER_WORKTREE_MISMATCH",verified:false,path:p};
    evidence.push({path:p,blob_sha:blob});
   }catch{return {status:"PARTIAL",reason:"MISSING_OR_NON_TEXT_CARRIER",verified:false,path:p};}
  }
  return {status:"SOURCE_READBACK_VERIFIED",head,manifest_blob:git(root,"rev-parse","HEAD:"+manifestPath),carriers:evidence.length,verified:true,semantic_rehydration_verified:false,host_verified:false,plugin_parity_verified:false,foreign_mutation:false};
 }catch(e){return {status:"PARTIAL",reason:"CHECKOUT_READBACK_UNAVAILABLE",verified:false};}
}
// A receipt is a claim until BOTH source and recipient exact committed bytes are independently read.
// No caller-supplied `readback_verified` boolean can substitute for those provider-bound reads.
export function classifyPeerReceiptProvenance({receipt={},source={},recipient={}}={}){
 const ok=x=>SHA.test(x?.head??"")&&SHA.test(x?.blob_sha??"")&&x.committed_bytes_match===true&&x.provider_origin==="INDEPENDENT_GIT_READBACK";
 if(!ok(source)||!ok(recipient))return {status:"SOURCE_PROOF_PENDING",verified:false,delivery:false,adoption:false};
 if(receipt.source_head!==source.head||receipt.recipient_head!==recipient.head||receipt.source_blob_sha!==source.blob_sha)
  return {status:"CONFLICT_QUARANTINE",verified:false,delivery:false,adoption:false};
 return {status:"SOURCE_RECEIPT_CORRELATED",verified:true,delivery:false,adoption:false,host_verified:false};
}
