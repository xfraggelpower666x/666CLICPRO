import {test} from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {canonicalEvent,verifyNativeEvent} from "../src/verified-events.mjs";
import {reserveBudgetedGitHubCall} from "../src/github-budget.mjs";
const now=Date.parse("2026-10-09T00:00:20.000Z");
const base={actor:"CLIC",kind:"analysis",evidence_id:"known",source_revision:"a".repeat(40),parent_commit:"b".repeat(40),observed_at:"2026-10-09T00:00:00.000Z",expires_at:"2026-10-09T00:00:45.000Z",scope:"CLIC"};
async function signed(ev=base, actor="CLIC"){
const keys=await webcrypto.subtle.generateKey("Ed25519",true,["sign","verify"]);
const signature=await webcrypto.subtle.sign("Ed25519",keys.privateKey,new TextEncoder().encode(canonicalEvent(ev)));
return {envelope:{algorithm:"Ed25519",key_id:"native-test-key",signature:Buffer.from(signature).toString("base64"),event:ev},keys:new Map([["native-test-key",{key:keys.publicKey,actor,scope:"CLIC"}]])};
}
const context=(keys)=>({keys,expectedSourceRevision:base.source_revision,expectedParentCommit:base.parent_commit,now,cryptoApi:webcrypto});
test("canonical field order stable",()=>assert.equal(JSON.parse(canonicalEvent({...base})).actor,"CLIC"));
test("unknown event actor rejected",()=>assert.throws(()=>canonicalEvent({...base,actor:"FOREIGN"})));
test("unknown event fields rejected",()=>assert.throws(()=>canonicalEvent({...base,secret:"x"})));
test("valid signed native CLIC event accepted",async()=>{const {envelope,keys}=await signed();assert.equal(await verifyNativeEvent(envelope,context(keys)),true)});
test("tampered payload rejected",async()=>{const {envelope,keys}=await signed();envelope.event={...base,evidence_id:"altered"};assert.equal(await verifyNativeEvent(envelope,context(keys)),false)});
test("wrong parent SHA rejected",async()=>{const {envelope,keys}=await signed();assert.equal(await verifyNativeEvent(envelope,{...context(keys),expectedParentCommit:"c".repeat(40)}),false)});
test("expired signature rejected",async()=>{const {envelope,keys}=await signed();assert.equal(await verifyNativeEvent(envelope,{...context(keys),now:now+100000}),false)});
test("native actor key isolation",async()=>{const {envelope,keys}=await signed(base,"JUNIOR");assert.equal(await verifyNativeEvent(envelope,context(keys)),false)});
test("missing native signatures cannot verify",async()=>assert.equal(await verifyNativeEvent({event:base}),false));
test("budget reserve fails closed if not configured",async()=>await assert.rejects(reserveBudgetedGitHubCall({}),/BUDGET_NOT_READY/));
