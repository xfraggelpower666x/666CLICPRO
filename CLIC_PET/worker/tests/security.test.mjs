import {test} from "node:test";
import assert from "node:assert/strict";
import {canonicalEvent,verifyNativeEvent} from "../src/verified-events.mjs";
import {reserveBudgetedGitHubCall} from "../src/github-budget.mjs";
const base={actor:"CLIC",kind:"analysis",evidence_id:"known",source_revision:"a".repeat(40),parent_commit:"b".repeat(40),observed_at:"2026-10-09T00:00:00.000Z",expires_at:"2026-10-09T00:00:45.000Z",scope:"CLIC"};
test("unknown event actor rejected",()=>assert.throws(()=>canonicalEvent({...base,actor:"FOREIGN"})));
test("unknown event fields rejected",()=>assert.throws(()=>canonicalEvent({...base,secret:"x"})));
test("missing native signatures cannot verify",async()=>assert.equal(await verifyNativeEvent({event:base}),false));
test("budget reserve fails closed if not configured",async()=>{await assert.rejects(reserveBudgetedGitHubCall({}),/BUDGET_NOT_READY/)});
