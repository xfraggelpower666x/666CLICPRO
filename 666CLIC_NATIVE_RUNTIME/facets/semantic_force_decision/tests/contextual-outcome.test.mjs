import test from "node:test";
import assert from "node:assert/strict";
import {suggestOutcome} from "../src/contextual-outcome.mjs";
const base={nativeAuthorityVerified:true,currentReadback:"PASS"};
test("unverified authority is HOLD",()=>assert.equal(suggestOutcome({...base,nativeAuthorityVerified:false}).outcome,"HOLD"));
test("verified no-op is valid progress",()=>assert.equal(suggestOutcome({...base,goalAlreadySatisfied:true,materialDeltaVerified:false}).outcome,"COMPLETE_NO_CHANGE"));
test("uncertain evidence requires VERIFY",()=>assert.equal(suggestOutcome({...base,currentReadback:"PENDING"}).outcome,"VERIFY"));
test("verified regression produces advisory REPAIR only",()=>{const r=suggestOutcome({...base,regressionVerified:true,recoveryVerified:true});assert.equal(r.outcome,"REPAIR");assert.equal(r.execute,false)});
test("unverified hypothesis remains EXPLORE",()=>assert.equal(suggestOutcome({...base,changeHypothesis:true}).outcome,"EXPLORE"));
test("write candidate cannot bypass missing backup",()=>assert.equal(suggestOutcome({...base,writeRequested:true,userAuthorizedUpdate:true,lockVerified:true}).outcome,"HOLD"));

const opBase={...base,operationId:"CLIC_PDI_EVENT_1",operationOutcomes:[]};
test("denial is scoped to exact operation and cannot be bypassed by other success",()=>{
 const x=suggestOutcome({...opBase,operationOutcomes:[
 {operationId:"CLIC_PDI_EVENT_1",actionDenied:true},
 {operationId:"CLIC_STARBRIDGE_READ_2",currentReadback:"PASS",independentReadback:true,evidenceRef:"git/blob/abc"}]});
 assert.equal(x.outcome,"HOLD");assert.equal(x.reason,"OPERATION_LOCAL_DENIAL");
});
test("independent positive readback elsewhere does not imply operation authorization",()=>{
 const x=suggestOutcome({...opBase,writeRequested:true,operationOutcomes:[
 {operationId:"CLIC_STARBRIDGE_READ_2",currentReadback:"PASS",independentReadback:true,evidenceRef:"readback/2"}]});
 assert.equal(x.outcome,"HOLD");assert.equal(x.reason,"WRITE_GOVERNANCE_REQUIRED");
});
test("unverified host action is HOLD regardless of unrelated success",()=>{
 const x=suggestOutcome({...opBase,operationOutcomes:[
 {operationId:"CLIC_PDI_EVENT_1",hostActionRequested:true,hostAuthorityVerified:false},
 {operationId:"OTHER",independentReadback:true,currentReadback:"PASS",evidenceRef:"other"}]});
 assert.equal(x.reason,"HOST_AUTHORITY_NOT_VERIFIED");
});
test("successful same-operation readback is evidence, never execution authority",async()=>{
 const {assessOperationEvidence}=await import("../src/contextual-outcome.mjs");
 const x=assessOperationEvidence({...opBase,operationOutcomes:[
 {operationId:"CLIC_PDI_EVENT_1",currentReadback:"PASS",independentReadback:true,evidenceRef:"git/tree/verified"}]});
 assert.equal(x.status,"READBACK_VERIFIED");assert.equal(x.execute,false);
});
test("a denial does not contaminate a separate valid operation",async()=>{
 const {assessOperationEvidence}=await import("../src/contextual-outcome.mjs");
 const outcomes=[{operationId:"WRITE_A",permissionDenied:true},{operationId:"READ_B",currentReadback:"PASS",independentReadback:true,evidenceRef:"read-b"}];
 assert.equal(assessOperationEvidence({operationId:"WRITE_A",operationOutcomes:outcomes}).status,"DENIED");
 assert.equal(assessOperationEvidence({operationId:"READ_B",operationOutcomes:outcomes}).status,"READBACK_VERIFIED");
});
test("unverified claims do not produce positive outcome",async()=>{
 const {assessOperationEvidence}=await import("../src/contextual-outcome.mjs");
 assert.equal(assessOperationEvidence({...opBase,operationOutcomes:[{operationId:"CLIC_PDI_EVENT_1",currentReadback:"PASS",independentReadback:false}]}).status,"OPEN");
});

test("operation stage evidence never claims host or execution",async()=>{
 const {assessEvidenceStages}=await import("../src/contextual-outcome.mjs");
 const x=assessEvidenceStages({operationId:"MAIL_A",observations:[{operationId:"MAIL_A",sourceGrade:"DIRECT_PROVIDER",independentReadback:true,evidenceRef:"blob/one",storedContentReadback:true,targetParentVerified:true}]});
 assert.equal(x.status,"PARTIAL_EVIDENCE");assert.equal(x.storage,true);assert.equal(x.delivery,false);assert.equal(x.recipient,false);assert.equal(x.host,false);assert.equal(x.execute,false);
});
test("reported peer receipt does not become independent success",async()=>{
 const {assessEvidenceStages}=await import("../src/contextual-outcome.mjs");
 const x=assessEvidenceStages({operationId:"MAIL_A",observations:[{operationId:"MAIL_A",sourceGrade:"PEER_REPORTED",independentReadback:true,evidenceRef:"peer/one",storedContentReadback:true,targetParentVerified:true,deliveryReceiptVerified:true,recipientAcknowledgementVerified:true}]});
 assert.equal(x.status,"PARTIAL_EVIDENCE");assert.equal(x.storage,false);assert.equal(x.delivery,false);assert.equal(x.recipient,false);
});
test("separate operation successes never lift a denial",async()=>{
 const {assessEvidenceStages}=await import("../src/contextual-outcome.mjs");
 const x=assessEvidenceStages({operationId:"MAIL_A",observations:[{operationId:"MAIL_A",actionDenied:true},{operationId:"MAIL_B",sourceGrade:"DIRECT_PROVIDER",independentReadback:true,evidenceRef:"blob/b",storedContentReadback:true,targetParentVerified:true,deliveryReceiptVerified:true,recipientAcknowledgementVerified:true}]});
 assert.equal(x.status,"DENIED");assert.equal(x.storage,false);assert.equal(x.rootCause,"UNKNOWN");
});
test("contradictions remain observable despite independently read back stages",async()=>{
 const {assessEvidenceStages}=await import("../src/contextual-outcome.mjs");
 const x=assessEvidenceStages({operationId:"MAIL_A",observations:[{operationId:"MAIL_A",sourceGrade:"DIRECT_PROVIDER",independentReadback:true,evidenceRef:"blob/a",storedContentReadback:true,targetParentVerified:true,deliveryReceiptVerified:true,recipientAcknowledgementVerified:true,contradictionUnresolved:true}]});
 assert.equal(x.status,"CONTRADICTORY");assert.equal(x.storage,true);assert.equal(x.delivery,true);assert.equal(x.recipient,true);assert.equal(x.adoption,false);
});
test("independent evidence stages remain no-approval even when complete",async()=>{
 const {assessEvidenceStages}=await import("../src/contextual-outcome.mjs");
 const x=assessEvidenceStages({operationId:"MAIL_A",observations:[{operationId:"MAIL_A",sourceGrade:"DIRECT_PROVIDER",independentReadback:true,evidenceRef:"blob/a",storedContentReadback:true,targetParentVerified:true,deliveryReceiptVerified:true,recipientAcknowledgementVerified:true}]});
 assert.equal(x.status,"STAGES_VERIFIED");assert.equal(x.execute,false);assert.equal(x.host,false);assert.equal(x.adoption,false);
});
