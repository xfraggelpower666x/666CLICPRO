// CLIC-only Google Docs provider adaptation. No auto-host invocation or foreign writes.
// A distinct, independently trusted approval service is mandatory; caller booleans are inert.
import {forceGoogleConnectorGate} from "./force-google-connector-gate.mjs";
const MIME="application/vnd.google-apps.document";
const deny=reason=>({status:"WRITE_BLOCKED",reason,read_verified:false,write_verified:false,
 restore_verified:false,host_verified:false,cas_verified:false,foreign_mutation:false});
const unwrap=x=>x?.result??x;
function ensure(f,name){if(typeof f!=="function")throw Error("MISSING_PROVIDER_HANDLE:"+name);}
export function createGoogleDocsForceHostAdapter({google,approval,scope}={}){
 if(scope?.owner!=="666CLIC"||scope?.mode!=="ISOLATED_TEST"||
   !scope?.fileId||!scope?.parentId||scope.expectedMime!==MIME)
  throw Error("CLIC_ISOLATED_DOCS_SCOPE_REQUIRED");
 for(const name of ["getFileMetadata","getDocument","getDocumentText","batchUpdateDocument"])
  ensure(google?.[name],"google."+name);
 for(const name of ["issue","verify"])
  ensure(approval?.[name],"approval."+name);
 const read=async id=>{
  if(id!==scope.fileId)throw Error("UNAPPROVED_FILE_ID");
  const [meta0,doc0,txt,meta1,doc1]=await Promise.all([
   google.getFileMetadata({fileId:id}),google.getDocument({document_id:id}),
   google.getDocumentText({document_id:id}),google.getFileMetadata({fileId:id}),
   google.getDocument({document_id:id})]);
  const m=unwrap(meta0),m1=unwrap(meta1),d=unwrap(doc0),d1=unwrap(doc1),t=unwrap(txt);
  if(m.id!==id||m1.id!==id||m.mime_type!==MIME||m1.mime_type!==MIME||
    !Array.isArray(m.parent_ids)||!m.parent_ids.includes(scope.parentId)||
    JSON.stringify(m.parent_ids)!==JSON.stringify(m1.parent_ids)||
    d.documentId!==id||d1.documentId!==id||t.documentId!==id||
    !d.revisionId||d.revisionId!==t.revisionId||d.revisionId!==d1.revisionId)
   throw Error("UNSTABLE_DOCS_PROVIDER_SCOPE_OR_REVISION");
  // Only a purpose-created, ordinary, one-paragraph test document is safe for exact
  // replaceAllText. Reject rich or multi-paragraph documents, including historic U16/U11/U10.
  if(t.paragraphs?.length!==1||t.tabId||d.tabs?.length>1||
    typeof t.paragraphs[0]?.text!=="string"||
    !t.paragraphs[0].text.trim()||t.paragraphs[0].text.includes("\n"))
   throw Error("SINGLE_PARAGRAPH_ISOLATED_DOC_REQUIRED");
  return {id,parentId:scope.parentId,mimeType:MIME,revision:d.revisionId,
    content:t.paragraphs[0].text};
 };
 const permits=new Map();
 const authorizeIsolatedWrite=async request=>{
  const {fileId,parentId,owner,nonce,expectedRevision,expectedMime}=request;
  if(fileId!==scope.fileId||parentId!==scope.parentId||owner!=="666CLIC"||
     expectedMime!==MIME||!nonce||!expectedRevision)
   throw Error("AUTHORIZATION_SCOPE_MISMATCH");
  const issued=unwrap(await approval.issue({...request,operation:"GOOGLE_DOCS_ISOLATED_WRITE_AND_RESTORE"}));
  if(!issued?.proofId||!issued?.opaqueReceipt)throw Error("INDEPENDENT_APPROVAL_RECEIPT_MISSING");
  // This verifier must be a genuinely separate authenticated host service.
  const verified=unwrap(await approval.verify({proofId:issued.proofId,
    opaqueReceipt:issued.opaqueReceipt,...request}));
  if(verified?.valid!==true||verified.proofId!==issued.proofId||
     verified.fileId!==fileId||verified.nonce!==nonce||
     verified.expectedRevision!==expectedRevision||verified.parentId!==parentId||
     verified.approverIndependent!==true)
   throw Error("INDEPENDENT_APPROVAL_PROVENANCE_INVALID");
  const permit={fileId,parentId,nonce,expectedRevision,expectedMime,
    authority:"PROVIDER_AUTHENTICATED",proofId:issued.proofId};
  permits.set(issued.proofId,{...permit,lastRevision:expectedRevision});
  return permit;
 };
 const change=async ({fileId,expectedRevision,content,permit},restore=false)=>{
  if(fileId!==scope.fileId||!permit?.proofId||!permits.has(permit.proofId))
   throw Error("AUTHORIZATION_NOT_HELD_BY_HOST");
  const session=permits.get(permit.proofId);
  if(session.fileId!==fileId||session.lastRevision!==expectedRevision||
     (restore&&session.used!==true)||(!restore&&session.used===true))
   throw Error("REPLAY_OR_REVISION_SCOPE_MISMATCH");
  const old=await read(fileId);
  if(old.revision!==expectedRevision||content.includes("\n")||!content.trim())
   throw Error("CONCURRENT_CHANGE_OR_MULTIPARAGRAPH");
  const response=unwrap(await google.batchUpdateDocument({
   document_id:fileId,write_control:{requiredRevisionId:expectedRevision},
   requests:[{replaceAllText:{containsText:{text:old.content,matchCase:true},replaceText:content}}]
  }));
  if(response.documentId!==fileId||!response.revisionId||
     response.revisionId===expectedRevision||response.replies?.[0]?.replaceAllText?.occurrencesChanged!==1)
   throw Error("PROVIDER_WRITE_RESULT_UNVERIFIED");
  session.lastRevision=response.revisionId;session.used=true;
  if(restore)permits.delete(permit.proofId);
  return {revision:response.revisionId};
 };
 return Object.freeze({read,authorizeIsolatedWrite,
   writeIfRevision:args=>change(args,false),
   restoreIfRevision:args=>change(args,true)});
}
export async function inspectGoogleDocsForceHost({google,approval,scope,live=false}={}){
 try {
  const provider=createGoogleDocsForceHostAdapter({google,approval,scope});
  return await forceGoogleConnectorGate({provider,scope,live});
 }catch(e){return deny("DOCS_HOST_ADAPTER_BLOCKED:"+String(e?.message??e))}
}
export const GOOGLE_DOCS_FORCE_HOST_SCOPE=Object.freeze({
 mode:"CLIC_OWN_ISOLATED_SINGLE_PARAGRAPH_DOC_ONLY",
 live_host_provenance:"NOT_ATTESTED_BY_SOURCE",foreign_writes:false,
 auth:"SEPARATE_INDEPENDENT_APPROVAL_PROVIDER_REQUIRED",cas:"requiredRevisionId"});
