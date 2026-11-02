import test from 'node:test';
import assert from 'node:assert/strict';
import {runBoundedSemanticGithubStep as run} from './semantic-boundary-host-adapter.mjs';
const base='a'.repeat(40),one='b'.repeat(40),two='c'.repeat(40);
const docs={
 [one]:{sha:one,parents:[{sha:base}],files:[{filename:'666CLIC_NATIVE_RUNTIME/facets/semantic_force_decision/src/contextual-outcome.mjs'}]},
 [two]:{sha:two,parents:[{sha:one}],files:[{filename:'666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json'}]}
};
function host(data=docs){let records=[];return {
 fetch:async({url})=>({result:{content:JSON.stringify(url.includes('/compare/')?{status:'ahead',total_commits:2,commits:[{sha:one},{sha:two}]}:data[url.split('/').pop()])}}),
 appendCheckpoint:async({record})=>{records.push(record);return {cas_accepted:true}},
 readCheckpoint:async()=>records.at(-1)}}
test('native path classes and append-only resume',async()=>{
 const h=host(),a=await run({...h,base,head:two,limit:1});
 assert.equal(a.status,'CHECKPOINT_READBACK_VERIFIED');assert.equal(a.checkpoint.entries[0].classes[0],'SEMANTIC');
 const b=await run({...h,base,head:two,limit:1,checkpoint:a.checkpoint});
 assert.equal(b.status,'CHAIN_COVERED_NOT_APPROVAL');assert.equal(b.checkpoint.entries[1].classes[0],'GOVERNANCE');
 assert.equal(b.approval_granted,false);
});
test('unknown paths fail closed',async()=>{const h=host({...docs,[one]:{...docs[one],files:[{filename:'unexpected/path.mjs'}]}});assert.match((await run({...h,base,head:two,limit:1})).reason,/UNKNOWN/)});
test('wrong parent fails closed',async()=>{const h=host({...docs,[one]:{...docs[one],parents:[{sha:two}]}});assert.equal((await run({...h,base,head:two,limit:1})).status,'HOLD')});
test('no persistence host is pending',async()=>{const h=host();assert.equal((await run({fetch:h.fetch,base,head:two,limit:1})).status,'READBACK_PENDING')});
test('independent readback mismatch is held',async()=>{const h=host();h.readCheckpoint=async()=>({count:99});assert.match((await run({...h,base,head:two,limit:1})).reason,/READBACK/)});
test('truncated changed-path inventory is held',async()=>{const h=host({...docs,[one]:{...docs[one],files:Array.from({length:300},()=>({filename:'tests/a.test.mjs'}))}});assert.equal((await run({...h,base,head:two,limit:1})).status,'HOLD')});
