import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const net=JSON.parse(readFileSync(new URL("./STARBRIDGE_WHOLE_NETWORK_SUPERCODEFORGE_2026-10-18.json",import.meta.url),"utf8"));
test("no delivery promotion",()=>{assert.equal(net.targets.filter(x=>x.delivery==="DELIVERED_EVIDENCED").length,3);assert.equal(net.targets.filter(x=>x.adoption==="ADOPTED").length,0)});
test("all four receipts remain blocked",()=>{for(const id of ["666CLS","666LINGUA","666MIRA","666TDH"]){const t=net.targets.find(x=>x.system===id);assert.equal(t.delivery,"NOT_VERIFIED");assert.equal(t.receiver_reconciliation.native_receipt,"NOT_VERIFIED");assert.equal(t.receiver_reconciliation.receipt_path,"UNCONFIRMED");assert.equal(t.receiver_reconciliation.foreign_mutation,false);}});
test("no host claim",()=>{assert.equal(net.targets.filter(x=>x.host!=="NOT_VERIFIED").length,0);assert.equal(net.receiver_reconciliation.no_new_router,true)});
