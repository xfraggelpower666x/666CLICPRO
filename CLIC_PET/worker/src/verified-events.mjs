// Candidate verification utility: trusted keys must be injected by the native CLIC owner.
// NO producer/ingestion endpoint. This module never signs or publishes events.
const fields=["actor","kind","evidence_id","source_revision","parent_commit","observed_at","expires_at","scope"];
export function canonicalEvent(event) {
 if(!event||typeof event!=="object"||Array.isArray(event))throw Error("EVENT_INVALID");
 if(Object.keys(event).some(x=>!fields.includes(x)))throw Error("EVENT_UNEXPECTED_FIELD");
 for(const x of fields)if(typeof event[x]!=="string"||!event[x]||event[x].length>180)throw Error("EVENT_FIELD_INVALID:"+x);
 if(!["CLIC","JUNIOR","JOINT"].includes(event.actor))throw Error("ACTOR_INVALID");
 if(!/^[a-f0-9]{40}$/.test(event.source_revision)|| !/^[a-f0-9]{40}$/.test(event.parent_commit))throw Error("REVISION_INVALID");
 return JSON.stringify(Object.fromEntries(fields.map(k=>[k,event[k]])));
}
export async function verifyNativeEvent(envelope,{keys,expectedSourceRevision,expectedParentCommit,now=Date.now(),cryptoApi=crypto}={}) {
 try{
  if(!keys||!(keys instanceof Map)||!envelope||envelope.algorithm!=="Ed25519"||typeof envelope.key_id!=="string"||typeof envelope.signature!=="string")return false;
  const key=keys.get(envelope.key_id);if(!key)return false;
  const bytes=new TextEncoder().encode(canonicalEvent(envelope.event));
  const evt=envelope.event;
  if(!expectedSourceRevision||!expectedParentCommit||evt.source_revision!==expectedSourceRevision||evt.parent_commit!==expectedParentCommit)return false;
  const from=Date.parse(evt.observed_at),until=Date.parse(evt.expires_at);
  if(!Number.isFinite(from)||!Number.isFinite(until)||from>now||until<=now||until-from>60000)return false;
  const sig=Uint8Array.from(atob(envelope.signature),c=>c.charCodeAt(0));
  if(sig.length!==64)return false;
  return await cryptoApi.subtle.verify("Ed25519",key,sig,bytes);
 }catch{return false;}
}
