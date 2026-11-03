// Existing CLIC patch-first candidate: deterministic allowlisted delta inspection.
// This plan is NOT a provider upload, an archive integrity receipt or native approval.
const allowed=["skills/666clic-continuity/SKILL.md","skills/666clic-dashboard/SKILL.md","skills/666clic-visual-interface/SKILL.md"];
const id="plugins_6abfb2e08fdc8191920dcdc4349c69c8";
const release="pluginrel_6ac6f4e703288191b8757f336d33e186";
const SHA=/^[a-f0-9]{40}$/i;
const deny=(reason)=>({status:"WRITE_BLOCKED",reason,delta_paths:[],provider_release_published:false,host_verified:false,native_approval:false});
export function inspectClicPatchFirstDelta({provider,candidate,proof}={}){
 const files=provider?.files,changes=candidate?.files;
 if(provider?.plugin_id!==id||provider?.release_id!==release||provider?.version!=="0.1.22"||
    provider?.scope!=="USER"||provider?.discoverability!=="PRIVATE")
  return deny("CURRENT_PROVIDER_RELEASE_CAS_MISMATCH");
 if(!Array.isArray(files)||files.length!==28||new Set(files).size!==28||
    !files.every(x=>typeof x==="string"&&x.length>0&&!x.startsWith("/")&&!x.includes("..")&&!x.includes("\\"))||
    !files.includes("assets/clic-logo.png"))
  return deny("INCOMPLETE_OR_UNSAFE_PROVIDER_INVENTORY");
 if(!Array.isArray(changes)||changes.length!==allowed.length||
    new Set(changes.map(x=>x?.path)).size!==allowed.length||
    !allowed.every(p=>changes.some(x=>x?.path===p))||
    changes.some(x=>!allowed.includes(x?.path)||!files.includes(x?.path)||!SHA.test(x?.source_blob??"")||
      !SHA.test(x?.candidate_blob??"")||x.source_blob!==x.candidate_blob||
      !SHA.test(x?.live_blob??"")||x.live_blob===x.source_blob))
  return deny("PATCH_DELTA_SOURCE_PROVIDER_PARITY_UNVERIFIED");
 if(proof?.provider_file_list_direct_readback!==true||proof?.source_and_candidate_blob_readback!==true||
    proof?.live_text_readback!==true||proof?.immutable_release_preserved!==true)
  return deny("INDEPENDENT_SOURCE_AND_PROVIDER_PROOF_REQUIRED");
 const untouched=files.filter(p=>!allowed.includes(p));
 if(untouched.length!==25||!untouched.includes("assets/clic-logo.png"))
  return deny("UNTOUCHED_PROVIDER_FILES_NOT_ACCOUNTED_FOR");
 const blockers=["CURRENT_ORIGINAL_PROVIDER_ARCHIVE_SHA256_REQUIRED",
  "CURRENT_LOGO_AND_28_FILE_BINARY_BINDING_REQUIRED",
  "CANONICAL_RUNTIME_PLUGIN_FINGERPRINT_REQUIRED",
  "EXPLICIT_CLIC_NATIVE_APPROVAL_REQUIRED",
  "EXPECTED_RELEASE_CAS_AT_PUBLISH_REQUIRED",
  "POSTPUBLISH_PROVIDER_AND_FRESH_HOST_READBACK_REQUIRED"];
 return {status:"PATCH_DELTA_SOURCE_READY_RELEASE_BLOCKED",
  target_plugin:id,base_release_id:release,expected_provider_file_count:28,
  delta_paths:[...allowed],untouched_provider_paths:untouched,
  original_logo_path:"assets/clic-logo.png",delete_paths:[],
  preservation:"OMITTED_PROVIDER_FILES_RETAINED_ONLY_IF_PROVIDER_OVERLAY_IS_INDEPENDENTLY_CONFIRMED",
  blockers,provider_release_published:false,host_verified:false,native_approval:false,
  transport:"EXISTING_PLUGIN_CREATOR_PATCH_FIRST_ONLY",foreign_mutations:false};
}
