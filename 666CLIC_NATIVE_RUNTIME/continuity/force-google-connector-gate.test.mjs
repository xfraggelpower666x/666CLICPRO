import test from "node:test";
import assert from "node:assert/strict";
import {forceGoogleConnectorGate} from "./force-google-connector-gate.mjs";
const scope={owner:"666CLIC",mode:"ISOLATED_TEST",fileId:"clic-isolated-only",
 parentId:"clic-isolated-parent",expectedMime:"text/plain"};
function fixture({missingWrite=false,deny=false,race=false,wrongParent=false,
 invalidProof=false,brokenWrite=false,brokenRestore=false}={}){
 let version=1,content="original",writes=0,restores=0;
 const provider={
  read:async()=>({id:scope.fileId,parentId:wrongParent?"foreign":scope.parentId,
   mimeType:scope.expectedMime,revision:"rev-"+version,content}),
  authorizeIsolatedWrite:async({nonce,expectedRevision})=>deny?null:{
   fileId:scope.fileId,parentId:scope.parentId,nonce:invalidProof?"forged":nonce,
   authority:"PROVIDER_AUTHENTICATED",proofId:"mock-provider-proof",
   expectedRevision},
  writeIfRevision:async({expectedRevision,content:next})=>{
   if(race||expectedRevision!=="rev-"+version)throw Error("CAS_CONFLICT");
   if(!brokenWrite)content=next;version++;writes++;return {revision:"rev-"+version};
  },
  restoreIfRevision:async({expectedRevision,content:old})=>{
   if(expectedRevision!=="rev-"+version)throw Error("RECOVERY_CAS_CONFLICT");
   if(!brokenRestore)content=old;version++;restores++;return {revision:"rev-"+version};
  }
 };
 if(missingWrite)delete provider.writeIfRevision;
 return {provider,counters:()=>({writes,restores,content})};
}
test("read-only is WRITE_BLOCKED even if provider can write",async()=>{
 const f=fixture();const x=await forceGoogleConnectorGate({provider:f.provider,scope});
 assert.equal(x.status,"WRITE_BLOCKED");assert.equal(x.reason,"SOURCE_OR_MOCK_RUN_NOT_LIVE_ATTESTATION");
 assert.equal(x.read_verified,true);assert.equal(x.write_verified,false);
 assert.equal(f.counters().writes,0);
});
test("live isolated provider write, readback and revision-guarded restore",async()=>{
 const f=fixture();const x=await forceGoogleConnectorGate({provider:f.provider,scope,live:true});
 assert.equal(x.status,"PROVIDER_ISOLATED_READ_WRITE_RESTORE_VERIFIED");
 assert.equal(x.write_verified,true);assert.equal(x.restore_verified,true);
 assert.equal(x.host_verified,false);assert.equal(x.cas_scope,"ISOLATED_TEST_ONLY");
 assert.deepEqual(f.counters(),{writes:1,restores:1,content:"original"});
});
for(const [name,opts,reason] of [
 ["foreign parent",{wrongParent:true},"PROVIDER_READ_OR_SCOPE_INVALID"],
 ["missing independent write handle",{missingWrite:true},"INDEPENDENT_AUTHORIZED_WRITE_HANDLES_REQUIRED"],
 ["no provider authority",{deny:true},"INDEPENDENT_WRITE_AUTHORITY_NOT_PROVEN"],
 ["self-attested nonce",{invalidProof:true},"INDEPENDENT_WRITE_AUTHORITY_NOT_PROVEN"],
 ["TOCTOU revision race",{race:true},"WRITE_OR_READBACK_FAILED_RECOVERY_REQUIRED:CAS_CONFLICT"],
 ["postwrite mismatch",{brokenWrite:true},"POSTWRITE_PROVIDER_READBACK_MISMATCH_RECOVERY_REQUIRED"],
 ["restore mismatch",{brokenRestore:true},"RECOVERY_READBACK_FAILED_MANUAL_REPAIR_REQUIRED"]
])test("fail closed: "+name,async()=>{
 const f=fixture(opts);const x=await forceGoogleConnectorGate({provider:f.provider,scope,live:true});
 assert.equal(x.status,"WRITE_BLOCKED");assert.equal(x.reason,reason);
 assert.equal(x.foreign_mutation,false);
});
test("foreign target and caller flags never grant write scope",async()=>{
 const f=fixture();
 const x=await forceGoogleConnectorGate({provider:f.provider,scope:{...scope,owner:"666CLS"},live:true});
 assert.equal(x.reason,"CLIC_ISOLATED_SCOPE_REQUIRED");assert.equal(f.counters().writes,0);
});
test("missing provider cannot pass on historical context",async()=>{
 const x=await forceGoogleConnectorGate({provider:null,scope,live:true});
 assert.equal(x.reason,"LIVE_PROVIDER_READ_HANDLE_REQUIRED");
});
