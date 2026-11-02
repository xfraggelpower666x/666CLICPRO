import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSemanticBoundaryBatch as run} from './semantic-boundary-reader.mjs';
const base='a'.repeat(40),sha1='b'.repeat(40),sha2='c'.repeat(40);
const seq=[sha1,sha2];
const good=(sha,parent,path='666CLIC_NATIVE_RUNTIME/facets/semantic_force_decision/src/contextual-outcome.mjs')=>({sha,parents:[parent],paths:[path]});
const args={base,head:sha2,orderedShas:seq,limit:1};
test('bounded resume retains verified append-only entries',()=>{
 const a=run({...args,details:[good(sha1,base)]});
 assert.equal(a.status,'PARTIAL_CHECKPOINT');assert.equal(a.checkpoint.count,1);
 const b=run({...args,checkpoint:a.checkpoint,details:[good(sha2,sha1,'666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json')]});
 assert.equal(b.status,'CHAIN_COVERED_NOT_APPROVAL');assert.equal(b.checkpoint.count,2);
 assert.equal(b.approval_granted,false);assert.equal(b.checkpoint.entries[0].sha,sha1);
});
test('unknown is fail-closed',()=>{
 const r=run({...args,details:[good(sha1,base,'unrelated/new-runtime.mjs')]});
 assert.equal(r.status,'HOLD');assert.match(r.reason,/UNKNOWN/);
});
test('no partial batch commits on bad second detail',()=>{
 const r=run({...args,limit:2,details:[good(sha1,base),good(sha2,base)]});
 assert.equal(r.status,'HOLD');assert.equal(r.checkpoint,null);
});
test('tampered checkpoint is rejected',()=>{
 const first=run({...args,details:[good(sha1,base)]});
 const r=run({...args,checkpoint:{...first.checkpoint,last_sha:sha2},details:[good(sha2,sha1)]});
 assert.equal(r.status,'HOLD');
});
test('truncated file list and missing batch details fail',()=>{
 assert.equal(run({...args,details:[{...good(sha1,base),files_truncated:true}]}).status,'HOLD');
 assert.equal(run({...args,details:[]}).status,'HOLD');
});
test('duplicates and oversized batch fail',()=>{
 assert.equal(run({...args,orderedShas:[sha1,sha1],details:[good(sha1,base)]}).status,'HOLD');
 assert.equal(run({...args,limit:21,details:[good(sha1,base)]}).status,'HOLD');
});