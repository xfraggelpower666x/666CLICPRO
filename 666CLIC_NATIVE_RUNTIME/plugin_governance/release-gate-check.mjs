// Release gate evaluation is pure, fail-closed, no side effects.
export function evaluateReleaseGates(p={}) {
 const fields=["pluginProviderReleaseId","repoCurrentReleaseId","archiveHash","logoHash","expectedLogoHash","binaryBackupVerified","sourceParityVerified","manifestValidated","hostAcceptance"];
 const missing=fields.filter(k=>p[k]===undefined||p[k]===null||p[k]===false||p[k]==="NOT_VERIFIED");
 if (p.pluginProviderReleaseId!==p.repoCurrentReleaseId) missing.push("RELEASE_ID_CONFLICT");
 if(p.logoHash!==p.expectedLogoHash)missing.push("LOGO_SHA256_MISMATCH_OR_UNKNOWN");
 if(p.foreignMutation===true)missing.push("FOREIGN_MUTATION_FORBIDDEN");
 return {allowed:missing.length===0,decision:missing.length===0?"READY_FOR_GOVERNED_RELEASE":"WRITE_BLOCKED",missing:[...new Set(missing)]};
}
