// CLIC-owned host handle adaptation. Provider reads only; no CAS, write, or delivery promotion.
import {inspectClsDocsIntake,bindClsDriveReceipt} from "./starbridge-cls-drive-receipt.mjs";
const POINTER="1wobeCgpXgO4ifUxkE9ld-S6VCqEn6JBA";
const unwrap=x=>x?.result??x;
const deny=reason=>({status:"AWAIT_RECEIPT",reason,delivery_verified:false,adoption_verified:false,host_verified:false,automatic_transport_verified:false,foreign_mutation:false});
const required=["githubFetch","githubFetchFile","driveMetadata","driveRawFetch","driveRevisions","docsDocument","docsText"];
function revision(x){
 const v=unwrap(x);
 if(typeof v?.currentRevisionId!=="string"||!v.currentRevisionId.trim())throw Error("PROVIDER_REVISION_UNAVAILABLE");
 return v.currentRevisionId;
}
function metadata(x) {
 const v=unwrap(x);
 if(typeof v?.id!=="string"||!Array.isArray(v?.parent_ids)||typeof v?.mime_type!=="string")
  throw Error("PROVIDER_METADATA_INCOMPLETE");
 return {id:v.id,parents:v.parent_ids,mimeType:v.mime_type,revision:typeof v.revision==="string"?v.revision:undefined};
}
function decodeRaw(x,id) {
 const v=unwrap(x);
 if(v?.id!==id||typeof v?.b64_string!=="string"||!v.b64_string||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(v.b64_string))
    throw Error("TRUSTED_RAW_BASE64_REQUIRED");
 const bytes=Buffer.from(v.b64_string,"base64");
 if(bytes.toString("base64")!==v.b64_string||bytes.length!==v.file_size_bytes)
    throw Error("RAW_BYTES_SIZE_OR_ENCODING_MISMATCH");
 return bytes;
}
export function createClsReadOnlyHostAdapter(handles){
 if(!handles||required.some(k=>typeof handles[k]!=="function"))throw Error("TRUSTED_HOST_HANDLES_REQUIRED");
 const github={
  fetch:async({url})=>({result:{content:unwrap(await handles.githubFetch({url})).content}}),
  fetchFile:async(args)=>({result:unwrap(await handles.githubFetchFile(args))})
 };
 const drive={
  getMetadata:async id=>{
   const [m,r]=await Promise.all([handles.driveMetadata({fileId:id,fields:"id,name,mimeType,parents,size,modifiedTime"}),handles.driveRevisions({fileId:id,pageSize:100})]);
   return {result:{...metadata(m),revision:revision(r)}};
  },
  getRevision:async id=>({result:{currentRevisionId:revision(await handles.driveRevisions({fileId:id,pageSize:100}))}}),
  readRaw:async id=>{
   const rev0=revision(await handles.driveRevisions({fileId:id,pageSize:100}));
   const raw=await handles.driveRawFetch({url:"https://drive.google.com/file/d/"+encodeURIComponent(id)+"/view",download_raw_file:true,include_base64:true});
   const bytes=decodeRaw(raw,id);
   const rev1=revision(await handles.driveRevisions({fileId:id,pageSize:100}));
   if(rev0!==rev1)throw Error("CONCURRENT_PROVIDER_REVISION_CHANGE");
   return {result:{file_id:id,revision:rev0,bytes}};
  },
  getDocument:async id=>({result:unwrap(await handles.docsDocument({document_id:id}))}),
  getDocumentText:async id=>({result:unwrap(await handles.docsText({document_id:id}))})
 };
 return Object.freeze({github,drive,classification:"CLIC_ONLY_READ_ONLY_PROVIDER_BINDING_NO_CAS"});
}
export async function inspectClsDocsFromHost(handles){
 try {const {github,drive}=createClsReadOnlyHostAdapter(handles);return await inspectClsDocsIntake({github,drive});}
 catch(e){return deny("HOST_ADAPTER_FAIL_CLOSED:"+String(e?.message??e))}
}
export async function inspectClsReceiptFromHost(handles,receipt_file_id){
 if(!receipt_file_id||receipt_file_id===POINTER)return deny("NATIVE_RECEIPT_ID_REQUIRED");
 try {const {github,drive}=createClsReadOnlyHostAdapter(handles);return await bindClsDriveReceipt({github,drive,receipt_file_id});}
 catch(e){return deny("HOST_ADAPTER_FAIL_CLOSED:"+String(e?.message??e))}
}
export const CLS_HOST_ADAPTER_SCOPE=Object.freeze({mode:"READ_ONLY",native_receipt_required:true,cas:false,foreign_writes:false});