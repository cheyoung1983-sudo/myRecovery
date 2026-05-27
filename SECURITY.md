# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in myRecovery, please **do not** open a public issue. Instead, please report it privately to keep users safe.

### How to Report

Please email security concerns to: **cheyoung1983@gmail.com**

Include the following information:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Any suggested fixes

We will acknowledge your report within 48 hours and work to resolve the issue promptly.

## Security Best Practices

### For Users
- Never share your API keys or credentials in public repositories
- Always use `.env.local` for local development (not committed to git)
- Use environment variables in production (Netlify site settings)
- Keep your dependencies updated

### For Contributors
- Review code changes carefully
- Use TypeScript for type safety
- Avoid committing sensitive files (covered by `.gitignore`)
- Report security issues privately

## Dependency Management

We regularly update dependencies to patch security vulnerabilities. To check for vulnerabilities:

```bash
npm audit
```

To fix vulnerabilities:

```bash
npm audit fix
```

## Environment Variable Security

**Never expose:**
- API keys or tokens
- Firebase credentials
- User authentication data
- Private configuration files

These should only exist in:
- Local `.env.local` (ignored by git)
- Netlify environment variables (not in code)

---

Thank you for helping keep myRecovery secure! 🔒
