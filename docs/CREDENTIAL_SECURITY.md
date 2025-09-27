# Credential Security Guide

## Overview

This document provides guidelines for securely managing credentials in the TURNUVAYONETIM project.

## Best Practices

### 1. Never Commit Sensitive Data

- **NEVER** commit `.env.local` or any file containing actual credentials
- Always use `.env.example` or `.env.local.example` files for templates
- Ensure `.env.local` is in `.gitignore`

### 2. Environment Variable Management

#### Local Development
- Copy `.env.local.example` to `.env.local`
- Fill in your actual credentials in `.env.local`
- Keep `.env.local` on your local machine only

#### Production
- Use environment variable services:
  - Vercel Environment Variables
  - Heroku Config Vars
  - AWS Secrets Manager
  - Azure Key Vault
  - HashiCorp Vault

### 3. Credential Storage Patterns

#### Codex Agent Credentials

The project uses a consistent naming pattern for agent credentials:
```
CODEX_${agentId}_EMAIL
CODEX_${agentId}_PASSWORD
```

Where `${agentId}` is the agent number (1-4).

**Important**:
- The `${agentId}` notation in documentation is a template placeholder
- Actual environment variables use literal numbers: `CODEX_1_EMAIL`, `CODEX_2_EMAIL`, etc.

### 4. OAuth Tokens vs Passwords

For Codex agents, you can use either:
- Regular password authentication
- OAuth tokens for enhanced security

When using OAuth tokens:
1. Generate a personal access token from your Codex account
2. Set the token as the password value
3. The system will automatically detect and use token authentication

### 5. Secret Generation

Generate strong secrets for production:

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate a secure session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Secret Rotation

Regularly rotate sensitive credentials:
- JWT secrets: Every 90 days
- Database passwords: Every 60 days
- API keys: Every 180 days
- OAuth tokens: Follow provider recommendations

### 7. Access Control

- Limit access to production credentials
- Use different credentials for each environment
- Implement least privilege principle
- Use service accounts where possible

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] No hardcoded credentials in source code
- [ ] All secrets are strong and unique
- [ ] Production secrets are stored securely
- [ ] Access to secrets is logged and monitored
- [ ] Secret rotation schedule is established
- [ ] Backup recovery keys are stored securely
- [ ] Multi-factor authentication is enabled

## Encryption at Rest

For additional security in production:

1. **Database Encryption**
   - Enable PostgreSQL transparent data encryption
   - Use encrypted connections (SSL/TLS)

2. **File-based Secrets**
   - Use encrypted secret stores
   - Consider using `dotenv-vault` for encrypted env files

3. **Application-level Encryption**
   - Encrypt sensitive data before storage
   - Use field-level encryption for PII

## Incident Response

If credentials are compromised:

1. **Immediate Actions**
   - Revoke compromised credentials immediately
   - Generate new credentials
   - Update all affected services

2. **Investigation**
   - Review access logs
   - Identify scope of exposure
   - Check for unauthorized access

3. **Prevention**
   - Implement additional monitoring
   - Review and update security policies
   - Conduct security training

## Tools and Resources

### Recommended Tools

- **Secret Scanning**: GitHub secret scanning, GitLeaks
- **Vault Solutions**: HashiCorp Vault, AWS Secrets Manager
- **Environment Management**: dotenv-vault, Chamber
- **Password Generation**: 1Password CLI, Bitwarden CLI

### Security Resources

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App - Config](https://12factor.net/config)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

## Contact

For security concerns or questions:
- Create a private security issue in the repository
- Contact the security team directly
- Never discuss security issues in public channels