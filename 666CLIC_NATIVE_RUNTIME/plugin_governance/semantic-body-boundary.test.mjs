import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyClicPath as classify,evaluateSemanticBoundary as evaluate} from './semantic-body-boundary.mjs';
const A='a'.repeat(40),B='b'.repeat(40),C='c'.repeat(40),D='d'.repeat(40);
const args=()=>({base:A,head:D,commits:[
 {sha:B,parent:A,paths:['666CLIC_NATIVE_RUNTIME/dashboard/visual-completion-guard.mjs']},
 {sha:C,parent:B,paths:['666CLIC_NATIVE_RUNTIME/plugin_governance/reconciliation.json']},
 {sha:D,parent:C,paths:['666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json']}],
 pluginSourceTree:A,liveSourceTree:A,binaryBinding:C,pluginSemanticClass:'VERIFIED_HYBRID_SNAPSHOT'});
test('semantic changes bound before governance and pointer tails',()=>{
 const x=evaluate(args());
 assert.equal(x.status,'BOUNDARY_VERIFIED_NOT_APPROVAL');
 assert.equal(x.semantic_body_head,B);
 assert.equal(x.governance_only_commits,2);
 assert.equal(x.approval_granted,false);
});
test('mixed semantic and pointer change is semantic, never swallowed',()=>{
 const a=args();a.commits[2].paths.push('666CLIC_NATIVE_RUNTIME/facets/semantic_visual_intelligence/SUB_REHYDRATION.md');
 const x=evaluate(a);
 assert.equal(x.semantic_body_head,D);
 assert.equal(x.semantic_commits,2);
});
test('incomplete chain, skipped commits and no changed paths fail closed',()=>{
 const a=args();a.commits.splice(1,1);
 assert.equal(evaluate(a).status,'WRITE_BLOCKED');
 const x=args();x.commits[1].paths=[];
 assert.ok(evaluate(x).failures.some(v=>v.startsWith('MISSING_CHANGED_PATHS')));
});
test('unknown scope and potential foreign mutations never silently become governance',()=>{
 const a=args();a.commits[1].paths=['unknown-project/SKILL.md'];
 assert.equal(classify('unknown-project/SKILL.md'),'UNKNOWN');
 assert.ok(evaluate(a).failures.some(v=>v.startsWith('UNCLASSIFIED_CHANGE')));
});
test('unreleased newer source and unresolved binary binding block approval',()=>{
 const a=args();a.pluginSourceTree=B;a.binaryBinding=null;a.pluginSemanticClass='UNRESOLVED';
 const x=evaluate(a);
 assert.equal(x.status,'WRITE_BLOCKED');
 assert.ok(x.failures.includes('CURRENT_SOURCE_NE_LIVE_PROVIDER'));
 assert.ok(x.failures.includes('CURRENT_RELEASE_BINARY_BINDING_UNRESOLVED'));
 assert.equal(x.semantic_body_head,null);
 assert.equal(x.approval_granted,false);
});
test('facets and continuity semantic; approval and pointer are governance',()=>{
 assert.equal(classify('666CLIC_NATIVE_RUNTIME/continuity/LIVE_CIRCLE.md'),'SEMANTIC');
 assert.equal(classify('666CLIC_NATIVE_RUNTIME/facets/card_intelligence/REGISTRY.json'),'SEMANTIC');
 assert.equal(classify('666clic-plugin/source/skills/666clic-dashboard/SKILL.md'),'SEMANTIC');
 assert.equal(classify('666clic-plugin/backup-circle/CLIC_PLUGIN_BACKUP_APPROVAL_CURRENT.json'),'GOVERNANCE');
 assert.equal(classify('666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json'),'GOVERNANCE');
 assert.equal(classify('666CLIC_NATIVE_RUNTIME/plugin_governance/semantic-body-boundary.mjs'),'GOVERNANCE');
});
