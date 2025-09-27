# TURNUVAYONETIM Authentication System

A comprehensive, enterprise-grade authentication system for the TURNUVAYONETIM poker tournament management platform.

## 🔐 Features

### Core Authentication
- **JWT-based authentication** with RS256/HS256 support
- **Refresh token rotation** for enhanced security
- **Multi-tenant organization isolation**
- **Role-based access control** (Admin, Manager, Dealer, Player, Viewer)
- **Session management** with device tracking
- **Password security** with strength validation and breach checking

### Security Features
- **Account lockout** protection against brute force attacks
- **Rate limiting** on authentication endpoints
- **Two-factor authentication** (TOTP/Backup codes)
- **Email verification** for account activation
- **Password reset** with secure token generation
- **Token blacklisting** for logout and security events
- **Audit logging** with comprehensive security event tracking

### Enterprise Features
- **Multi-organization support** with context switching
- **Event sourcing integration** for audit trails
- **Redis support** for horizontal scaling
- **WebSocket authentication** for real-time features
- **Device fingerprinting** and IP tracking
- **Suspicious activity detection**

## 📁 Architecture

### File Structure
```
src/
├── types/
│   └── auth-types.ts           # Authentication type definitions
├── services/
│   ├── auth-service.ts         # Core authentication service
│   └── auth-audit-service.ts   # Security audit and logging
├── middleware/
│   └── auth-middleware.ts      # Express middleware for auth
├── controllers/
│   └── auth-controller.ts      # HTTP request handlers
├── utils/
│   └── password-utils.ts       # Password security utilities
├── config/
│   └── auth-config.ts          # Configuration management
├── routers/
│   └── auth.ts                 # Route definitions
└── examples/
    └── auth-integration-example.ts # Integration example
```

### Key Components

#### 1. Authentication Service (`auth-service.ts`)
- JWT token generation and validation
- User registration and login
- Password management
- Session handling
- Organization context management

#### 2. Authentication Middleware (`auth-middleware.ts`)
- JWT token validation
- Role-based authorization
- Rate limiting
- Security headers
- CORS configuration
- Audit logging

#### 3. Password Security Utils (`password-utils.ts`)
- Password strength validation
- Secure hashing with bcrypt + pepper
- Reset token generation
- Account lockout management
- Timing attack prevention

#### 4. Auth Controller (`auth-controller.ts`)
- RESTful API endpoints
- Input validation with Zod
- Error handling
- HTTP-only cookie management
- 2FA support

## 🚀 Quick Start

### 1. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Required environment variables:
```env
# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
REFRESH_TOKEN_SECRET="your-super-secret-refresh-token-key-at-least-32-characters"

# Optional: RSA Keys for RS256 (Recommended for production)
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/turnuvayonetim_dev"

# Optional: Redis for scaling
REDIS_URL="redis://localhost:6379"

# Security
PASSWORD_PEPPER="your-random-pepper-string"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
npm run db:generate
npm run db:push
```

### 4. Integration Example

```typescript
import { setupAuthenticationSystem } from './src/examples/auth-integration-example';

// Initialize the complete auth system
const { app, authService, auditService } = await setupAuthenticationSystem();

// Start server
app.listen(3001, () => {
  console.log('🚀 Server running with authentication system');
});
```

## 📚 API Reference

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationSlug": "my-org"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "organizationSlug": "my-org",
  "rememberMe": false
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Protected Endpoints

All protected endpoints require the `Authorization: Bearer <token>` header.

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Change Password
```http
POST /auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

#### Setup Two-Factor Authentication
```http
POST /auth/2fa/setup
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "password": "CurrentPassword123!"
}
```

### Admin Endpoints

#### Get Security Events
```http
GET /api/admin/security/events?limit=100
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Get Security Summary
```http
GET /api/admin/security/summary
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 🛡️ Security Features

### Password Security
- **Minimum 8 characters** with complexity requirements
- **bcrypt hashing** with configurable salt rounds
- **Optional pepper** for additional security layer
- **Password strength meter** with detailed feedback
- **Common password checking** against known weak passwords
- **Personal information validation** (prevents using name/email)

### Account Protection
- **Progressive lockout** after failed attempts
- **IP-based rate limiting** on authentication endpoints
- **Session management** with device tracking
- **Suspicious activity detection** and alerting
- **Token blacklisting** for immediate revocation

### Audit & Compliance
- **Comprehensive security event logging** via Event Store
- **Multi-tenant audit isolation**
- **Real-time security monitoring**
- **Compliance reporting** capabilities
- **GDPR-ready** data handling

## 🏢 Multi-Tenant Support

The authentication system is built with multi-tenancy at its core:

### Organization Isolation
- All users belong to an organization
- JWT tokens include organization context
- Database queries are automatically scoped
- Audit logs are organization-specific

### Organization Switching
```http
POST /auth/organization/new-org-slug/switch
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Role-Based Access Control
- **Admin**: Full system access
- **Manager**: Tournament and player management
- **Dealer**: Table operations
- **Player**: Participation and profile management
- **Viewer**: Read-only access

## 🔧 Configuration

### Environment-Based Configuration

The system supports different configurations for different environments:

```typescript
import { getAuthConfig } from './src/config/auth-config';

// Get environment-specific config
const config = getAuthConfig(process.env.NODE_ENV);

// Development: More lenient settings
// Production: Strict security settings
// Test: Minimal restrictions for testing
```

### Security Configuration

```typescript
const authConfig = {
  jwt: {
    algorithm: 'RS256',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d'
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    twoFactorRequired: true,
    emailVerificationRequired: true
  },
  rateLimiting: {
    login: { windowMs: 900000, maxAttempts: 5 }
  }
};
```

## 🔌 Integration Guide

### Express Middleware Integration

```typescript
import { createAuthenticationMiddleware } from './middleware/auth-middleware';

const authMiddleware = createAuthenticationMiddleware({
  authService,
  prisma,
  eventStore
});

app.use('/api', authMiddleware);
```

### Role-Based Route Protection

```typescript
import { requireRole, requirePermission } from './middleware/auth-middleware';

// Require specific roles
app.get('/admin/users', requireRole([UserRole.ADMIN]), handler);

// Require specific permissions
app.post('/tournaments',
  requirePermission(AuthResource.TOURNAMENT, AuthAction.CREATE),
  handler
);
```

### WebSocket Authentication

```typescript
import { setupWebSocketAuthentication } from './examples/auth-integration-example';

const io = require('socket.io')(server);
setupWebSocketAuthentication(io, authService);
```

## 📊 Monitoring & Analytics

### Security Event Tracking

The system automatically logs:
- Login attempts (successful/failed)
- Account lockouts
- Password changes
- Two-factor authentication events
- Token blacklisting
- Suspicious activities
- Organization switching

### Real-time Monitoring

```typescript
// Stream security events in real-time
for await (const event of auditService.streamSecurityEvents(orgId)) {
  console.log('Security event:', event);
}

// Get security summary
const summary = await auditService.getSuspiciousActivitySummary(orgId);
```

## 🧪 Testing

### Environment Setup for Testing

```env
NODE_ENV=test
JWT_SECRET="test-secret-key"
DATABASE_URL="postgresql://test:test@localhost:5432/turnuvayonetim_test"
```

### Example Test

```typescript
import { setupAuthenticationSystem } from './examples/auth-integration-example';

describe('Authentication System', () => {
  let app, authService;

  beforeAll(async () => {
    ({ app, authService } = await setupAuthenticationSystem());
  });

  test('should authenticate valid user', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
  });
});
```

## 🚀 Deployment

### Environment Variables Validation

```typescript
import { validateAuthEnvironment } from './config/auth-config';

const validation = validateAuthEnvironment();
if (!validation.isValid) {
  console.error('Missing required variables:', validation.missingVars);
  process.exit(1);
}
```

### Production Security Checklist

- [ ] Use RS256 JWT algorithm with RSA key pair
- [ ] Set strong, unique secrets (64+ characters)
- [ ] Enable Redis for session storage
- [ ] Configure HTTPS-only cookies
- [ ] Set up proper CORS origins
- [ ] Enable email verification
- [ ] Require two-factor authentication
- [ ] Configure rate limiting
- [ ] Set up security monitoring
- [ ] Enable audit logging
- [ ] Configure backup strategies

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

## 📋 Troubleshooting

### Common Issues

1. **JWT Token Invalid**
   - Check JWT_SECRET configuration
   - Verify token hasn't expired
   - Ensure proper Bearer token format

2. **Rate Limiting Triggered**
   - Check rate limit configuration
   - Verify IP address handling
   - Review rate limit windows

3. **Organization Context Missing**
   - Ensure user belongs to organization
   - Check organization slug in requests
   - Verify organization is active

4. **Database Connection Issues**
   - Verify DATABASE_URL
   - Check Prisma client configuration
   - Ensure database migrations are applied

### Debug Mode

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📄 License

This authentication system is part of the TURNUVAYONETIM project and follows the same licensing terms.

## 🤝 Contributing

Please refer to the main project contributing guidelines for information on how to contribute to this authentication system.

## 📞 Support

For support and questions regarding the authentication system, please contact the development team or create an issue in the project repository.