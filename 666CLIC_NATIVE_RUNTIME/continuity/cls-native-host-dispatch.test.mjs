import test from "node:test";
import assert from "node:assert/strict";
import {evaluateClsNativeInvocation,clsDispatchRequest,CLS_DISPATCH_HANDLES} from "./cls-native-host-dispatch.mjs";
const good={runner_kind:"AUTHORIZED_NATIVE_NODE_RUNTIME",github_live:true,module_blob_verified:true,
github_tree_complete:true,source_head:"a".repeat(40),writes:0,available_handles:[...CLS_DISPATCH_HANDLES],
original_export_invoked:true,original_export_receipt:true,
output:{status:"NATIVE_DECISION_EVIDENCED_RECEIPT_PENDING",delivery_verified:false,adoption_verified:false,host_verified:false}};
test("actual authorized read-only source outcome never promotes delivery or ChatGPT host",()=>{
 const r=evaluateClsNativeInvocation({request:clsDispatchRequest(),execution:good});
 assert.equal(r.status,"NATIVE_SOURCE_EXECUTION_EVIDENCED_CHAT_FRESH_HOST_PENDING");
 assert.equal(r.delivery_verified,false);assert.equal(r.host_verified,false);
});
for(const [name,payload] of [
 ["missing provider functions",{available_handles:["githubFetch","githubFetchFile"]}],
 ["no genuine original invocation",{original_export_invoked:false}],
 ["no independent source receipt",{original_export_receipt:false}],
 ["unverified module blob",{module_blob_verified:false}],
 ["incomplete Git tree",{github_tree_complete:false}],
 ["writes attempted",{writes:1}],
 ["mock Github only",{github_live:false}],
 ["missing source head",{source_head:null}],
 ["forged adoption",{output:{...good.output,adoption_verified:true}}],
 ["forged delivery",{output:{...good.output,delivery_verified:true}}],
 ["forged host",{output:{...good.output,host_verified:true}}]
])test("fail closed: "+name,()=>{const r=evaluateClsNativeInvocation({request:clsDispatchRequest(),execution:{...good,...payload}});assert.equal(r.host_verified,false);assert.equal(r.delivery_verified,false);assert.equal(r.status,"HOST_BLOCKED")});
test("reject wrong system scope",()=>{const r=evaluateClsNativeInvocation({request:{...clsDispatchRequest(),repository:"foreign"},execution:good});assert.equal(r.status,"HOST_BLOCKED")});
