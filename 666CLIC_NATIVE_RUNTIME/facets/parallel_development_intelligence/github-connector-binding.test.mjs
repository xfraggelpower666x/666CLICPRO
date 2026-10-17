import test from "node:test";
import assert from "node:assert/strict";
import {bindClicNativeGithubTools} from "../../dashboard/development_progress/github-connector-binding.mjs";
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
