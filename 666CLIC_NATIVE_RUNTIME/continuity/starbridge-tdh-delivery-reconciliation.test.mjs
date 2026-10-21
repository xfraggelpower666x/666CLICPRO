import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const dir=new URL("../inbox/666TDH/receipts/",import.meta.url);
const raw=readFileSync(new URL("666TDH-CLIC-WHOLE-NET-20261018-R01-NATIVE-ORIGINAL.json",dir));
const rec=JSON.parse(raw.toString("utf8"));
const clic=JSON.parse(readFileSync(new URL("CLIC-STARBRIDGE-WHOLE-NET-666TDH-20261018-R01-DELIVERY-READBACK.json",dir),"utf8"));
const original=JSON.parse(readFileSync(new URL("../outbox/666TDH/CLIC-STARBRIDGE-WHOLE-NET-666TDH-20261018-R01.json",new URL("../",dir)),"utf8"));
test("source receipt must be exact 610-byte native original and SHA-256",()=>{
 assert.equal(raw.length,610);
 assert.equal(createHash("sha256").update(raw).digest("hex"),"987c49d4870fc101cb5e16c925df481c6a19a9bd3f62021f43d840e31c403451");
 assert.equal(clic.native_receipt.sha256,createHash("sha256").update(raw).digest("hex"));
});
test("outbox handoff and original TDH receipt are identically scoped",()=>{
 assert.equal(original.handoff_id,rec.handoff_id);
 assert.equal(original.target_system,"666TDH");
 assert.equal(clic.source_blob,"924acd02df1b94768d0545ef1fd4e8f606cbf502");
 assert.equal(clic.handoff_id,original.handoff_id);
 assert.equal(rec.source_file_blob,clic.source_blob);
 assert.equal(rec.target_release,"v1.15.0");
});
test("original self-reported pending gates are preserved and not rewritten",()=>{
 assert.equal(rec.clic_delivery_readback,"PENDING_EXTERNAL_CLIC");
 assert.equal(rec.pointer_readback,"PENDING");
 assert.equal(rec.host_proof,"OPEN_NOT_VERIFIED");
});
test("only TDH delivery is reconciled; adoption and host remain fail closed",()=>{
 assert.equal(clic.gates.delivery,"DELIVERED_EVIDENCED");
 assert.equal(clic.gates.native_review,"ACCEPTED_TARGET_NATIVE_REVIEW");
 assert.equal(clic.gates.adoption,"PARTIAL_NATIVE_ADOPTION_REPORTED_BY_TDH_NOT_INDEPENDENT_LIVE_HOST_ACCEPTANCE");
 assert.equal(clic.gates.host,"NOT_VERIFIED");
 assert.equal(clic.gates.automatic_transport,"NOT_VERIFIED");
 assert.equal(clic.network.delivered_evidenced,4);
 assert.equal(clic.network.total,7);
 assert.equal(clic.network.globally_verified_capability_adoption,0);
 assert.equal(clic.network.host_verified,0);
 assert.deepEqual(clic.network.remaining,["666CLS","666LINGUA","666MIRA"]);
});
test("independent TDH Drive provenance and custody identifiers are pinned",()=>{
 assert.equal(clic.native_receipt.provider_id,"1TLY_LilP9z1ISa5DrkkbDPkPbc_P7weS");
 assert.equal(clic.native_current.pointer_file_id,"1bCjIwSsyvhTnFudfPtEr71dss179AuYS");
 assert.equal(clic.native_current.return_handoff_id,"14R8FZMNljI4LJQkbU5wnO1KpdbmB4YfW");
 assert.equal(clic.pfs_copies.release_receipt_id,"1YGZETPC42ib0awApK1gdU2o_AHN3VgCA");
 assert.equal(clic.pfs_copies.backup_receipt_id,"124DIuk_z_MDxoFHNilCizazaRev2z6d2");
});
test("TDH keeps sovereign authority and original project safeguards",()=>{
 assert.equal(rec.authority_transfer,false);
 assert.equal(clic.guarantees.foreign_mutation,false);
 assert.equal(clic.guarantees.pdi_preserved,true);
 assert.equal(clic.guarantees.junior_preserved,true);
 assert.equal(clic.guarantees.pet_paused,true);
});
