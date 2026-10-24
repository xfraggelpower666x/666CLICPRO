import fs from "node:fs";import crypto from "node:crypto";import zlib from "node:zlib";
const hex=b=>crypto.createHash("sha256").update(b).digest("hex");
export function assessRawLogo(buffer,expectedHash,expectedSize){
 if(!Buffer.isBuffer(buffer)||buffer.length===0)return{status:"WRITE_BLOCKED",reason:"MISSING_LIVE_BINARY_BYTES"};
 const digest=hex(buffer);
 return{status:digest===expectedHash&&buffer.length===expectedSize?"VERIFIED":"CONFLICT_QUARANTINE",sha256:digest,size_bytes:buffer.length,expected_sha256:expectedHash,expected_size_bytes:expectedSize};
}
export function validateArchiveEvidence(e={}){
 const required=["plugin_id","release_id","archive_sha256","logo_sha256","logo_size","expected_logo_sha256","expected_logo_size","provider_release_id"];
 const missing=required.filter(k=>e[k]===undefined||e[k]===null||e[k]==="NOT_VERIFIED");
 if(missing.length)return{status:"WRITE_BLOCKED",missing};
 if(e.release_id!==e.provider_release_id||e.logo_sha256!==e.expected_logo_sha256||e.logo_size!==e.expected_logo_size)return{status:"CONFLICT_QUARANTINE",reason:"PROVENANCE_OR_BINARY_MISMATCH"};
 return{status:"ARCHIVE_BINARY_PREFLIGHT_PASS",release_id:e.release_id,archive_sha256:e.archive_sha256};
}
if(process.argv[1]&&process.argv[1].endsWith("archive-preflight.mjs")&&process.argv[2]){
 const p=process.argv[2];const bytes=fs.readFileSync(p);console.log(JSON.stringify({archive_file:p,archive_size:bytes.length,archive_sha256:hex(bytes),logo_binary_verification:"REQUIRES_SAFE_ARCHIVE_MEMBER_EXTRACTION_AND_EXACT_PROVIDER_ATTESTATION"}));
}
