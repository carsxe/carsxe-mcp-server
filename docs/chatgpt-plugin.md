# ChatGPT plugin package

Version 1.3.0 of the CarsXE plugin, in the OpenAI Plugins format, for upload at <https://platform.openai.com/plugins>.

This package lives in `chatgpt/`. It is not the root `plugin.json` or `mcp.json`. Those root files keep API-key auth for Claude and Cursor, and the build leaves them out of the ZIP.

## Build

From the repository root:

```bash
npm run build:chatgpt-plugin
```

The command writes `dist/carsxe-chatgpt-plugin-1.3.0.zip` and checks the archive. The check fails if the ZIP contains any of the following:

- lifecycle hooks
- `.app.json` or `apps` references
- MCP server headers (including `X-API-Key`)
- secrets or reviewer credentials
- a skill that asks the user for an API key

`npm test` runs the same checks, including cases that insert forbidden content and expect a failure.

The build copies `skills/` into the ZIP and rewrites the auth line. ChatGPT signs the user in with OAuth. Packaged skills must not ask for an API key. The source skills used by Claude and Cursor are unchanged.

The demo recording URL in `chatgpt/plugin.json` is still a TODO placeholder. The build warns about it and still writes the ZIP. Replace that URL and rebuild before you submit for review.

## Upload a new version

1. Open the existing CarsXE plugin at <https://platform.openai.com/plugins>. Upload this ZIP as a new version of that plugin. Do not create a second plugin.
2. The manifest name is `carsxe` and the version is `1.3.0`. An update has to keep the existing package name. If the portal reports `plugin_name_mismatch`, set `name` to the name already on the plugin and rebuild.
3. Choose the verified CarsXE business identity. Publishing under an unverified name is rejected.
4. Open MCPs and confirm the server URL is `https://mcp.carsxe.com/mcp`, authentication is OAuth with dynamic client registration, and there is no API key and no request headers. The registration endpoint is `https://mcp.carsxe.com/oauth/register` and the scope is `mcp`.
5. Complete the domain-verification challenge. The hosted server already answers `https://mcp.carsxe.com/.well-known/openai-apps-challenge`. If the portal shows a different token, host that exact token as plain text at the URL it gives you.
6. Connect the server and finish OAuth sign-in with the reviewer account, then run Scan Tools.

The published Agent Plugins MCP schema does not yet allow `extensions` on a server entry. OpenAI's packaging docs do, and the portal reads OAuth settings from that block. This package follows the OpenAI docs.

## Reviewer account

Enter the login only in Review details. The ZIP check rejects reviewer credentials, and the manifest format rejects `test_credentials`.

The account needs:

- An email and a password.
- No MFA. That includes authenticator apps, SMS codes, email codes, and magic links.
- A CarsXE API key on the account, and enough credits for the five positive prompts to return data.
- Sign-in that works outside the company network. Try the login in a private browser before you submit.

Version 1.0.0 was rejected because reviewers could not sign in through OAuth. This package declares dynamic client registration so the portal can start that flow. The reviewer still has to be able to finish it with the account above.

## Demo video

Replace `https://TODO.invalid/carsxe-chatgpt-plugin-demo-recording` in `chatgpt/plugin.json` (`extensions.com.openai.review.demo_recording_url`) with an HTTPS URL reviewers can open without a private workspace login.

Show sign-in and the five positive cases: specifications, market value, history, recalls, and the vehicle card. Cover desktop and mobile when both are part of the submission. Rebuild and upload the new ZIP after the URL changes.

The older submission file had a sixth positive case for an OBD-II code. The current format allows exactly five, so that case is not in this package.

## Before you submit

- Wait until the metadata and skill scans finish, and clear required findings.
- If the tool scan asks about `ui.carsxe.com`, explain that the vehicle, market-value, and recalls cards load the official CarsXE logo from that host.
- Confirm <https://carsxe.com/privacy-policy> discloses the personal data returned by owner and resident lookups. `get_ownership_by_person` and `get_ownership_by_address` are still in the server. They are flagged in code, not removed.
- Save review details, accept the policy attestations, and submit the draft. Only one review can be open. If a review is already in progress, cancel it before uploading a replacement.
