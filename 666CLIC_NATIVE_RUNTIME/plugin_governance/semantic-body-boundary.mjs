// Existing CLIC runtime/plugin fingerprint governance: deterministic, fail-closed Git history boundary.
// Does not grant approval or publish a plugin; it classifies an independently fetched contiguous chain.
import {createHash} from 'node:crypto';
const SH=/^[a-f0-9]{40}$/i;
const norm=p=>typeof p==='string'&&!p.startsWith('/')&&!p.includes('..')&&!p.includes('\\\\')?p:null;
const isGovernance=p=>p==='666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json'
 ||p.startsWith('666CLIC_NATIVE_RUNTIME/plugin_governance/')
 ||p.startsWith('666CLIC_NATIVE_RUNTIME/recovery/')
 ||p.startsWith('666CLIC_NATIVE_RUNTIME/outbox/')
 ||p.startsWith('666CLIC_NATIVE_RUNTIME/inbox/')
 ||p.startsWith('666clic-plugin/backup-circle/')
 ||p.startsWith('666clic-plugin/binary-backups/')
 ||p.startsWith('666clic-plugin/releases/')
 ||p.startsWith('.github/workflows/')
 ||p.startsWith('tests/')
 ||p.endsWith('.test.mjs');
const isSemantic=p=>p.startsWith('666CLIC_NATIVE_RUNTIME/dashboard/')
 ||p.startsWith('666CLIC_NATIVE_RUNTIME/continuity/')
 ||p.startsWith('666CLIC_NATIVE_RUNTIME/facets/')
 ||p.startsWith('666CLIC_NATIVE_RUNTIME/current/')
 ||p.startsWith('666CLIC_NATIVE_RUNTIME/learning/')
 ||p.startsWith('666CLIC_NATIVE_RUNTIME/events/')
 ||p.startsWith('666clic-plugin/source/')
 ||p==='666clic-plugin/current/PLUGIN_CURRENT.json'
 ||p==='666CLIC_NATIVE_RUNTIME/REHYDRATION_MANIFEST.json';
export function classifyClicPath(path){
 const p=norm(path);
 if(!p)return 'UNKNOWN';
 if(isGovernance(p))return 'GOVERNANCE';
 if(isSemantic(p))return 'SEMANTIC';
 return 'UNKNOWN';
}
export function evaluateSemanticBoundary({base,head,commits,pluginSourceTree,liveSourceTree,binaryBinding,pluginSemanticClass}={}){
 const failures=[];
 if(!SH.test(base??'')||!SH.test(head??''))failures.push('INVALID_HEAD_OR_BASE');
 if(!Array.isArray(commits)||!commits.length)failures.push('NO_FULL_CONTIGUOUS_COMMIT_CHAIN');
 let parent=base,lastSemantic=null,semantic=0,governance=0;
 for(const [i,c] of (Array.isArray(commits)?commits:[]).entries()){
  if(!SH.test(c?.sha??'')||c?.parent!==parent)failures.push('BROKEN_OR_MISSING_PARENT_CHAIN_AT_'+i);
  if(!Array.isArray(c?.paths)||!c.paths.length)failures.push('MISSING_CHANGED_PATHS_AT_'+i);
  const classes=(Array.isArray(c?.paths)?c.paths:[]).map(classifyClicPath);
  if(classes.includes('UNKNOWN'))failures.push('UNCLASSIFIED_CHANGE_AT_'+i);
  if(classes.includes('SEMANTIC')){lastSemantic=c.sha;semantic++;}else if(classes.length&&!classes.includes('UNKNOWN'))governance++;
  parent=c?.sha;
 }
 if(parent!==head)failures.push('CHAIN_DOES_NOT_REACH_CURRENT_HEAD');
 if(!lastSemantic)failures.push('NO_SEMANTIC_BODY_COMMIT_VERIFIED');
 if(!SH.test(pluginSourceTree??'')||!SH.test(liveSourceTree??''))failures.push('TEXT_TREES_NOT_INDEPENDENTLY_BOUND');
 if(!SH.test(binaryBinding??''))failures.push('CURRENT_RELEASE_BINARY_BINDING_UNRESOLVED');
 if(!pluginSemanticClass||pluginSemanticClass==='UNRESOLVED')failures.push('PLUGIN_SEMANTIC_CLASS_UNRESOLVED');
 if(pluginSourceTree&&liveSourceTree&&pluginSourceTree!==liveSourceTree)failures.push('CURRENT_SOURCE_NE_LIVE_PROVIDER');
 const unique=[...new Set(failures)];
 return {status:unique.length?'WRITE_BLOCKED':'BOUNDARY_VERIFIED_NOT_APPROVAL',failures:unique,base,head,
  semantic_body_head:unique.length?null:lastSemantic,semantic_body_candidate:lastSemantic,
  semantic_commits:semantic,governance_only_commits:governance,
  historical_release_ne_current_runtime:pluginSourceTree!==liveSourceTree,
  approval_granted:false,plugin_published:false};
}
