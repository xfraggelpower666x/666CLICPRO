// Pure fail-closed gates: pre-publication and post-publication have distinct evidence.
export function evaluateReleaseGates(p={}, phase="PREPUBLISH") {
 if (!["PREPUBLISH","POSTPUBLISH"].includes(phase))return {allowed:false,decision:"WRITE_BLOCKED",missing:["INVALID_PHASE"]};
 const required=["pluginProviderReleaseId","repoCurrentReleaseId","archiveHash","logoHash","expectedLogoHash","binaryBackupVerified","sourceParityVerified","manifestValidated"];
 if(phase==="PREPUBLISH")required.push("hostCompatibilityPreflight");
 if(phase==="POSTPUBLISH")required.push("hostAcceptance","publishedReleaseReadback");
 const missing=required.filter(k=>p[k]===undefined||p[k]===null||p[k]===false||p[k]==="NOT_VERIFIED");
 if(p.pluginProviderReleaseId!==p.repoCurrentReleaseId)missing.push("RELEASE_ID_CONFLICT");
 if(p.logoHash!==p.expectedLogoHash)missing.push("LOGO_SHA256_MISMATCH_OR_UNKNOWN");
 if(p.foreignMutation===true)missing.push("FOREIGN_MUTATION_FORBIDDEN");
 return {allowed:missing.length===0,phase,decision:missing.length===0?"GATE_PASS":"WRITE_BLOCKED",missing:[...new Set(missing)]};
}
