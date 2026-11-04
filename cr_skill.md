# cr_skill.md — Build Agent prompt: change request summary skill served over MCP

Paste **Prompt 1** into Build Agent in a fresh conversation. It is self-contained: it includes the full prompt bodies, so there is no follow-up "you left the prompts short" round trip.

Change the app name, instance-specific role names and provider if your target differs. Everything else is tested as written.

---

## Prompt 1 — create the app, the skill, and the MCP plumbing

```
Create a new ServiceNow application named "LF CR Summary Fluent".

IMPORTANT about scope: the SDK derives the scope string from the app name and
ignores any scope I ask for. Create the app, then read now.config.json and tell
me the actual derived scope before you write any other code. Do not try to
rename or re-point the scope afterwards; it is immutable. If the derived scope
is unusable, stop and ask me.

In this app, create ONE Now Assist skill using NowAssistSkillConfig. Do not use
sn_generative_ai.LLMClient, Script Includes, GlideAjax or any other direct LLM
call. Put the file in src/fluent/now-assist-skills/.

Skill name: "LF CR Summary Fluent" (match the app name).
Short description: "Summarizes a change request from plain text fields"
Description: "Summarizes a change request from plain text fields so it can be served as an MCP tool."

INPUTS - six, all dataType string, none mandatory, EVERY input must have a
description. Descriptions are not optional decoration: they become the MCP
tool's input schema docs, which is all the calling LLM sees.
Do not use glide_record inputs - getToolInputs() has no mapping for that type,
so it silently degrades to string and the prompt receives unusable text.
Keep every input to something a calling LLM can actually type. It cannot invent
a 32-character sys_id.
1. "short description" - Short description of the change request
2. "description" - Full description of the change request
3. "priority" - Priority of the change request
4. "state" - Current state of the change request
5. "activities" - Comments and work notes from the change request, as plain text
6. "other details" - Any other change request details such as risk, plan, back out plan, conflicts, policies, incidents, affected CIs and impacted services, as plain text

Populate testValues on every input from a real change request on the instance -
query for one that has short_description, description, implementation_plan,
test_plan, backout_plan and justification populated. No placeholder text.

SECURITY
- userAccess: type roles, roles ["itil"]
- Then check whether the table sys_agent_access_role_mapping exists. If it does,
  set roleMap: ["itil"]. If it does not, look up the itil role sys_id and set
  roleRestrictions to that sys_id instead. Tell me which one you used.
- roleMap must list every role the caller actually relies on, EXPLICITLY. Role
  masking during skill execution does not reliably resolve inherited roles. If
  I will be invoking this as admin (whose itil is usually inherited, not
  directly granted), include "admin" in roleMap as well, and tell me you did.
  Getting this wrong produces an intermittent 403 "Failed API level ACL
  Validation" that looks like random instance flakiness.

PROVIDER
Query the instance for the approved Azure OpenAI Chat Completions provider
mapping and its available models. Filter models on active=true,
lifecycle_state=active, usage_mode != restricted and
availability_at_instance=1. Also check sys_gen_ai_routing_selection and
sys_gen_ai_provider_routing for a steward-approved provider list; if both are
empty, say so and pick a model from the filtered list, telling me which and why.
Use providerAPI type sys_hub_flow with the mapping's provider_implementation id.
Set maxTokens 2000 and temperature 0.

Note on temperature: the SDK treats temperature 0 as unset and writes the
default 0.2. Still set 0 in source, but tell me in your summary that the
deployed value is 0.2 and that it can only be set to 0 by hand in Skill Kit.

PROMPTS - four, each with exactly one version, all promptState 'draft'.
Use the input placeholders {{short_description}}, {{description}},
{{priority}}, {{state}}, {{activities}}, {{other_details}}.

- "Change summarization Full" - no filterCondition (this is the default route)
- "Change summarization Assess and Authorize" - filterCondition { state: "Assess" }
- "Change summarization Implement and Review" - filterCondition { state: "Implement" }
- "Change summarization Closed" - filterCondition { state: "Closed" }

HOW TO WRITE THE PROMPTS IN THE FLUENT FILE
Fluent .now.ts files reject normal TypeScript. All of these fail the build:
  - type annotations, e.g. (sections: string[]): string
  - spread, e.g. [HEADER, ...sections, FOOTER]
  - concatenation in a const initializer, e.g. const P = A + '\n' + B
So write each of the four prompts as ONE single template literal assigned to its
own const. Do not factor out shared sections into helpers or build them by
concatenation. Accept the duplication.

The exact prompt bodies are below. Use them verbatim. Do not shorten,
paraphrase, or replace them with a 4-section Role/Context/Instructions/Output
structure - the output contract here is a fixed JSON section map and the build
does not enforce that structure.

--- PROMPT BODY: "Change summarization Full" ---
You are given all the details for a change request as plain text.

Short description: {{short_description}}
Description: {{description}}
Priority: {{priority}}
State: {{state}}
Other details (may include scheduling conflicts, applied change policies, incidents caused by the change, affected configuration items, impacted services, close code and close notes): {{other_details}}
Activity stream (comments and work notes with dates): {{activities}}

Summarize every detail mentioned above, as requested in the following sections:
- Objective
In the Objective section, offer a paragraph summarizing basic details of the change request and additionally give justification if available.
- Plan
The plan section provides a paragraph with emphasis on implementation plan, including test plan and back out plan for the change request.
- Close notes
Only if the state is Closed or close notes are given: a succinct paragraph summarizing the final outcome of the change request based on the close code and close notes. Otherwise return N/A.
- Risk
Firstly, only from the given information, explain in a paragraph the risk involved in the implementation of this change request. Secondly, check the scheduling conflict information: 1. If there is none, say that "The conflict status of this change request is <conflict status>" using the status if given, otherwise N/A. 2. If there is too much conflict information, say that "There is too much information on conflicts to be shown." 3. If conflict information is available, state the conflict count as "<Conflict count> conflicts are associated with this change request" and mention a few types of conflicts.
- Incidents caused by change
If incidents caused by this change are given, state "<count> incidents are caused by this change request." Otherwise return N/A.
- Applied policies
Only from the applied change policy information: state "<count> policies were applied to this change request." and add "The latest applied change policy is <policy name>, for which the action taken was <action taken>." Otherwise return N/A.
- Affected CIs
Only from the affected configuration item information, in one line: "<count> configuration items are affected," and then mention only up to three of them. Otherwise return N/A.
- Impacted services
Only from the impacted service information, in one line: "<count> services are impacted," and then mention only up to three of them. Otherwise return N/A.

Only use the provided information and generate content only for the sections listed above. Make sure to always respond with full sentences and to include all details and entities mentioned. Do not generate any information which is not provided. If you are not absolutely sure, return N/A for that section. DO NOT GENERATE ANY EXPLANATION, REASONING, COMMENTARY OR DESCRIPTION ABOUT THE SUMMARY.
Ensure that the final output is a single valid JSON object, not multiple JSON snippets.

{<section_name>: <section_details>}

--- PROMPT BODY: "Change summarization Assess and Authorize" ---
Same header and footer as Full. Keep only these sections, with identical
wording to Full: Objective, Plan, Risk, Affected CIs, Impacted services.

--- PROMPT BODY: "Change summarization Implement and Review" ---
Same header and footer as Full. Keep only these sections, with identical
wording to Full: Objective, Plan, Risk, Applied policies, Affected CIs,
Impacted services.

--- PROMPT BODY: "Change summarization Closed" ---
You are given all the details for a change request as plain text.

Short description: {{short_description}}
Description: {{description}}
Priority: {{priority}}
State: {{state}}
Other details (may include scheduling conflicts, applied change policies, incidents caused by the change, affected configuration items, impacted services, close code and close notes): {{other_details}}
Activity stream (comments and work notes with dates): {{activities}}

Summarize every detail mentioned above, as requested in the following sections:
- Objective
In the Objective section, offer a paragraph summarizing basic details of the change request and additionally give justification if available.
- Plan
The plan section provides a paragraph with emphasis on implementation plan, including test plan and back out plan for the change request.
- Close notes
The Close notes section provides a succinct paragraph summarizing the final outcome of the change request based on the close code and close notes. If not given, return N/A.
- Risk
Firstly, only from the given information, explain in a paragraph the risk involved in the implementation of this change request. Secondly, check the scheduling conflict information: 1. If there is none, say that "The conflict status of this change request is <Conflict status for change request>" using the status if given, otherwise N/A. 2. If there is too much conflict information, say that "There is too much information on conflicts to be shown." 3. If conflict information is available, display the conflict count as, "<Conflict count> conflicts are associated with this change request" and mention a few types of conflicts.
- Incidents caused by change
If incidents caused by this change are given, provide the count formatted as, "<Incidents Caused By Change count> incidents are caused by this change request." Otherwise return N/A.
- Applied policies
Only based on the applied change policy information, provide: "<Applied Change Policy count> policies were applied to this change request." and then "The latest applied change policy is <Applied change policy's name>, for which the action taken was <Action taken regarding this policy>." Otherwise return N/A.
- Affected CIs
Based on only the affected configuration item information, provide one line: "<Configuration items count> configuration items are affected," and then mention only up to three of them. Otherwise return N/A.
- Impacted services
Based on only the impacted service information, provide one line: "<Services count> services are impacted," and then mention only up to three of them. Otherwise return N/A.

Only use the provided information and generate content only for the sections listed above. Make sure to always respond with full sentences and to include all details and entities mentioned. Do not generate any information which is not provided. If you are not absolutely sure, return N/A for that section. DO NOT GENERATE ANY EXPLANATION, REASONING, COMMENTARY OR DESCRIPTION ABOUT THE SUMMARY.
Ensure that the final output is a single valid JSON object, not multiple JSON snippets.

{<section_name>: <section_details>}

--- END PROMPT BODIES ---

DEPLOYMENT
No deploymentSettings. No UI Action, no Otto Panel, no Flow Action - this skill
is for MCP only.

Build and install to this instance only. Do not deploy anywhere else.

AFTER INSTALL, verify by querying - do not just report success:
- sys_generative_ai_config rows for the definition: four, correct names, full
  prompt text, model, max_tokens
- sys_generative_ai_prompt_config rows: one with is_default=1 and no
  filter_properties, three with filter_properties
  {"{{state}}":"Assess"} / "Implement" / "Closed"
- the role mapping row in sys_agent_access_role_mapping (or
  sys_agent_access_role_configuration if you used roleRestrictions)
Then give me the Skill Kit URL.
```

---

## Prompt 2 — MCP tool and server

Send after the install is verified and after you have finalized + published the four prompts in Skill Kit and turned the skill on in AI Admin Hub.

```
The skill is published and turned on. Now create the MCP tool and server as
records. Do not tell me to use the MCP Server Console wizard - the record path
works and I have verified it.

First confirm the skill is actually visible to the MCP tool picker by running:
  new sn_mcp_server.AISkillToolCategoryImp().getArtifacts()
and finding my skill in the result. Do not check
sn_nowassist_skill_config.active - that column stays 0 even for a published,
turned-on skill.

getArtifacts() applies three gates. If my skill is missing, tell me which one
it failed:
  1. workflow !== 'Platform'
  2. active === 'true' - derived from state=1 (published), not the column
  3. not listed in sn_mcp_server_skill_config_exclude - a hand-curated block
     list of ~27 OOB skills that take platform-populated inputs (sysid,
     tablename, json_object blobs). Published and active is not enough; if a
     skill is on this list it will never appear in the picker.

Then read the derived tool inputs with:
  new sn_mcp_server.AISkillToolCategoryImp().getToolInputs('<skill_config_sys_id>')
and mirror exactly what it returns.

Create:

1. sn_mcp_tool_definition
   - name: "<scope>.summarize_change_request"
   - label: "Summarize change request"
   - description: a clear tool description for an LLM caller - say that it takes
     the change request fields as plain text and returns a single JSON object
     whose sections vary by state
   - tool_category: the AI skill category from
     sn_mcp_tool_category_defn_metadata where category_name=ai_skill
   - tool_artifact_id: the sn_nowassist_skill_config sys_id (NOT the
     sys_one_extend_capability sys_id)
   - source: custom, active: true

2. sn_mcp_tool_input_defn - one row per input, type string, required false,
   active true, with the description from the skill input. Plus the two
   execution metadata inputs exactly as getToolInputs returns them:
   configFilters and definitionFilters, each type string, required false,
   static_value true, category execution_metadata. Do not skip these - they are
   how a client pins a specific prompt.

3. sn_mcp_server_registry
   - name: "<scope>.lf_cr_summary"
   - label: "LF CR Summary MCP Server"
   - short_description: one line
   - source: custom, status: active
   - url: <instance url>/sncapps/mcp-server/mcp/<name with dots replaced by underscores>

4. sn_mcp_server_tool_definition_assoc
   - mcp_server, tool_definition, enabled: true, visibility: model_app

Make the script idempotent - check for an existing row before each insert.

Then verify and report: the tool with its inputs, the server with added_tools,
the association, and the final MCP endpoint URL. Also tell me the exact field
values I need for the OAuth client, including which redirect URL goes with
which MCP client.

For the OAuth client, the field values must include the scope restriction. The
default is "Securely scoped" (restricted), which only permits APIs matching the
client's auth scopes - and if mcp_auth_scopes is empty on the instance there
are none, so every call fails with 403 "Access to unscoped api is not allowed".
Check mcp_auth_scopes and oauth_entity_scope, and if they are empty tell me to
set the scope restriction to "Useraccount scoped" (useraccount).

Also tell me: Client ID is a mandatory free-text field, not auto-generated. The
client secret is encrypted at rest, so it can only be read from the form, not
from a query.
```

---

## Prompt 3 — end-to-end MCP test

```
Test the MCP endpoint with curl and show me raw responses.

Ask me for the client secret, a username and a password before running
anything. The user must hold the itil role DIRECTLY, not by inheritance.

1. Get a token from /oauth_token.do with grant_type=password, client_id,
   client_secret, username, password. If there is no access_token in the
   response, stop and show me the full error body.

2. POST tools/list to the MCP endpoint with:
     Authorization: Bearer <token>
     Content-Type: application/json
     Accept: application/json, text/event-stream
   Body: {"jsonrpc":"2.0","id":1,"method":"tools/list"}

3. POST tools/call three times, changing only the state argument to "Assess",
   then "Implement", then "Closed". Supply all six string inputs with
   realistic change request text, including conflict, policy, CI, service,
   close code and close note details in other_details.

Expected section keys:
  Assess:    Objective, Plan, Risk, Affected CIs, Impacted services
  Implement: the above plus Applied policies
  Closed:    all eight, including Close notes and Incidents caused by change

Handling notes:
- Responses are SSE. They may begin with a comment line like
  ": ping - 2026-11-04 04:08:21.919800+00:00". Ignore lines starting with ":".
- Report the attempt count per call. Every call should succeed on the FIRST
  attempt. If any needs a retry, that is a real defect - do not paper over it
  with a retry loop. Report it and stop.
- A 403 "Access to unscoped api is not allowed" means the OAuth client scope
  restriction is wrong, not a role problem.
- A 403 "Failed API level ACL Validation" means a role the caller relies on is
  missing from the skill's roleMap - most likely an inherited role that needs
  to be listed explicitly.
- Never echo my password or client secret.

Print the raw body for every call, then a table of state vs attempts vs
section keys returned.
```

---

## Manual steps — Build Agent cannot do these

Do them in this order. Roughly 10 minutes.

### Step A — Finalize and publish the prompts (after Prompt 1)

1. Open the Skill Kit URL the agent gave you.
2. Set the **current application** to your app — pick it by its **name**, not the scope string.
3. For each of the four prompts: **Finalize**, then **Finalize prompt**.
4. **Publish skill** → tick all four prompts → **Publish**.

Check: all four `sys_generative_ai_config` rows should be `state=published`, `active=1`.

### Step B — Turn the skill on (after Step A)

`https://YOUR_INSTANCE.service-now.com/now/now-assist-admin/home`

AI Admin Hub → **AI Skills** → family **Other** → **Available** → your skill → **Turn on**.

Without this the skill never reaches the MCP tool picker. Do not verify by reading `sn_nowassist_skill_config.active` — it stays `0`. Use `getArtifacts()`.

### Step C — MCP tool and server

Send **Prompt 2**. The agent creates the records.

If you prefer the UI: MCP Server Console (current application **Global**) → **Tools** → Create tool → Now Assist skill → pick the skill → Create. Then **Servers** → Create server → **Add tools**. In that dialog, search so **at least two rows** show and tick only yours — ticking the header "select all", or filtering down to a single row, adds every tool on the instance.

### Step D — OAuth client

**All → System OAuth → Application Registry → New → Create an OAuth API endpoint for external clients**

| Field | Value |
|---|---|
| Name | `LF CR MCP Client` |
| Client ID | `lf_cr_mcp_client` — mandatory, free text, not auto-generated |
| Client Secret | leave blank, auto-generated on save |
| Redirect URL | see table below |
| **Token format** | **`JWT`** — Opaque fails with `Token validation failed: Not enough segments` |
| **Scope restriction** | **`Useraccount scoped`** — the default `Securely scoped` fails every call with `403 Access to unscoped api is not allowed` |
| Public Client | unchecked |
| Active | checked |
| Access Token Lifespan | `1800` |
| Refresh Token Lifespan | `8640000` |

Redirect URL, by client:

| Client | Redirect URL |
|---|---|
| Claude web / desktop connector | `https://claude.ai/api/mcp/auth_callback` |
| `mcp-remote` local proxy | `http://127.0.0.1:3334/oauth/callback` |
| VS Code | `https://vscode.dev/redirect` |
| Cursor | `cursor://anysphere.cursor-retrieval/oauth/user-mcp/callback` |

Submit, reopen the record, copy the Client Secret from the form. It is encrypted at rest — a query returns ciphertext, not the value.

### Step E — Connect the client

| Setting | Value |
|---|---|
| Server URL | `https://YOUR_INSTANCE.service-now.com/sncapps/mcp-server/mcp/<server_name_with_underscores>` |
| Auth | OAuth 2.0, authorization code |
| Client ID / Secret | from Step D |
| Authorization URL | `https://YOUR_INSTANCE.service-now.com/oauth_auth.do` |
| Token URL | `https://YOUR_INSTANCE.service-now.com/oauth_token.do` |

The connecting user needs the **`itil`** role.

### Step F — Test

Send **Prompt 3**. It uses the password grant, which is **not** enabled by default — temporarily add **Resource Owner Password Credentials** to the OAuth record's Grant type, then set it back to **Authorization Code** when you are done.

Expected: `tools/list` returns one tool with six string inputs; three `tools/call` runs return different section sets per state, each on the first attempt.

A real client (Claude connector, `mcp-remote`) uses authorization code and is unaffected by the password-grant toggle.

### Known traps, in the order they bite

| Symptom | Cause |
|---|---|
| Derived scope is not what you asked for | SDK builds it from the app name. Immutable. Verify `now.config.json` before writing code. |
| Build fails `Unsupported variable initializer` | String concatenation or helpers in the Fluent file. One template literal per prompt. |
| `temperature` is 0.2 after install | SDK drops `0` as unset. Fix by hand in Skill Kit or accept. |
| Skill not in the MCP tool picker | Not published, `workflow = Platform`, or on the exclude block list. |
| `403 Access to unscoped api is not allowed` | OAuth scope restriction is `Securely scoped`. |
| `403 Failed API level ACL Validation`, intermittent | A role the caller depends on is inherited, not listed in `roleMap`. Add it explicitly. Not instance flakiness — do not add a retry loop. |
| SSE parse failure | Responses may open with `: ping - <timestamp>`. Ignore lines starting with `:`. |

---

## What changed from the original prompt, and why

| Change | Reason |
|---|---|
| Dropped the "use scope x_snc_lf_ba" instruction; replaced with "report the derived scope and stop if unusable" | The SDK derives scope from the app name and silently ignores a requested scope. The original prompt asked for a scope it could never get. |
| Skill name now matches the app name | Original had app "LF CR Summary BA" / skill "LF CR Summary BA" tied to a scope that never materialized. Keeping them equal avoids a second round of "which name is right". |
| Merged old Prompt 2 (full prompt bodies) into Prompt 1 | The original relied on a follow-up round trip if the agent wrote short prompts. Shipping the bodies up front removes the gamble. |
| Added the explicit Fluent syntax constraints | Helper functions, spread and string concatenation all fail the build. Three wasted build cycles without this. |
| Added the `temperature: 0` → `0.2` warning | The SDK drops 0. Better to know at write time than to discover it in verification. |
| Added the `roleMap` vs `roleRestrictions` table-existence check | Original hardcoded both `roles` and `roleMap`; which one is correct depends on whether `sys_agent_access_role_mapping` exists. |
| Added "do not rewrite as 4-section Role/Context/Instructions/Output" | SDK docs mandate that structure; it conflicts with the fixed JSON section contract here. Without this the agent may "helpfully" restructure. |
| Added explicit post-install verification queries | "Installation successful" does not mean the prompt bodies, routing conditions and role mapping landed. |
| Promoted MCP tool/server from "Build Agent cannot do this" to Prompt 2 | It can. The record shape is known and the inserts fire the normal business rules. |
| Added "do not check `sn_nowassist_skill_config.active`" | That column stays 0 on a published, turned-on skill. It cost the most time in the original run. |
| Added the explicit `roleMap` / inherited-role warning | An inherited role in `roleMap` produces an intermittent 403 that reads as instance flakiness. Cost two debugging rounds. |
| Added the OAuth scope-restriction instruction | The default "Securely scoped" blocks every MCP call with `403 Access to unscoped api is not allowed`. Not mentioned in the original. |
| Added Prompt 3 (end-to-end MCP test) | The original had a "Check the result" table but no runnable test, and it told the agent to tolerate 403s with a retry. The 403 was a real defect. |
| Dropped "retry once on 403" | It was a known-issue workaround in the original. The root cause is a `roleMap` gap and it is fixable. Retrying hides it. |
| **Removed the "no sysid input" rule** | The original stated a `sysid` input disqualifies a skill from MCP. It does not — the OOB Incident and Case summarization tools both have one. The real gate is the `sn_mcp_server_skill_config_exclude` block list. Plain-string inputs are still the right call, but for a different reason: a calling LLM cannot produce a sys_id. |
| Manual steps written out inline | They used to point at the README. Now Steps A–F are in this file so it stands alone. |

Still manual, no way around it: Skill Kit finalize + publish, AI Admin Hub turn on, OAuth client creation. Steps A–F above.
