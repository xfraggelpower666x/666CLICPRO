// 666CLIC CARD shared pure scan core, v1.0.0. No network, disk or mutable host operations.
export const CARD_SCHEMA = "666CLIC_CARD_V1";
export const CARD_COMMANDS = ["666CLIC CARD", "666CLIC CARD UPDATE", "666CLIC CARD AUDIT"];
const NON_EMPTY = v => typeof v === "string" && v.trim().length > 0;
const VALID_MODES = new Set(CARD_COMMANDS);
const VISUAL = new Set(["FULL","PARTIAL","LEGACY","UNKNOWN","BLOCKED"]);
const SAFE_KEYS = ["name","version","authority","relationships","facets","rehydration","livecircle","dashboard","daemon","visual_compliance","open_tasks","return_anchor"];
export function normalizeMode(trigger) {
  if (!VALID_MODES.has(trigger)) throw new Error("DIRECT_TRIGGER_REQUIRED");
  return trigger === "666CLIC CARD" ? "CARD" : trigger.endsWith(" UPDATE") ? "UPDATE" : "AUDIT";
}
export function checkSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return {ok:false,blocker:"MISSING_SNAPSHOT"};
  const must = ["system_id","authority","source_locator","source_revision","observed_at","readback_status"];
  const missing = must.filter(k => !NON_EMPTY(snapshot[k]));
  if (missing.length) return {ok:false,blocker:"MISSING_SOURCE_EVIDENCE",missing};
  if (!["PASS","VERIFIED"].includes(snapshot.readback_status)) return {ok:false,blocker:"SOURCE_READBACK_UNVERIFIED"};
  if (snapshot.source_revision === "SEARCH_RESULT" || snapshot.source_revision === "UNKNOWN") return {ok:false,blocker:"NOT_AUTHORITATIVE_CURRENT"};
  if (snapshot.authority_transfer === true || snapshot.foreign_mutation === true) return {ok:false,blocker:"AUTHORITY_BOUNDARY_VIOLATION"};
  return {ok:true};
}
export function compareCard(previous, snapshot) {
  const prior = previous && typeof previous === "object" ? previous : {};
  const delta = {};
  for (const key of SAFE_KEYS) {
    const before = Object.prototype.hasOwnProperty.call(prior,key) ? prior[key] : null;
    const after = Object.prototype.hasOwnProperty.call(snapshot,key) ? snapshot[key] : null;
    if (JSON.stringify(before) !== JSON.stringify(after)) delta[key] = {before,after};
  }
  return delta;
}
export function scanCard(snapshot, options = {}) {
  const scan_mode = normalizeMode(options.trigger || "666CLIC CARD");
  const validation = checkSnapshot(snapshot);
  if (!validation.ok) return {status:"HOLD",scan_mode,...validation,delivery:"NONE",card_updated:false};
  const previous = options.previous_card || null;
  const visual = VISUAL.has(snapshot.visual_compliance) ? snapshot.visual_compliance : "UNKNOWN";
  const delta = compareCard(previous,snapshot);
  const source = {system_id:snapshot.system_id,source_locator:snapshot.source_locator,source_revision:snapshot.source_revision,authority:snapshot.authority,observed_at:snapshot.observed_at};
  const evidence = Array.isArray(snapshot.evidence) ? snapshot.evidence.filter(x=>x&&NON_EMPTY(x.locator)&&NON_EMPTY(x.claim)&&NON_EMPTY(x.readback)) : [];
  const unknowns = [...new Set([...(Array.isArray(snapshot.unknowns)?snapshot.unknowns:[]),...(evidence.length?[]:["MISSING_ITEM_LEVEL_EVIDENCE"])])];
  const handoff_id = [snapshot.system_id,snapshot.source_revision,scan_mode].map(v=>String(v).replace(/[^a-zA-Z0-9_.-]/g,"_")).join("--");
  return {schema:CARD_SCHEMA,handoff_type:"666CLIC_CARD_ANALYSIS_HANDOFF",version:"1.0.0",handoff_id,source_system:snapshot.system_id,source_authority:snapshot.authority,source_revision:snapshot.source_revision,source_locator:snapshot.source_locator,observed_at:snapshot.observed_at,readback:snapshot.readback_status,scan_mode,evidence,unknowns,relationships:snapshot.relationships||[],card_delta:delta,visual_compliance:visual,return_anchor:snapshot.return_anchor||"CLIC_NATIVE_READBACK_AND_CARD_ADOPTION_REQUIRED",status:unknowns.length?"PARTIAL":"HANDOFF_READY",delivery:"PORTABLE_HANDOFF",authority_transfer:false,foreign_mutation:false,card_updated:false,source};
}
export function deliveryGate(handoff, permission) {
  if (!handoff || handoff.schema !== CARD_SCHEMA || handoff.authority_transfer !== false || handoff.foreign_mutation !== false) return {allowed:false,reason:"INVALID_HANDOFF"};
  if (!permission || permission.explicit_scan_trigger !== true || permission.clic_write_permission !== true || permission.source_head_revalidated !== true || permission.clic_head_revalidated !== true || permission.prechange_backup_verified !== true || permission.idempotency_checked !== true) return {allowed:false,reason:"PORTABLE_FALLBACK_REQUIRED"};
  return {allowed:true,mode:"AUTHORIZED_CLIC_INBOX_ONLY",status:"PENDING_TRANSPORT_AND_READBACK"};
}
export function acknowledgeDelivery(gate, receipt) {
  if (!gate?.allowed || receipt?.provider_readback !== "PASS" || !NON_EMPTY(receipt?.commit_sha)) return {delivery:"NOT_VERIFIED",card_updated:false};
  return {delivery:"DELIVERED_VERIFIED",receipt_commit:receipt.commit_sha,card_updated:false};
}
