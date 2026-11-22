# Security Policy

## Supported Versions

Security updates are provided for the latest `3.x` release line of Tornio.

| Version | Supported |
| :--- | :--- |
| `3.0.x` | Yes |
| `< 3.0.0` | Upgrade to `3.0.x` |

---

## Local-First Security Guarantees

Tornio is designed around strict local isolation:

1. **Loopback-Only Binding (`127.0.0.1`)**: The local API server binds exclusively to `127.0.0.1` on the user machine and restricts CORS origins to loopback hosts.
2. **Zero Cloud Telemetry or Document Uploads**: PDFs, video, audio, images, passwords, and session files never leave the device.
3. **Hop-by-Hop Anti-SSRF Guard**: Web utilities (`web-markdown-clip`, `web-headers-ssl`, QR URL reachability checks) validate hostnames, DNS resolutions, IP ranges (blocking RFC1918, loopback, link-local, multicast, and cloud metadata IPs), and every `3xx` redirect hop via `safe_public_get`.
4. **Local Encryption**: The Local Encrypted Vault (`file-vault`) derives keys using `Scrypt` and encrypts payloads locally with `AES-256-GCM`.
5. **Cryptographically Verified Auto-Updates**: When checking or applying app updates, Tornio restricts download hosts strictly to official GitHub Release endpoints over HTTPS (`github.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`) and requires an exact `SHA-256` match against `SHA256SUMS.txt` before installing. Mismatched binaries are rejected and deleted immediately.

---

## Reporting a Vulnerability

Please report suspected security vulnerabilities responsibly:

1. **Do not** disclose unpatched vulnerabilities publicly in comments or social channels before mitigation.
2. Report privately via GitHub Security Advisories at:
   https://github.com/albert-dilas/Tornio/security/advisories/new
   (or open a minimal issue requesting private contact if GitHub Security Advisories are unavailable).
3. Include:
   - Tornio version and operating system
   - Clear reproduction steps or proof-of-concept
   - Affected endpoint, file, or component
   - Potential security impact (e.g., SSRF bypass, path traversal, updater integrity)

We aim to acknowledge reports within 72 hours and coordinate verified fixes promptly.
