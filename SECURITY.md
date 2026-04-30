# Security Policy

## Supported Versions

Security fixes are shipped on the latest npm release of `@sarveshsea/memoire`. Older pre-`0.14` releases are not supported for security updates.

## Reporting A Vulnerability

Please report security issues privately by opening a GitHub security advisory or emailing the maintainer address on the npm package profile. Do not disclose exploit details in public issues before a fix is available.

Include:

- Memoire version and install method.
- Command or MCP tool involved.
- Minimal reproduction steps.
- Whether the issue requires local project access, network access, or a malicious Note/registry package.

## Expected MCP And CLI Capabilities

Memoire is a local CLI and MCP server for design-system automation. The following capabilities are expected and are not vulnerabilities by themselves:

- Reading and writing files in the current project when the user runs commands that generate specs, registries, reports, or fixes.
- Starting local preview/MCP servers.
- Running local platform tools such as `git`, `tar`, or `unzip` for explicit install/upgrade flows.
- Fetching public npm, GitHub, website, or registry URLs when the user requests remote import, install, diagnosis, or publication.

## Security Boundaries

- Notes installed from GitHub must use the strict `github:owner/repo` form.
- Standalone binary upgrades verify SHA256 manifests by default.
- `--allow-unverified` exists only for emergency/manual recovery and should not be used for routine upgrades.
- Registry installs and generated fix plans should be reviewed before applying to production repositories.
