import test from "node:test";import assert from "node:assert/strict";import crypto from "node:crypto";import {assessRawLogo,validateArchiveEvidence} from "./archive-preflight.mjs";
const logo=Buffer.from("fixture");const hash=crypto.createHash("sha256").update(logo).digest("hex");
test("binary checksum exact",()=>assert.equal(assessRawLogo(logo,hash,logo.length).status,"VERIFIED"));
test("wrong checksum blocked",()=>assert.equal(assessRawLogo(logo,"0".repeat(64),logo.length).status,"CONFLICT_QUARANTINE"));
test("missing bytes blocked",()=>assert.equal(assessRawLogo(null,hash,logo.length).status,"WRITE_BLOCKED"));
test("metadata-only evidence blocked",()=>assert.equal(validateArchiveEvidence({release_id:"r"}).status,"WRITE_BLOCKED"));
test("release supersession conflict quarantined",()=>assert.equal(validateArchiveEvidence({plugin_id:"p",release_id:"old",provider_release_id:"new",archive_sha256:hash,logo_sha256:hash,logo_size:logo.length,expected_logo_sha256:hash,expected_logo_size:logo.length}).status,"CONFLICT_QUARANTINE"));
