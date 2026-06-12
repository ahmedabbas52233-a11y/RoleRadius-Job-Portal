# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email: **Ahmedabbas52233@gmail.com**

Include in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

You will receive a response within **48 hours**. If the issue is confirmed,
a patch will be released within 7 days and you will be credited in the
CHANGELOG unless you prefer to remain anonymous.

## Security Features Implemented

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT in httpOnly cookies — not localStorage |
| Account lockout | django-axes: locks after 5 failed attempts (30 min) |
| Rate limiting | 5 login/min, 3 password-reset/min, 10 register/hour |
| CSRF protection | Django CSRF middleware + X-CSRFToken header |
| Password validation | Django built-in validators (length, similarity, common) |
| File upload safety | Extension whitelist (.pdf, .docx, .txt) + 5 MB size limit |
| SQL injection | Django ORM — no raw queries |
| XSS | React escapes all output by default; no dangerouslySetInnerHTML |
| Secrets | All credentials in .env — never committed |
| Production headers | HSTS, X-Frame-Options, XSS filter, SECURE_SSL_REDIRECT |
| Email verification | Signed tokens via django.core.signing (24h expiry) |
| Password reset | Single-use UUID tokens with 2h expiry |

## Known Accepted Risks

- **Synchronous ML matching** — the TF-IDF engine runs in the request thread.
  A slow match on a large dataset could delay the response but cannot be
  exploited for code execution.
- **No CSP headers** — Content Security Policy is not yet implemented.
  This is documented as a known gap.
