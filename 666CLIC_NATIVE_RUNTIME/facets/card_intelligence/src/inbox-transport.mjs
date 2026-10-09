// Explicit injected adapter for CLIC-owned inbox transport. Never executes by import.
import {deliveryGate,acknowledgeDelivery} from "./card-scan.mjs";
const validId=s=>typeof s==="string" && /^[A-Za-z0-9_.-]{1,128}$/.test(s);
export function inboxPlan(handoff,permission={}) {
  const gate=deliveryGate(handoff,permission);
  if(!gate.allowed) return {status:"PORTABLE_FALLBACK",reason:gate.reason,payload:handoff||null,write:false};
  if(!validId(handoff.source_system)||!validId(handoff.handoff_id)) return {status:"CONFLICT_QUARANTINE",reason:"UNSAFE_INBOX_PATH",write:false};
  return {status:"READY_AUTHORIZED_TRANSPORT",write:false,repo:"xfraggelpower666x/666CLICPRO",current_path:`666CLIC_NATIVE_RUNTIME/inbox/${handoff.source_system}/CURRENT.json`,receipt_path:`666CLIC_NATIVE_RUNTIME/inbox/${handoff.source_system}/receipts/${handoff.handoff_id}.json`,handoff_id:handoff.handoff_id};
}
export async function submitToAuthorizedInbox(handoff,permission,adapter) {
  const plan=inboxPlan(handoff,permission);
  if(plan.status!=="READY_AUTHORIZED_TRANSPORT") return plan;
  // Adapter must be a caller-owned, authorization-scoped live GitHub connector wrapper.
  if(!adapter || typeof adapter.commitWithVerifiedBackup!=="function" || typeof adapter.readback!=="function") return {status:"PORTABLE_FALLBACK",reason:"NO_VERIFIED_TRANSPORT_ADAPTER",payload:handoff,write:false};
  const receipt=await adapter.commitWithVerifiedBackup({repository:plan.repo,path:plan.receipt_path,content:handoff,expectedClicHead:permission.clic_head,expectedSourceHead:handoff.source_revision,handoffId:handoff.handoff_id});
  if(!receipt || receipt.status!=="COMMITTED" || !receipt.commit_sha || receipt.backup_verified!==true || receipt.idempotency_pass!==true) return {status:"READBACK_PENDING",write:receipt?.status==="COMMITTED",card_updated:false};
  const verified=await adapter.readback({repository:plan.repo,path:plan.receipt_path,commit_sha:receipt.commit_sha});
  const accepted=acknowledgeDelivery({allowed:true},{provider_readback:verified?.matches_handoff===true&&verified?.commit_sha===receipt.commit_sha?"PASS":"PENDING",commit_sha:receipt.commit_sha});
  return {status:accepted.delivery,receipt_commit:accepted.receipt_commit||null,card_updated:false,write:true};
}
// CURRENT.json is a separate governed CLIC consumer action after a receipt is read back.
// Never overwrite an existing CURRENT.json from the foreign project scan adapter.
