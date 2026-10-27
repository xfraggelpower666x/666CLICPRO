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
 assert.ok(evaluate(x).failures.some(v=>v.startsWith('EMPTY_PATHS_WITHOUT_INDEPENDENT_TREE_EQUALITY')));
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

test('authenticated no-op requires both parent and commit tree, preserving semantic body',()=>{
 const a=args(); a.commits[1].paths=[]; a.commits[1].tree=A; a.commits[1].parentTree=A;
 const x=evaluate(a);assert.equal(x.status,'BOUNDARY_VERIFIED_NOT_APPROVAL');assert.equal(x.semantic_body_head,B);
 const b=args();b.commits[1].paths=[];b.commits[1].tree=A;b.commits[1].parentTree=B;
 assert.ok(evaluate(b).failures.some(v=>v.startsWith('EMPTY_PATHS_WITHOUT_INDEPENDENT_TREE_EQUALITY')));
 const d=args();d.commits[1].paths=[];d.commits[1].tree=A;
 assert.equal(evaluate(d).status,'WRITE_BLOCKED');
});
test('relations and unpublished candidates remain semantic development, never provider parity',()=>{
 assert.equal(classify('666CLIC_NATIVE_RUNTIME/relations/LYVRA_UNDERSTANDING_CARD_REPO_CURRENT_2026-10-05.md'),'SEMANTIC');
 assert.equal(classify('666clic-plugin/candidates/patchfirst-visual-20261017/skills/666clic-dashboard/SKILL.md'),'SEMANTIC');
 assert.equal(classify('666clic-plugin/candidates/patchfirst-visual-20261017/PATCH_FIRST_CANDIDATE.json'),'GOVERNANCE');
 assert.equal(classify('666clic-plugin/candidates/unknown/skills/foo/SKILL.md'),'UNKNOWN');
 const a=args();a.commits[1].paths=['666clic-plugin/candidates/patchfirst-visual-20261017/skills/666clic-dashboard/SKILL.md'];
 a.pluginSourceTree=B;
 const x=evaluate(a);assert.equal(x.status,'WRITE_BLOCKED');assert.equal(x.semantic_body_candidate,C);
 assert.ok(x.failures.includes('CURRENT_SOURCE_NE_LIVE_PROVIDER'));assert.equal(x.plugin_published,false);
});
test('specific current fingerprint governance is nonsemantic without swallowing real current runtime',()=>{
 assert.equal(classify('666CLIC_NATIVE_RUNTIME/current/RUNTIME_PLUGIN_STATE_FINGERPRINT_APPROVAL_GOVERNANCE.md'),'GOVERNANCE');
 assert.equal(classify('666CLIC_NATIVE_RUNTIME/current/CURRENT_STATE.md'),'SEMANTIC');
 const a=args();a.commits[1].paths=['666CLIC_NATIVE_RUNTIME/current/RUNTIME_PLUGIN_STATE_FINGERPRINT_APPROVAL_GOVERNANCE.md'];
 assert.equal(evaluate(a).semantic_body_head,B);
 a.commits[1].paths.push('666CLIC_NATIVE_RUNTIME/current/CURRENT_STATE.md');
 assert.equal(evaluate(a).semantic_body_head,C);
});

test('independently read 35-commit PDI and SB05 suffix retains newest semantic candidate and blocks plugin fingerprint',async()=>{
 const fs=await import('node:fs');const {fileURLToPath}=await import('node:url');
 const {dirname,resolve}=await import('node:path');
 const p=resolve(dirname(fileURLToPath(import.meta.url)),'SEMANTIC_BOUNDARY_VERIFIED_SUFFIX_35_2026-10-18.json');
 const e=JSON.parse(fs.readFileSync(p,'utf8'));
 assert.equal(e.verified_ancestry_count,35);
 assert.equal(e.commits.length,35);
 assert.equal(e.commits[0].parent,e.base);
 assert.equal(e.commits.at(-1).sha,e.head);
 assert.ok(e.commits.some(c=>c.sha.startsWith('71c919ae')&&c.paths.some(p=>p.includes('parallel_development_intelligence/CURRENT_STATE'))));
 assert.ok(e.commits.some(c=>c.sha.startsWith('5c7cebdc')&&c.paths.some(p=>p.includes('starbridge-receipt-readback.mjs'))));
 assert.equal(classify('666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json'),'GOVERNANCE');
 const args={base:e.base,head:e.head,commits:e.commits,pluginSourceTree:e.repo_text_source_tree,
  liveSourceTree:e.live_text_source_tree,binaryBinding:e.current_binary_binding,
  pluginSemanticClass:e.plugin_semantic_class};
 const result=evaluate(args);
 assert.equal(result.status,'WRITE_BLOCKED');
 assert.equal(result.semantic_body_candidate,e.latest_semantic_candidate);
 assert.equal(result.semantic_body_head,null);
 assert.ok(result.failures.includes('CURRENT_SOURCE_NE_LIVE_PROVIDER'));
 assert.ok(result.failures.includes('CURRENT_RELEASE_BINARY_BINDING_UNRESOLVED'));
 assert.equal(result.approval_granted,false);
 assert.equal(result.plugin_published,false);
 const broken=structuredClone(args);broken.commits[19].parent='0'.repeat(40);
 assert.match(evaluate(broken).failures.join(','),/BROKEN_OR_MISSING_PARENT_CHAIN/);
 const erased=structuredClone(args);erased.commits[33].paths=[];
 assert.ok(evaluate(erased).failures.some(x=>x.startsWith('EMPTY_PATHS_WITHOUT_INDEPENDENT_TREE_EQUALITY')));
 const unknown=structuredClone(args);unknown.commits[33].paths=['unclassified/unknown-carrier'];
 assert.ok(evaluate(unknown).failures.some(x=>x.startsWith('UNCLASSIFIED_CHANGE')));
});

test('exact unpublished patch-first implementation is semantic candidate, not a provider release',()=>{
 const exact='666clic-plugin/candidates/patchfirst-visual-20261017/patchfirst-integrity-plan.mjs';
 assert.equal(classify(exact),'SEMANTIC');
 assert.equal(classify('666clic-plugin/candidates/patchfirst-visual-20261017/patchfirst-integrity-plan.test.mjs'),'GOVERNANCE');
 assert.equal(classify('666clic-plugin/candidates/patchfirst-visual-20261017/PATCH_FIRST_CANDIDATE.json'),'GOVERNANCE');
 assert.equal(classify('666clic-plugin/candidates/other/patchfirst-integrity-plan.mjs'),'UNKNOWN');
 const a=args();a.commits[1].paths=[exact];a.pluginSourceTree=B;a.binaryBinding=null;
 const v=evaluate(a);
 assert.equal(v.semantic_body_candidate,C);
 assert.equal(v.semantic_body_head,null);
 assert.equal(v.status,'WRITE_BLOCKED');
 assert.equal(v.plugin_published,false);
 assert.equal(v.approval_granted,false);
});
