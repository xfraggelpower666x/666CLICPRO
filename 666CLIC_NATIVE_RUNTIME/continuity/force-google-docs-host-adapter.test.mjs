import test from "node:test";
import assert from "node:assert/strict";
import {createGoogleDocsForceHostAdapter,inspectGoogleDocsForceHost} from "./force-google-docs-host-adapter.mjs";
const scope={owner:"666CLIC",mode:"ISOLATED_TEST",fileId:"clic-isolated-docs-test",
 parentId:"clic-isolated-folder",expectedMime:"application/vnd.google-apps.document"};
function fixture({badParent=false,missingApproval=false,forgedApproval=false,wrongChanges=false,
 conflict=false,extraParagraph=false}={}){
 let rev=0,text="CLIC test only",writes=0;
 const data={documentId:scope.fileId,revisionId:"docs-"+rev};
 const google={
 getFileMetadata:async()=>({result:{id:scope.fileId,parent_ids:[badParent?"foreign":scope.parentId],
  mime_type:scope.expectedMime}}),
 getDocument:async()=>({result:{...data,revisionId:"docs-"+rev}}),
 getDocumentText:async()=>({result:{...data,revisionId:"docs-"+rev,paragraphs:extraParagraph?
  [{text},{text:"extra"}]:[{text}]}}),
 batchUpdateDocument:async a=>{
  assert.equal(a.document_id,scope.fileId);
  assert.equal(a.write_control.requiredRevisionId,"docs-"+rev);
  assert.equal(a.requests.length,1);
  if(conflict)throw Error("409 revision conflict");
  if(!wrongChanges){
   assert.equal(a.requests[0].replaceAllText.containsText.text,text);
   text=a.requests[0].replaceAllText.replaceText;
  }
  writes++;rev++;
  return {result:{documentId:scope.fileId,revisionId:"docs-"+rev,
   replies:[{replaceAllText:{occurrencesChanged:wrongChanges?0:1}}]}};
 }
 };
 const approval={issue:async q=>({result:{proofId:"independent-proof",opaqueReceipt:"opaque"}}),
 verify:async q=>({result:{valid:!forgedApproval,proofId:q.proofId,fileId:q.fileId,
 nonce:q.nonce,expectedRevision:q.expectedRevision,parentId:q.parentId,
 approverIndependent:!forgedApproval}})};
 if(missingApproval)delete approval.verify;
 return {google,approval,scope,track:()=>({rev,text,writes})};
}
test("fixture: revision-controlled Docs write, provider readback and restore",async()=>{
 const f=fixture(),x=await inspectGoogleDocsForceHost({...f,live:true});
 assert.equal(x.status,"PROVIDER_ISOLATED_READ_WRITE_RESTORE_VERIFIED");
 assert.equal(x.cas_scope,"ISOLATED_TEST_ONLY");assert.equal(x.host_verified,false);
 assert.equal(x.restore_verified,true);assert.equal(f.track().writes,2);
 assert.equal(f.track().text,"CLIC test only");
});
test("no live approval means WRITE_BLOCKED with no mutation",async()=>{
 const f=fixture(),x=await inspectGoogleDocsForceHost({...f,live:false});
 assert.equal(x.status,"WRITE_BLOCKED");assert.equal(x.read_verified,true);
 assert.equal(x.write_verified,false);assert.equal(f.track().writes,0);
});
for(const [name,flags,reason] of [
 ["foreign folder",{badParent:true},"PROVIDER_READ_FAILED"],
 ["missing approval verifier",{missingApproval:true},"DOCS_HOST_ADAPTER_BLOCKED"],
 ["forged approval",{forgedApproval:true},"WRITE_AUTHORIZATION_FAILED"],
 ["missing changed occurrence",{wrongChanges:true},"WRITE_OR_READBACK_FAILED_RECOVERY_REQUIRED"],
 ["provider 409 conflict",{conflict:true},"WRITE_OR_READBACK_FAILED_RECOVERY_REQUIRED"],
 ["multi-paragraph historical document",{extraParagraph:true},"PROVIDER_READ_FAILED"]
])test("fail closed: "+name,async()=>{
 const f=fixture(flags),x=await inspectGoogleDocsForceHost({...f,live:true});
 assert.equal(x.status,"WRITE_BLOCKED");assert.ok(x.reason.startsWith(reason));
 assert.equal(x.host_verified,false);
});
test("no use of prior U16/U11/U10 IDs as forced live target",async()=>{
 for(const id of ["1Qpb0YEANgbXzFC0tksgZPzMcDK_jY5nWVrtYuoDOo3g",
 "1phcYmKCXO5-z_iKRLDWccpZhouUU_NNZDqEeZ9-sw9o",
 "1sRqk6jrP6_TBBbFIyBhJmvAvBUqr4izvxQUgFua83kE"]){
  const f=fixture(),s={...scope,fileId:id};
  const x=await inspectGoogleDocsForceHost({...f,scope:s,live:false});
  assert.equal(x.status,"WRITE_BLOCKED");
 }
});
