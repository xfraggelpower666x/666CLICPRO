// CLIC native read-only approval provenance. GitHub source integrity is NOT approval identity.
// Deliberately never mints an executable write grant; host-bound authority remains unverified.
import {createHash} from "node:crypto";
import {R02_RECEIPT} from "./r02-source-intake-create-only.mjs";
export const APPROVAL_SOURCE=Object.freeze({
 repo:R02_RECEIPT.repository,branch:R02_RECEIPT.branch,
 path:"666CLIC_NATIVE_RUNTIME/continuity/approvals/LYVRA-CLIC-FREE-FIRST-STARBRIDGE-AUTOMATION-20261018-R02.json"
});
const sha=/^[a-f0-9]{40}$/i;
const blocked=(reason,extra={})=>({status:"APPROVAL_READBACK_PENDING",reason,approval_verified:false,receipt_write_authorized:false,delivery_verified:false,adoption_verified:false,host_verified:false,writes:0,foreign_writes:0,...extra});
const parse=x=>{const r=x?.result??x;return typeof r?.content==="string"?JSON.parse(r.content):r};
const body=x=>x?.result??x;
const gitSHA=s=>{const b=Buffer.from(s,"utf8");return createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex")};
export async function inspectR02NativeApproval({fetch,fetchFile,approvalFlags,expectedHead,sourceBlob=R02_RECEIPT.source_blob}={}){
 if(approvalFlags?.native_approval_verified===true||approvalFlags?.separate_receipt_write_approved===true)
  return blocked("SELF_ATTESTED_APPROVAL_FLAGS_REJECTED");
 if(typeof fetch!=="function"||typeof fetchFile!=="function")return blocked("AUTHORIZED_READ_CONNECTORS_REQUIRED");
 if(!sha.test(expectedHead??"")||sourceBlob!==R02_RECEIPT.source_blob)return blocked("SOURCE_OR_EXPECTED_HEAD_MISMATCH");
 const root="https://api.github.com/repos/"+APPROVAL_SOURCE.repo;
 const headURL=root+"/branches/"+APPROVAL_SOURCE.branch;
 const treeURL=root+"/git/trees/"+expectedHead+"?recursive=1";
 try{
  const before=parse(await fetch({url:headURL}))?.commit?.sha;
  if(before!==expectedHead)return blocked("CONCURRENT_CLIC_HEAD_CHANGE");
  const tree=parse(await fetch({url:treeURL}));
  if(tree?.truncated!==false||!Array.isArray(tree.tree))return blocked("INCOMPLETE_NATIVE_TREE");
  const entry=tree.tree.find(e=>e.path===APPROVAL_SOURCE.path);
  if(!entry)return blocked("NO_CLIC_NATIVE_APPROVAL_RECORD",{observed_head:before});
  if(entry.type!=="blob"||!sha.test(entry.sha??""))return blocked("INVALID_APPROVAL_TREE_ENTRY");
  const f=body(await fetchFile({repository_full_name:APPROVAL_SOURCE.repo,path:APPROVAL_SOURCE.path,ref:before}));
  if(f.sha!==entry.sha||typeof f.content!=="string"||gitSHA(f.content)!==entry.sha)return blocked("APPROVAL_BLOB_READBACK_MISMATCH");
  const a=JSON.parse(f.content);
  if(a.owner!=="666CLIC"||a.operation!=="CREATE_SOURCE_INTAKE_ONLY"||
     a.repository!==R02_RECEIPT.repository||a.branch!==R02_RECEIPT.branch||
     a.path!==R02_RECEIPT.path||a.handoff_id!==R02_RECEIPT.handoff||
     a.source_commit!==R02_RECEIPT.source_commit||a.source_blob!==R02_RECEIPT.source_blob||
     a.expected_head!==expectedHead||a.recovery_required!==true||
     a.create_only!==true||a.authority_transfer!==false)
    return blocked("APPROVAL_SCOPE_OR_PROVENANCE_MISMATCH");
  const after=parse(await fetch({url:headURL}))?.commit?.sha;
  if(after!==before)return blocked("CONCURRENT_CLIC_HEAD_CHANGE");
  // Even valid committed bytes can be self-authored; authenticated native approver and replay
  // are security-domain/host facts that cannot be inferred from repo JSON or boolean flags.
  return blocked("NATIVE_APPROVER_IDENTITY_AND_REPLAY_AUTHORITY_NOT_ATTESTED",{
   source_integrity_verified:true,approval_record_blob:entry.sha,observed_head:before,
   required_next:"INDEPENDENT_HOST_AUTHENTICATION_AND_ONE_TIME_APPROVAL_BINDING"
  });
 }catch(e){return blocked("APPROVAL_READBACK_FAILED:"+String(e?.message??e))}
}
