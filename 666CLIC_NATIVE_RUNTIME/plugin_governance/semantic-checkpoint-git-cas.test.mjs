import test from 'node:test';
import assert from 'node:assert/strict';
import {appendIsolatedSemanticCheckpoint as append} from './semantic-checkpoint-git-cas.mjs';
const sh=n=>String(n).repeat(40),a=sh('a'),b=sh('b'),c=sh('c'),path='666CLIC_NATIVE_RUNTIME/plugin_governance/semantic_reader_checkpoints/';
const old={base:a,head:b,total:153,count:1,last_sha:c,entries:[{sha:c,parent:a,paths:['tests/a.test.mjs'],classes:['GOVERNANCE']}]};
const next={...old,count:2,last_sha:sh('d'),entries:[...old.entries,{sha:sh('d'),parent:c,paths:['tests/b.test.mjs'],classes:['GOVERNANCE']}]};
function mock(){return {readHead:async()=>a,readFile:async({path:p})=>p.endsWith('0001_2026-11-02.json')?{sha:b,content:JSON.stringify(old)}:null,readTreeSha:async()=>c,createTree:async()=>({sha:c}),createCommit:async()=>({sha:sh('d')}),updateRef:async()=>({success:true})}}
test('missing tools deny',async()=>assert.equal((await append({path:path+'153bridge_0002_2026-11-02.json',previousPath:path+'153bridge_0001_2026-11-02.json',previousBlob:b,record:next})).status,'WRITE_BLOCKED'));
test('no overwrite existing checkpoint',async()=>{let m=mock();m.readFile=async()=>({sha:b,content:JSON.stringify(old)});assert.equal((await append({github:m,path:path+'153bridge_0002_2026-11-02.json',previousPath:path+'153bridge_0001_2026-11-02.json',previousBlob:b,record:next})).status,'WRITE_BLOCKED')});
test('reject divergent append-only prefix',async()=>{let m=mock();let altered={...next,entries:[{...next.entries[0],sha:sh('f')},next.entries[1]]};assert.equal((await append({github:m,path:path+'153bridge_0002_2026-11-02.json',previousPath:path+'153bridge_0001_2026-11-02.json',previousBlob:b,record:altered})).status,'WRITE_BLOCKED')});
test('CAS conflict denies persistence',async()=>{let m=mock();m.updateRef=async()=>({success:false});assert.equal((await append({github:m,path:path+'153bridge_0002_2026-11-02.json',previousPath:path+'153bridge_0001_2026-11-02.json',previousBlob:b,record:next})).status,'WRITE_BLOCKED')});
