import test from "node:test";
import assert from "node:assert/strict";
import {bindClicNativeGithubTools,verifyClicPdiHostReadiness} from "../../dashboard/development_progress/github-connector-binding.mjs";
const OWNER="xfraggelpower666x/666CLICPRO",branch="clic-migration-rev79-staging",h="a".repeat(40);
const deps={fetch:async({url})=>({result:{content:JSON.stringify(url.includes("/branches/")?{commit:{sha:h}}:url.includes("/trees/")?{truncated:false,tree:[]}: {sha:h,parents:[{sha:h}]})}}),
 fetch_file:async()=>({result:{sha:h,content:'{"schema":"test"}'}}),
 update_file:async()=>({result:{commit_sha:h,content_sha:h}})};
test("actual connector tool-shaped binding allows narrow CLIC read and declared CAS path only",async()=>{
 const github=bindClicNativeGithubTools(deps);
 assert.equal((await github.readBranch({repository:OWNER,branch})).commit.sha,h);
 assert.equal((await github.fetchFile({repository:OWNER,path:"666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json",ref:branch})).sha,h);
 assert.equal((await github.updateFile({repository:OWNER,branch,path:"666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json",sha:h,content:"{}",message:"test"})).commit_sha,h);
});
test("foreign repos, nonledger writes, and forged expected SHA forbidden",async()=>{
 const github=bindClicNativeGithubTools(deps);
 await assert.rejects(()=>github.readBranch({repository:"foreign/repo",branch}),/CLIC_ONLY_SCOPE/);
 await assert.rejects(()=>github.updateFile({repository:OWNER,branch,path:"666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json",sha:h,content:"{}"}),/ALLOWLIST/);
 await assert.rejects(()=>github.updateFile({repository:OWNER,branch,path:"666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json",sha:"no",content:"{}"}),/EXACT_FILE/);
});

test("read-only host preflight verifies both persisted ledger blobs and unchanged head",async()=>{
 const paths=["666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json",
  "666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json"];
 let writes=0,heads=0;
 const github={readBranch:async()=>{heads++;return {commit:{sha:h}}},fetchTree:async()=>({truncated:false,tree:paths.map(path=>({path,sha:h}))}),
  fetchFile:async()=>({sha:h,content:'{"schema":"test"}'}),updateFile:async()=>{writes++;throw Error("NO_WRITE")}};
 const x=await verifyClicPdiHostReadiness({github});
 assert.equal(x.status,"READ_ONLY_LEDGER_READBACK_VERIFIED");
 assert.equal(x.ledger_blobs.length,2);assert.equal(x.host_persistence_verified,false);
 assert.equal(x.host_dispatch_verified,false);assert.equal(x.writes,0);assert.equal(writes,0);assert.equal(heads,2);
});
test("read-only host preflight fails closed on tampered tree, racing head and foreign scope",async()=>{
 const paths=["666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json",
  "666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json"];
 let calls=0;
 const github={readBranch:async()=>({commit:{sha:++calls===1?h:"b".repeat(40)}}),
  fetchTree:async()=>({truncated:false,tree:paths.map(path=>({path,sha:h}))}),
  fetchFile:async()=>({sha:h,content:'{"schema":"test"}'})};
 assert.equal((await verifyClicPdiHostReadiness({github})).reason,"CONCURRENT_HEAD_CHANGE");
 assert.equal((await verifyClicPdiHostReadiness({github,repository:"foreign/repo"})).status,"READBACK_PENDING");
 const altered={...github,readBranch:async()=>({commit:{sha:h}}),fetchTree:async()=>({truncated:false,tree:[]})};
 assert.match((await verifyClicPdiHostReadiness({github:altered})).reason,/LEDGER_TREE_BLOB_MISMATCH/);
});
