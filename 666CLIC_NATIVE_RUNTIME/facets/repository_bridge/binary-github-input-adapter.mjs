// Existing CLIC Repository Bridge input adapter, NOT a new bridge.
// A private provider archive must NEVER be put in a public repository.
import {createHash} from "node:crypto";
const hex=x=>createHash("sha256").update(x).digest("hex");
const blobSha=x=>createHash("sha1").update(Buffer.concat([Buffer.concat([Buffer.from("blob "+x.length),Buffer.from([0])]),x])).digest("hex");
const SHA=/^[a-f0-9]{64}$/i;
export function prepareClicBridgeBinaryInput({bytes,source,sourceVisibility,target,approval}={}){
 const errors=[];
 if(!Buffer.isBuffer(bytes)||!bytes.length)errors.push("ACTUAL_LOCAL_BYTES_REQUIRED");
 if(source!=="PLUGIN_CREATOR_ORIGINAL_ARCHIVE")errors.push("SOURCE_IDENTITY_NOT_VERIFIED");
 if(sourceVisibility!=="PRIVATE")errors.push("SOURCE_VISIBILITY_UNVERIFIED");
 if(!target||target.repository!=="xfraggelpower666x/666CLICPRO"||target.branch!=="clic-migration-rev79-staging"||
 target.path!=="666clic-plugin/binary-backups/v0.1.22/provider-original/workspace-plugin-p0fda2cg.tar.gz")errors.push("CLIC_SCOPE_ALLOWLIST_MISMATCH");
 // Current real GitHub visibility for CLICPRO is PUBLIC, so this block is mandatory.
 if(target?.visibility!=="PUBLIC")errors.push("TARGET_VISIBILITY_CONFLICT_WITH_VERIFIED_PUBLIC_CLIC_REPO");
 errors.push("PRIVATE_PLUGIN_ARCHIVE_TO_PUBLIC_REPO_FORBIDDEN");
 if(approval?.explicit_private_archive_transfer!==true||approval?.exact_target_approved!==true)errors.push("EXPLICIT_TRANSFER_APPROVAL_MISSING");
 if(approval?.current_provider_release!=="pluginrel_6ac6f4e703288191b8757f336d33e186")errors.push("PROVIDER_RELEASE_BINDING_MISSING");
 if(approval?.head_verified!==true||!/^([a-f0-9]{40})$/i.test(approval?.head??""))errors.push("REMOTE_HEAD_NOT_VERIFIED");
 if(!errors.length&&hex(bytes)!=="b465f4e3490106a41adc78c5780003cf3a4d2942d5bd9855680c7bba3c3398f6")errors.push("ORIGINAL_SHA256_MISMATCH");
 if(errors.length)return {status:"WRITE_BLOCKED",errors,bridge:"CLIC_NATIVE_REPOSITORY_BRIDGE",binary_written:false,base64_exposed:false};
 return {status:"READY_FOR_EXISTING_BRIDGE",bridge:"CLIC_NATIVE_REPOSITORY_BRIDGE",binary_written:false,
  request:{repository:target.repository,branch:target.branch,path:target.path,expected_head:approval.head,
  size_bytes:bytes.length,sha256:hex(bytes),git_blob_sha:blobSha(bytes),encoding:"base64",content:bytes.toString("base64")},
  required_transport:"create_blob->create_tree->create_commit->update_ref(NO_FORCE_EXPECTED_HEAD)->INDEPENDENT_REMOTE_BYTES_SHA256",
  caller_must_verify_head_before_ref:true,caller_must_verify_tree_blob_bytes:true};
}
