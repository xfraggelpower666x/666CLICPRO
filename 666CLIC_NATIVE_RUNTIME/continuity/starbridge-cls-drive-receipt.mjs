// CLIC-owned optional Google Drive StarBridge evidence reader for 666CLS.
// READ ONLY: native CLS decision authority is never transferred to CLIC.
import {createHash} from "node:crypto";
const CLIC="xfraggelpower666x/666CLICPRO";
const BRANCH="clic-migration-rev79-staging";
const CLS="666CLS-CORE-001";
const CONTROL="1Jr8MIYP49oB0VrYY4w4XxWnXfVg9pwgW";
const POINTER="1wobeCgpXgO4ifUxkE9ld-S6VCqEn6JBA";
const HANDOFF="CLIC-STARBRIDGE-WHOLE-NET-666CLS-20261018-R01";
const OUTBOX="666CLIC_NATIVE_RUNTIME/outbox/666CLS/"+HANDOFF+".json";
const OUTBOX_BLOB="a075c30231fcdafd92d0968442c7a7c9c616fc6d";
const SHA=/^[a-f0-9]{40}$/i;
const HEX256=/^[a-f0-9]{64}$/i;
const deny=(reason)=>({status:"AWAIT_RECEIPT",reason,delivery_verified:false,adoption_verified:false,host_verified:false,automatic_transport_verified:false,foreign_mutation:false});
const unwrap=x=>x?.result??x;
const parse=x=>typeof x==="string"?JSON.parse(x):x;
const sha256=b=>createHash("sha256").update(b).digest("hex");
const blobHash=b=>createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
function revision(x){return typeof x?.revision==="string"&&x.revision.trim()?x.revision:typeof x?.etag==="string"&&x.etag.trim()?x.etag:null;}
function driveFile(x){
 const v=unwrap(x);
 // Connector adapter must supply exact raw bytes, never a parsed/re-serialized JSON object.
 if(!Buffer.isBuffer(v?.bytes)||typeof v?.file_id!=="string")throw Error("TRUSTED_RAW_DRIVE_BYTES_REQUIRED");
 return v;
}
function metadata(x){const v=unwrap(x);if(!v||typeof v!=="object")throw Error("DRIVE_METADATA_REQUIRED");return v;}
function data(x){const v=unwrap(x);return parse(v?.content??v);}
function sourceFile(x){
 const v=unwrap(x);if(typeof v?.content!=="string"||!SHA.test(v.sha??""))throw Error("INVALID_GITHUB_FILE");
 if(blobHash(Buffer.from(v.content,"utf8"))!==v.sha)throw Error("SOURCE_CONTENT_BLOB_MISMATCH");
 return v;
}
export async function bindClsDriveReceipt({github,drive,receipt_file_id}={}){
 if(!github||!["fetch","fetchFile"].every(k=>typeof github[k]==="function")||
    !drive||!["getMetadata","readRaw"].every(k=>typeof drive[k]==="function"))
   return deny("TRUSTED_CONNECTORS_REQUIRED");
 if(typeof receipt_file_id!=="string"||!receipt_file_id.trim()||receipt_file_id===POINTER)return deny("INVALID_RECEIPT_FILE_ID");
 try{
  const head0=data(await github.fetch({url:"https://api.github.com/repos/"+CLIC+"/branches/"+BRANCH})).commit?.sha;
  if(!SHA.test(head0??""))return deny("SOURCE_HEAD_UNVERIFIED");
  const t=data(await github.fetch({url:"https://api.github.com/repos/"+CLIC+"/git/trees/"+head0+"?recursive=1"}));
  if(t?.truncated!==false||!Array.isArray(t.tree))return deny("SOURCE_TREE_INCOMPLETE");
  if(!t.tree.some(x=>x.type==="blob"&&x.path===OUTBOX&&x.sha===OUTBOX_BLOB))return deny("SOURCE_BLOB_NOT_CURRENT");
  const f=sourceFile(await github.fetchFile({repository_full_name:CLIC,path:OUTBOX,ref:head0}));
  if(f.sha!==OUTBOX_BLOB)return deny("SOURCE_BLOB_MISMATCH");
  const proposal=JSON.parse(f.content);
  if(proposal.handoff_id!==HANDOFF||proposal.source_system!=="666CLIC"||
     proposal.target_system!=="666CLS"||proposal.classification!=="CLIC_OWNED_TARGET_SPECIFIC_PREPARED_PROPOSAL"||
     proposal.receipt_contract?.expected_handoff_id!==HANDOFF||
     proposal.receipt_contract?.expected_target_native_receipt_id!=="666CLS-CLIC-WHOLE-NET-20261018-R01-RECEIPT")
    return deny("UNEXPECTED_SOURCE_PROPOSAL");
  const [pm0,rm0]=await Promise.all([drive.getMetadata(POINTER),drive.getMetadata(receipt_file_id)]);
  const p0=metadata(pm0),r0=metadata(rm0);
  if(p0.id!==POINTER||!Array.isArray(p0.parents)||!p0.parents.includes(CONTROL)||
     r0.id!==receipt_file_id||!Array.isArray(r0.parents)||!r0.parents.includes(CONTROL)||
     r0.mimeType!=="application/json")return deny("INVALID_NATIVE_PROVIDER_SCOPE");
  const pv=revision(p0),rv=revision(r0);
  if(!pv||!rv)return deny("PROVIDER_REVISION_NOT_VERIFIABLE");
  const [pb,rb]=await Promise.all([drive.readRaw(POINTER),drive.readRaw(receipt_file_id)]);
  const pointer=driveFile(pb),receiptFile=driveFile(rb);
  if(pointer.file_id!==POINTER||receiptFile.file_id!==receipt_file_id)return deny("PROVIDER_FILE_ID_MISMATCH");
  if(pointer.revision!==pv||receiptFile.revision!==rv)return deny("PROVIDER_REVISION_MISMATCH");
  const ptr=JSON.parse(pointer.bytes.toString("utf8")),receipt=JSON.parse(receiptFile.bytes.toString("utf8"));
  if(ptr.system_id!==CLS||ptr.current_version!=="1.23.0"||ptr.status!=="COMPLETE_VERIFIED"||
     ptr.runtime_authority!=="05_LIVE_STATE_ONLY"||ptr.scope_lock!=="CLS_ARCHIVE_ONLY")
    return deny("NATIVE_POINTER_SCOPE_OR_VERSION_MISMATCH");
  if(receipt.schema!=="666CLS_STARBRIDGE_DRIVE_SOURCE_RECEIPT_V1"||
     receipt.handoff_id!==HANDOFF||receipt.receipt_id!=="666CLS-CLIC-WHOLE-NET-20261018-R01-RECEIPT"||
     receipt.receiver_system!==CLS||receipt.source_repository!==CLIC||
     receipt.source_path!==OUTBOX||receipt.source_blob_sha!==OUTBOX_BLOB||
     receipt.native_pointer_id!==POINTER||receipt.native_pointer_revision!==pv||
     receipt.native_version!=="1.23.0")
    return deny("NATIVE_RECEIPT_PROVENANCE_MISMATCH");
  if(receipt.receive_decision!=="ACCEPT_SOURCE_REFERENCE_FOR_SCOPED_NATIVE_REVIEW_ONLY"||
     receipt.scope!=="CLS_ARCHIVE_ONLY"||receipt.foreign_runtime_adopted!==false||
     receipt.foreign_mutation!==false)
    return deny("NATIVE_RECEIVE_DECISION_OR_SCOPE_MISMATCH");
  if(!HEX256.test(receipt.source_sha256??"")||
     receipt.source_sha256!==sha256(Buffer.from(f.content,"utf8")))
    return deny("SOURCE_CONTENT_SHA256_MISMATCH");
  const [pm1,rm1,h1]=await Promise.all([
    drive.getMetadata(POINTER),drive.getMetadata(receipt_file_id),
    github.fetch({url:"https://api.github.com/repos/"+CLIC+"/branches/"+BRANCH})
  ]);
  if(revision(metadata(pm1))!==pv||revision(metadata(rm1))!==rv||
     data(h1).commit?.sha!==head0)return deny("CONCURRENT_PROVIDER_OR_SOURCE_CHANGE");
  // Provider-owned revision is the identity of exact raw readback; no Git CAS assertion.
  return {status:"DELIVERED_EVIDENCED",delivery_verified:true,adoption_verified:false,host_verified:false,
   automatic_transport_verified:false,foreign_mutation:false,may_mutate_foreign:false,
   handoff_id:HANDOFF,source:{repository:CLIC,head:head0,path:OUTBOX,git_blob_sha:OUTBOX_BLOB,
     sha256:receipt.source_sha256},
   recipient:{provider:"GOOGLE_DRIVE",system:CLS,receipt_file_id,
     receipt_revision:rv,receipt_sha256:sha256(receiptFile.bytes),
     pointer_file_id:POINTER,pointer_revision:pv,pointer_sha256:sha256(pointer.bytes)},
   concurrency:"READ_ONLY_DOUBLE_PROVIDER_REVISION_CHECK_NOT_CAS",
   transport:"NATIVE_CLS_RECEIPT_INDEPENDENT_PROVIDER_READBACK"};
 }catch(e){return deny("READBACK_FAILED:"+String(e?.message??e))}
}
export const CLS_DRIVE_RECEIVER_SCOPE=Object.freeze({system:CLS,control_folder:CONTROL,pointer_id:POINTER,
 handoff_id:HANDOFF,source_blob:OUTBOX_BLOB,mode:"READ_ONLY_NO_FOREIGN_WRITE"});


// Native Google Docs evidence is distinct from a CLS receipt. This function NEVER grants DELIVERY.
const CLS_INTAKE="1OXX4trmZeJLXaEpuVsf2lkIvXy0mlGS1qyIjEAt9ap8";
const CLS_LEGACY_HANDOFF_FOLDER="1KTKbJBVT5PIO4zTvL49HwRXlEHm9iJGV";
const DOCS_DECISION="ACCEPT_SOURCE_REFERENCE_FOR_SCOPED_NATIVE_REVIEW_ONLY";
const docsDeny=(reason)=>({...deny(reason),source_verified:false,native_decision_verified:false,docs_intake_verified:false,receipt_verified:false});
const providerMeta=x=>{const v=unwrap(x);return {id:v?.id,parents:v?.parent_ids??v?.parents,mime:v?.mime_type??v?.mimeType};};
const providerRevision=x=>{const v=unwrap(x);return v?.currentRevisionId??v?.revisionId??revision(v)};
const allEqual=(values,expected)=>values.length===1&&values[0]===expected;
const fieldValues=(s,k)=>Array.from(s.matchAll(new RegExp("(?:^|\\n)"+k+"=([^\\r\\n]*)","g")),m=>m[1].trim());
const versionAtLeast=(version,baseline)=>{const v=version.split(".").map(Number),b=baseline.split(".").map(Number);return /^\d+\.\d+\.\d+$/.test(version)&&v.every(Number.isSafeInteger)&&v.some((n,i)=>n>b[i]&&v.slice(0,i).every((p,j)=>p===b[j]))||version===baseline;};
export async function inspectClsDocsIntake({github,drive,intake_file_id=CLS_INTAKE}={}){
 if(!github||typeof github.fetch!=="function"||typeof github.fetchFile!=="function"||
    !drive||!["getMetadata","getRevision","readRaw","getDocument","getDocumentText"].every(k=>typeof drive[k]==="function"))
   return docsDeny("TRUSTED_CONNECTORS_REQUIRED");
 if(intake_file_id!==CLS_INTAKE)return docsDeny("UNAUTHORIZED_INTAKE_ID");
 try{
  const head0=data(await github.fetch({url:"https://api.github.com/repos/"+CLIC+"/branches/"+BRANCH})).commit?.sha;
  if(!SHA.test(head0??""))return docsDeny("SOURCE_HEAD_UNVERIFIED");
  const tree=data(await github.fetch({url:"https://api.github.com/repos/"+CLIC+"/git/trees/"+head0+"?recursive=1"}));
  if(tree?.truncated!==false||!Array.isArray(tree.tree)||
     !tree.tree.some(x=>x.type==="blob"&&x.path===OUTBOX&&x.sha===OUTBOX_BLOB))
    return docsDeny("SOURCE_TREE_OR_BLOB_MISMATCH");
  const f=sourceFile(await github.fetchFile({repository_full_name:CLIC,path:OUTBOX,ref:head0}));
  if(f.sha!==OUTBOX_BLOB)return docsDeny("SOURCE_BLOB_MISMATCH");
  const proposal=JSON.parse(f.content);
  if(proposal.handoff_id!==HANDOFF||proposal.source_system!=="666CLIC"||
     proposal.target_system!=="666CLS")return docsDeny("SOURCE_PROPOSAL_MISMATCH");
  const [im0,pm0,pr0,d0,t0]=await Promise.all([
   drive.getMetadata(CLS_INTAKE),drive.getMetadata(POINTER),
   drive.getRevision(POINTER),drive.getDocument(CLS_INTAKE),drive.getDocumentText(CLS_INTAKE)]);
  const im=providerMeta(im0),pm=providerMeta(pm0),pv=providerRevision(pr0);
  const doc=unwrap(d0),txt=unwrap(t0);
  if(im.id!==CLS_INTAKE||im.mime!=="application/vnd.google-apps.document"||
     !Array.isArray(im.parents)||!im.parents.includes(CLS_LEGACY_HANDOFF_FOLDER)||
     pm.id!==POINTER||pm.mime!=="application/json"||!Array.isArray(pm.parents)||!pm.parents.includes(CONTROL))
   return docsDeny("INVALID_NATIVE_PROVIDER_SCOPE");
  if(typeof pv!=="string"||!pv||!doc?.revisionId||txt.documentId!==CLS_INTAKE||
     doc.documentId!==CLS_INTAKE||txt.revisionId!==doc.revisionId||
     !Array.isArray(txt.paragraphs))return docsDeny("DOCS_OR_POINTER_REVISION_UNVERIFIED");
  const raw=unwrap(await drive.readRaw(POINTER));
  if(raw.file_id!==POINTER||raw.revision!==pv||!Buffer.isBuffer(raw.bytes))
   return docsDeny("POINTER_RAW_BYTES_OR_REVISION_MISMATCH");
  const ptr=JSON.parse(raw.bytes.toString("utf8"));
  if(ptr.system_id!==CLS||ptr.status!=="COMPLETE_VERIFIED"||
     ptr.runtime_authority!=="05_LIVE_STATE_ONLY"||ptr.scope_lock!=="CLS_ARCHIVE_ONLY"||
     typeof ptr.current_version!=="string"||!versionAtLeast(ptr.current_version,"1.23.0"))
   return docsDeny("NATIVE_POINTER_SCOPE_OR_VERSION_MISMATCH");
  if(txt.paragraphs.some(p=>typeof p.text!=="string"))return docsDeny("INVALID_DOCS_PARAGRAPHS");
  const content=txt.paragraphs.map(p=>p.text).join("\n");
  const checks=[
   ["SYSTEM_ID",CLS],["LAST_CHECKED_CLS_VERSION","1.23.0"],
   ["SOURCE_GIT_BLOB",OUTBOX_BLOB],["SOURCE_CLIC_BLOB",OUTBOX_BLOB],
   ["HANDOFF_ID",HANDOFF],["NATIVE_AUTHORITY","GOOGLE_DRIVE_05_LIVE_STATE_ONLY"],
   ["DECISION_AUTHORITY",CLS],["DECISION_SCOPE","CLS_ARCHIVE_ONLY"],
   ["NATIVE_RECEIVE_DECISION",DOCS_DECISION],
   ["STATUS","SOURCE_INTAKE_ONLY_NOT_NATIVE_DELIVERY_RECEIPT"],
   ["NATIVE_RECEIPT_PUBLICATION","BLOCKED_NOT_ISSUED"],
   ["CLIC_INDEPENDENT_DELIVERY","NOT_VERIFIED"],
   ["SOURCE_REPO",CLIC],["FOREIGN_RUNTIME_IMPORT","FALSE"],
   ["CURRENT_POINTER_WRITE","NONE"]
  ];
  if(!checks.every(([k,v])=>allEqual(fieldValues(content,k),v))||
     fieldValues(content,"RECEIPT_FILE_ID").some(v=>v!=="NOT_PUBLISHED")||
     fieldValues(content,"DELIVERY_VERIFIED").some(v=>v!=="FALSE"))
   return docsDeny("INCOMPLETE_CONFLICTING_OR_FORGED_DOCS_EVIDENCE");
  const [im1,pm1,pr1,d1,t1,h1]=await Promise.all([
   drive.getMetadata(CLS_INTAKE),drive.getMetadata(POINTER),drive.getRevision(POINTER),
   drive.getDocument(CLS_INTAKE),drive.getDocumentText(CLS_INTAKE),
   github.fetch({url:"https://api.github.com/repos/"+CLIC+"/branches/"+BRANCH})]);
  if(providerRevision(pr1)!==pv||unwrap(d1)?.revisionId!==doc.revisionId||
     unwrap(t1)?.revisionId!==doc.revisionId||
     JSON.stringify(unwrap(t1)?.paragraphs)!==JSON.stringify(txt.paragraphs)||
     JSON.stringify(providerMeta(im1))!==JSON.stringify(im)||
     JSON.stringify(providerMeta(pm1))!==JSON.stringify(pm)||
     data(h1).commit?.sha!==head0)
   return docsDeny("CONCURRENT_PROVIDER_OR_SOURCE_CHANGE");
  return {status:"NATIVE_DECISION_EVIDENCED_RECEIPT_PENDING",
   source_verified:true,docs_intake_verified:true,native_decision_verified:true,
   delivery_verified:false,receipt_verified:false,adoption_verified:false,
   host_verified:false,automatic_transport_verified:false,foreign_mutation:false,
   source:{repository:CLIC,head:head0,path:OUTBOX,blob:OUTBOX_BLOB},
   native:{system:CLS,version:ptr.current_version,authority:"05_LIVE_STATE_ONLY",
     pointer_id:POINTER,pointer_revision:pv,intake_file_id:CLS_INTAKE,
     intake_revision:doc.revisionId,content_sha256:sha256(Buffer.from(content,"utf8")),
     content_hash_semantics:"NORMALIZED_PARAGRAPHS_NOT_ORIGINAL_DOCS_BYTES"},
   concurrency:"READ_ONLY_DOUBLE_REVISION_CHECK_NOT_CAS",receipt:"NOT_ISSUED"};
 }catch(e){return docsDeny("READBACK_FAILED:"+String(e?.message??e))}
}
