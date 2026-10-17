import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const base=new URL("./",import.meta.url);
const contract=readFileSync(new URL("FACET_CONTRACT.md",base),"utf8");
const state=JSON.parse(readFileSync(new URL("CURRENT_STATE.json",base),"utf8"));
const peer=readFileSync(new URL("../../outbox/666STREAM/CLIC-STREAM-MASTER-BRIDGE-REVIEW-20261017.md",base),"utf8");
test("CLIC remains owner of one registered bridge; references bound to exact blobs",()=>{
 assert.match(contract,/SECOND_BRIDGE_FORBIDDEN=true/);
 assert.match(contract,/REFERENCE_GIT_BLOB=197793077d081f6c28970d4bdfffc6a483cdafca/);
 assert.match(contract,/LYVRA_FALLBACK_GIT_BLOB=d0f58f4b1b3cda4c85125f0c2d6f086fc7d9cc6a/);
 assert.equal(state.stream_master_bridge_v1_0_0.existing_bridge_only,true);
 assert.equal(state.stream_master_bridge_v1_0_0.new_bridge,false);
});
test("no unsupported binary upload, original offline runner, peer delivery or host PASS claim",()=>{
 assert.match(contract,/CLIC_DIRECT_BINARY_EXECUTION=NOT_TESTED/);
 assert.match(contract,/CLIC_OFFLINE_FALLBACK_RUNTIME=NOT_VERIFIED/);
 assert.match(peer,/STATUS=PREPARED_PROPOSAL_NOT_DELIVERED_NOT_ADOPTED/);
 assert.match(peer,/CLIC_NATIVE_UPDATE_ONLY/);
});
test("fresh HEAD, original bytes and readback gates survive external reference adoption",()=>{
 for(const guard of ["SOURCE_EXACT_BYTES_AND_SHA256_REQUIRED=true","READ_HEAD_BEFORE_AND_IMMEDIATELY_BEFORE_REF_WRITE=true","NEVER_FORCE_UPDATE_REF_OR_PUSH=true","INDEPENDENT_COMMIT_TREE_BLOB_BYTES_SIZE_SHA256_READBACK_REQUIRED=true","NO_POINTER_WRITE_BY_BRIDGE=true","NO_FOREIGN_WRITES_BY_CLIC_BRIDGE=true"])assert.ok(contract.includes(guard),guard);
 assert.match(contract,/DELIVERY_NE_ADOPTION_NE_HOST_PASS=true/);
});
