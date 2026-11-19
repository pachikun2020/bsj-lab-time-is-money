# Security policy

Security fixes target the latest code in the default branch. Older QA versions are not maintained independently. No response-time or security certification is promised.

## Reporting a vulnerability

Please do not publish exploit details, credentials, personal information or real meeting records in a public Issue or pull request.

If GitHub's **Security → Advisories → Report a vulnerability** is available, use that private channel. Private vulnerability reporting must be enabled by the maintainer before the repository becomes public. If the button is absent, post only a request for a private reporting channel, without vulnerability details. The maintainer will arrange a private channel.

Include the affected version, browser/OS, minimal reproduction using fictional data, observed impact and any suggested fix. Do not test against other people's deployments, accounts or data. Permission to test someone else's instance must come from its operator.

## Scope and limitations

The app is a static client application. Settings use localStorage; numeric session snapshots use sessionStorage; a Service Worker caches app assets. Free-text meeting notes are not persisted by the app. CSV exports are files controlled by the user. Same-origin script compromise or local device access can affect browser storage. Do not enter confidential personal data in free-text fields.

App inputs are not sent to an app backend. Hosting and preview authentication providers may process access/authentication logs. HTTPS, security headers, deployment access rules and cache updates must be checked for each deployed instance. A successful source review does not certify every deployment.
