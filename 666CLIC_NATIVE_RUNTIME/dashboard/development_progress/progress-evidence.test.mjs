import test from "node:test";
import assert from "node:assert/strict";
import {renderProgress} from "./progress-evidence.mjs";
const base={status:"ACTIVE",authority:"666CLIC_REPO_CURRENT",source_revision:"abcdef",tasks:[{id:"A",status:"DONE",evidence:["git:abcdef"]},{id:"B",status:"OPEN"}]};
test("real 1/2 progress is 50 percent",()=>assert.deepEqual(renderProgress(base).percent,50));
test("inactive is invisible",()=>assert.equal(renderProgress({...base,status:"INACTIVE"}).visible,false));
test("no false done without evidence",()=>assert.equal(renderProgress({...base,tasks:[{id:"A",status:"DONE"}]}).visible,false));
test("duplicates are rejected",()=>assert.equal(renderProgress({...base,tasks:[{id:"A",status:"OPEN"},{id:"A",status:"OPEN"}]}).visible,false));
test("no task counts invented",()=>assert.equal(renderProgress({...base,tasks:[]}).visible,false));
