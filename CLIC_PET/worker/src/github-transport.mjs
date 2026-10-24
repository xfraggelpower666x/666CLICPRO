// Only outbound REST boundary for a future native PET Github producer.
// Source-only candidate. No worker route calls this until owner-approved authority binding.
import {reserveBudgetedGitHubCall,recordGitHubCooldown} from "./github-budget.mjs";
export async function budgetedGitHubRead(env, resource, {fetchImpl=fetch, headers={}}={}) {
 if(!env||env.CLIC_PET_BUDGET_ACTIVE!=="true")throw Error("NATIVE_PRODUCER_NOT_CONNECTED");
 if(typeof resource!=="string")throw Error("INVALID_RESOURCE");
 const url=new URL(resource);
 if(url.protocol!=="https:"||url.hostname!=="api.github.com"||url.port||url.username||url.password||url.hash)throw Error("NON_GITHUB_API_TARGET");
 if(!url.pathname.startsWith("/repos/"))throw Error("GITHUB_SCOPE_REJECTED");
 // Path segments may only contain ordinary repository names; reject authority switches.
 const parts=url.pathname.split("/").filter(Boolean);
 if(parts.length<4||parts[0]!=="repos"||!parts[1]||!parts[2])throw Error("GITHUB_SCOPE_REJECTED");
 const expected=env.CLIC_PET_ALLOWED_REPOSITORY;
 if(!expected||expected!==parts[1]+"/"+parts[2])throw Error("REPOSITORY_NOT_AUTHORIZED");
 if(typeof fetchImpl!=="function")throw Error("FETCH_PROVIDER_MISSING");
 await reserveBudgetedGitHubCall(env); // A reservation is a request attempt, not proof of an HTTP response.
 const response=await fetchImpl(url.toString(),{method:"GET",headers,redirect:"manual"});
 await recordGitHubCooldown(env,response); // Fail closed if remote rate-limit cooldown cannot be recorded.
 // No automatic redirects to another origin; caller evaluates status 3xx.
 return response;
}
