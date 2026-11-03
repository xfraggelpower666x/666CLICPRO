import test from "node:test";
import assert from "node:assert/strict";
import {createClsReadOnlyHostAdapter,inspectClsDocsFromHost,inspectClsReceiptFromHost,CLS_HOST_ADAPTER_SCOPE} from "./starbridge-cls-host-adapter.mjs";
const PTR="1wobeCgpXgO4ifUxkE9ld-S6VCqEn6JBA",FOLDER="1Jr8MIYP49oB0VrYY4w4XxWnXfVg9pwgW";
const raw=Buffer.from('{"system_id":"666CLS-CORE-001"}');
const fixture=(options={})=>{
 let calls=0;
 return {
  githubFetch:async()=>({result:{content:"{}"}}),
  githubFetchFile:async()=>({result:{content:"{}",sha:"a".repeat(40)}}),
  driveMetadata:async({fileId})=>({result:{id:fileId,parent_ids:[options.wrongParent?"wrong":FOLDER],mime_type:options.wrongMime?"text/plain":"application/json"}}),
  driveRevisions:async()=>({result:{currentRevisionId:options.noRevision?null:options.race&&++calls>1?"v2":"v1"}}),
  driveRawFetch:async({url,download_raw_file,include_base64})=>{
   assert.ok(url.includes(PTR));assert.equal(download_raw_file,true);assert.equal(include_base64,true);
   return {result:{id:options.wrongFile?"other":PTR,b64_string:options.badRaw?"broken$":raw.toString("base64"),file_size_bytes:options.badSize?1:raw.length}};
  },
  docsDocument:async()=>({result:{documentId:"docs",revisionId:"d1"}}),
  docsText:async()=>({result:{documentId:"docs",revisionId:"d1",paragraphs:[]}})
 };
};
test("host adapter maps original Drive base64 and provider revision without claiming CAS",async()=>{
 const a=createClsReadOnlyHostAdapter(fixture());
 assert.equal(a.classification,"CLIC_ONLY_READ_ONLY_PROVIDER_BINDING_NO_CAS");
 const m=(await a.drive.getMetadata(PTR)).result;
 assert.equal(m.mimeType,"application/json");assert.deepEqual(m.parents,[FOLDER]);assert.equal(m.revision,"v1");
 const r=(await a.drive.readRaw(PTR)).result;
 assert.equal(r.file_id,PTR);assert.equal(r.revision,"v1");assert.deepEqual(r.bytes,raw);
 assert.equal(CLS_HOST_ADAPTER_SCOPE.cas,false);
});
test("missing host handle fails closed",async()=>{assert.throws(()=>createClsReadOnlyHostAdapter({}),/TRUSTED_HOST_HANDLES_REQUIRED/)});
for(const [label,flags,pattern] of [
 ["missing revision",{noRevision:true},"PROVIDER_REVISION_UNAVAILABLE"],
 ["revision changes during raw read",{race:true},"CONCURRENT_PROVIDER_REVISION_CHANGE"],
 ["wrong source file",{wrongFile:true},"TRUSTED_RAW_BASE64_REQUIRED"],
 ["tampered base64",{badRaw:true},"TRUSTED_RAW_BASE64_REQUIRED"],
 ["incorrect byte size",{badSize:true},"RAW_BYTES_SIZE_OR_ENCODING_MISMATCH"]
])test("fail-closed: "+label,async()=>{
 await assert.rejects(createClsReadOnlyHostAdapter(fixture(flags)).drive.readRaw(PTR),new RegExp(pattern));
});
test("missing native JSON receipt cannot deliver",async()=>{
 const r=await inspectClsReceiptFromHost(fixture(),null);
 assert.equal(r.delivery_verified,false);assert.equal(r.host_verified,false);
});
test("source evidence never promotes delivery with incomplete provider",async()=>{
 const r=await inspectClsDocsFromHost(fixture({noRevision:true}));
 assert.equal(r.delivery_verified,false);assert.equal(r.adoption_verified,false);assert.equal(r.host_verified,false);
});
test("source checks without authentic GitHub shape fail closed",async()=>{
 const r=await inspectClsDocsFromHost(fixture());
 assert.equal(r.delivery_verified,false);
});
