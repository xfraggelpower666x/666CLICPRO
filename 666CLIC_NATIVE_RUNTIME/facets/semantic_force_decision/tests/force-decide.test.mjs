import test from "node:test";
import assert from "node:assert/strict";
import {decideForce} from "../src/force-decide.mjs";
const request={direct_trigger:true,system:"666CLIC",authorized_update:true};
const current={head:"abc",pointer:"CURRENT_POINTER.json",readback:"PASS"};
test("direct native trigger is required",()=>assert.equal(decideForce({request:{},current}).status,"HOLD"));
test("current must be verified",()=>assert.equal(decideForce({request,current:{head:"abc"}}).status,"HOLD"));
test("foreign mutation remains blocked under FORCE",()=>{const r=decideForce({request,current,candidates:[{id:"foreign",foreign_mutation:true,source_verified:true}]});assert.equal(r.blocked[0].reasons[0],"FOREIGN_MUTATION_FORBIDDEN");});
test("a write requires lock, permission and backup",()=>{const r=decideForce({request,current,candidates:[{id:"write",write:true,source_verified:true}]});assert.equal(r.steps.length,0);});
test("newer valid evolution cannot silently rollback",()=>{const r=decideForce({request,current,candidates:[{id:"old",source_verified:true,superseded_valid_evolution:true}]});assert.equal(r.blocked[0].reasons[0],"NO_SILENT_ROLLBACK");});
test("safe strongly evidenced work ranks before weaker work",()=>{const r=decideForce({request,current,candidates:[{id:"weak",source_verified:true,evidence_strength:3,causal_impact:3,risk:2},{id:"strong",source_verified:true,evidence_strength:9,causal_impact:9,risk:1}]});assert.equal(r.steps[0].id,"strong");assert.equal(r.execution_authority,"NONE");});

test("operation denial cannot be bypassed by independent success",()=>{
 const ops=[{operationId:"WRITE_A",permissionDenied:true},{operationId:"READ_B",currentReadback:"PASS",independentReadback:true,evidenceRef:"git/blob"}];
 const x=decideForce({request,current,candidates:[{id:"write",source_verified:true,operation_id:"WRITE_A",operation_outcomes:ops},{id:"read",source_verified:true,operation_id:"READ_B",operation_outcomes:ops}]});
 assert.equal(x.blocked.length,1);assert.equal(x.blocked[0].id,"write");
 assert.ok(x.blocked[0].reasons.includes("OPERATION_LOCAL_DENIAL"));assert.equal(x.steps[0].operation_evidence,"READBACK_VERIFIED");
 assert.equal(x.execution_authority,"NONE");
});
test("missing host authority blocks only affected operation",()=>{
 const x=decideForce({request,current,candidates:[{id:"host",source_verified:true,operation_id:"HOST_A",operation_outcomes:[{operationId:"HOST_A",hostActionRequested:true,hostAuthorityVerified:false}]},{id:"read",source_verified:true,operation_id:"READ_B",operation_outcomes:[]}]});
 assert.ok(x.blocked[0].reasons.includes("OPERATION_HOST_AUTHORITY_UNVERIFIED"));assert.equal(x.steps.length,1);
});
test("legacy candidates retain behavior without operation evidence",()=>{
 const x=decideForce({request,current,candidates:[{id:"legacy",source_verified:true}]});
 assert.equal(x.status,"PLAN_READY");assert.equal(x.steps[0].id,"legacy");
 assert.equal(Object.hasOwn(x.steps[0],"operation_evidence"),false);
});
test("positive outcome cannot bypass foreign mutation",()=>{
 const x=decideForce({request,current,candidates:[{id:"foreign",foreign_mutation:true,source_verified:true,operation_id:"READ_B",operation_outcomes:[{operationId:"READ_B",currentReadback:"PASS",independentReadback:true,evidenceRef:"git"}]}]});
 assert.equal(x.steps.length,0);assert.ok(x.blocked[0].reasons.includes("FOREIGN_MUTATION_FORBIDDEN"));
});
