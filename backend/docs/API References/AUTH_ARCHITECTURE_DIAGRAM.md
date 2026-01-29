# CarbonX Authentication Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  (HTML/JavaScript - dashboard.html, login.html, etc.)          │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │ HTTP Requests                      │
             │ (JSON)                             │
             ▼                                    ▼
┌────────────────────────────┐    ┌────────────────────────────┐
│   AuthController           │    │   UserController           │
│   /api/auth/*              │    │   /api/users/*             │
├────────────────────────────┤    ├────────────────────────────┤
│ • register()               │    │ • getAllUsers()            │
│ • login()                  │    │ • getUserById()            │
│ • logout()                 │    │ • createUser()             │
│ • getCurrentUser()         │    │ • updateUser()             │
│ • changePassword()         │    │ • deleteUser()             │
│ • forgotPassword()         │    │ • activateUser()           │
│ • resetPassword()          │    └────────────┬───────────────┘
│ • verifyEmail()            │                 │
│ • refreshToken()           │                 │
│ • validateAuth()           │                 │
└────────────┬───────────────┘                 │
             │                                  │
             │                                  │
             ▼                                  ▼
┌────────────────────────────────────────────────────────────────┐
│                      UserRepository                             │
│              (Spring Data ArangoDB)                             │
├────────────────────────────────────────────────────────────────┤
│ • findById()                                                    │
│ • findByEmail()                                                 │
│ • findByUsername()                                              │
│ • existsByEmail()                                               │
│ • existsByUsername()                                            │
│ • findByRole()                                                  │
│ • findByActive()                                                │
│ • save()                                                        │
│ • delete()                                                      │
└────────────┬───────────────────────────────────────────────────┘
             │
             │ ArangoDB Driver
             ▼
┌────────────────────────────────────────────────────────────────┐
│                      ArangoDB Database                          │
│                    (localhost:8529)                             │
├────────────────────────────────────────────────────────────────┤
│ Database: spring-demo                                           │
│ Collection: users                                               │
│ Index: email (persistent)                                       │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: User Registration

```
Frontend                AuthController           UserRepository         ArangoDB
   │                           │                       │                   │
   │──POST /api/auth/register─>│                       │                   │
   │  {username, email, pass}  │                       │                   │
   │                           │                       │                   │
   │                           │──Validate input       │                   │
   │                           │──Check duplicates────>│                   │
   │                           │                       │──Query email─────>│
   │                           │                       │<──Result──────────│
   │                           │<──No duplicates───────│                   │
   │                           │                       │                   │
   │                           │──Set defaults         │                   │
   │                           │──Hash password*       │                   │
   │                           │                       │                   │
   │                           │──save(user)──────────>│                   │
   │                           │                       │──INSERT──────────>│
   │                           │                       │<──User created────│
   │                           │<──User object─────────│                   │
   │                           │                       │                   │
   │                           │──Convert to DTO       │                   │
   │<─201 Created──────────────│                       │                   │
   │  {message, user (no pwd)} │                       │                   │

* Password hashing to be implemented in production
```

---

## Data Flow: User Login

```
Frontend                AuthController           UserRepository         ArangoDB
   │                           │                       │                   │
   │──POST /api/auth/login────>│                       │                   │
   │  {email, password}        │                       │                   │
   │                           │                       │                   │
   │                           │──findByEmail()───────>│                   │
   │                           │                       │──QUERY───────────>│
   │                           │                       │<──User record─────│
   │                           │<──User object─────────│                   │
   │                           │                       │                   │
   │                           │──Verify password      │                   │
   │                           │──Check active status  │                   │
   │                           │                       │                   │
   │                           │──Generate token*      │                   │
   │                           │──Convert to DTO       │                   │
   │<─200 OK───────────────────│                       │                   │
   │  {authenticated: true,    │                       │                   │
   │   user, token*}           │                       │                   │
   │                           │                       │                   │
   │──Store in localStorage    │                       │                   │

* Token generation to be implemented with JWT
```

---

## Data Flow: Password Change

```
Frontend                AuthController           UserRepository         ArangoDB
   │                           │                       │                   │
   │─POST /api/auth/          │                       │                   │
   │  change-password─────────>│                       │                   │
   │  {userId, currentPass,    │                       │                   │
   │   newPassword}            │                       │                   │
   │                           │                       │                   │
   │                           │──findById()──────────>│                   │
   │                           │                       │──QUERY───────────>│
   │                           │                       │<──User record─────│
   │                           │<──User object─────────│                   │
   │                           │                       │                   │
   │                           │──Verify current pwd   │                   │
   │                           │──Hash new password*   │                   │
   │                           │──Update timestamps    │                   │
   │                           │                       │                   │
   │                           │──save(user)──────────>│                   │
   │                           │                       │──UPDATE──────────>│
   │                           │                       │<──Success─────────│
   │                           │<──Updated user────────│                   │
   │<─200 OK───────────────────│                       │                   │
   │  {message: "Password      │                       │                   │
   │   changed"}               │                       │                   │

* Password hashing to be implemented in production
```

---

## Entity Relationship

```
┌─────────────────────────────────────────────────────────────────┐
│                            User                                  │
├─────────────────────────────────────────────────────────────────┤
│ PK  id (String)                    - ArangoDB _key              │
│     arangoId (String)              - ArangoDB _id               │
│ UK  email (String)                 - Unique, indexed            │
│ UK  username (String)              - Unique                     │
│     password (String)              - Plain text (dev only!)     │
│     firstName (String)             - Optional                   │
│     lastName (String)              - Optional                   │
│     role (String)                  - Default: "user"            │
│     companyName (String)           - Optional                   │
│     active (Boolean)               - Default: true              │
│     createdAt (LocalDateTime)      - Auto-set on creation       │
│     updatedAt (LocalDateTime)      - Auto-set on update         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Transformed to
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          UserDTO                                 │
│                   (Response Object)                              │
├─────────────────────────────────────────────────────────────────┤
│ All User fields EXCEPT password                                 │
│ Used in all API responses for security                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Structure

```
/api
├── /auth (AuthController) - Authentication & Session Management
│   ├── POST   /register              ✅ Register new user
│   ├── POST   /login                 ✅ Login (email or username)
│   ├── POST   /logout                ✅ Logout
│   ├── GET    /me                    ✅ Get current user
│   ├── POST   /change-password       ✅ Change password
│   ├── POST   /forgot-password       ⚠️  Request reset (needs email)
│   ├── POST   /reset-password        ⚠️  Reset with token (needs email)
│   ├── POST   /verify-email          ⚠️  Verify email (needs email)
│   ├── POST   /refresh               ⚠️  Refresh token (needs JWT)
│   └── GET    /validate              ✅ Validate auth status
│
└── /users (UserController) - User Management (CRUD)
    ├── GET    /                      ✅ List all users (with filters)
    ├── POST   /                      ✅ Create user (admin)
    ├── GET    /{id}                  ✅ Get user by ID
    ├── GET    /email/{email}         ✅ Get user by email
    ├── GET    /username/{username}   ✅ Get user by username
    ├── PUT    /{id}                  ✅ Update user
    ├── PATCH  /{id}/activate         ✅ Activate/deactivate user
    ├── DELETE /{id}                  ✅ Delete user
    └── POST   /login                 ⚠️  Legacy (use /api/auth/login)

Legend:
  ✅ Fully implemented and working
  ⚠️  Requires additional integration (JWT/email)
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTION SECURITY STACK                    │
│                      (To Be Implemented)                         │
└─────────────────────────────────────────────────────────────────┘

Layer 5: Application Security
┌─────────────────────────────────────────────────────────────────┐
│ • OAuth2 / Social Login                                         │
│ • Two-Factor Authentication (2FA)                               │
│ • Account lockout policies                                      │
│ • Security audit logs                                           │
└─────────────────────────────────────────────────────────────────┘

Layer 4: Rate Limiting & Protection
┌─────────────────────────────────────────────────────────────────┐
│ • Request rate limiting                                         │
│ • Brute force protection                                        │
│ • IP-based throttling                                           │
│ • CAPTCHA integration                                           │
└─────────────────────────────────────────────────────────────────┘

Layer 3: Token & Session Management
┌─────────────────────────────────────────────────────────────────┐
│ • JWT token generation                                          │
│ • Refresh token mechanism                                       │
│ • Token blacklisting                                            │
│ • Session timeout management                                    │
└─────────────────────────────────────────────────────────────────┘

Layer 2: Data Protection
┌─────────────────────────────────────────────────────────────────┐
│ • BCrypt password hashing   ⚠️ REQUIRED                         │
│ • Password strength policies                                    │
│ • Secure token storage                                          │
│ • DTO pattern (hide sensitive data) ✅ IMPLEMENTED              │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Transport & CORS
┌─────────────────────────────────────────────────────────────────┐
│ • HTTPS enforcement         ⚠️ REQUIRED FOR PRODUCTION          │
│ • CORS configuration        ✅ IMPLEMENTED (needs restriction)  │
│ • Secure headers                                                │
│ • Request validation        ✅ IMPLEMENTED                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow

### Successful Authentication Flow

```
1. User enters credentials
   ↓
2. Frontend sends POST /api/auth/login
   ↓
3. AuthController validates input
   ↓
4. UserRepository queries ArangoDB
   ↓
5. User found and password verified
   ↓
6. Account active status checked
   ↓
7. Generate response (with token in production)
   ↓
8. Convert User → UserDTO (remove password)
   ↓
9. Return 200 OK with UserDTO
   ↓
10. Frontend stores user info and token
    ↓
11. Redirect to dashboard
```

### Failed Authentication Flow

```
1. User enters credentials
   ↓
2. Frontend sends POST /api/auth/login
   ↓
3. AuthController validates input
   ↓
4. UserRepository queries ArangoDB
   ↓
5. User NOT found OR password incorrect
   ↓
6. Return 401 Unauthorized
   ↓
7. Frontend displays error message
   ↓
8. User remains on login page
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         TECHNOLOGY STACK                         │
└─────────────────────────────────────────────────────────────────┘

Backend Framework
├── Spring Boot 3.5.7
├── Spring Web (REST Controllers)
├── Spring Data ArangoDB
└── Spring Actuator

Database
├── ArangoDB 3.x
└── arangodb-spring-boot-starter 3.4-0

Java
└── JDK 25 (LTS)

Build Tool
└── Maven 3.9.11

To Be Added (Production)
├── Spring Security (BCrypt, JWT)
├── Spring Mail (Email service)
├── JJWT (JWT tokens)
└── Redis (Session storage, optional)
```

---

## Configuration

```properties
# application.properties

# ArangoDB Configuration
arangodb.spring.data.database=spring-demo
arangodb.spring.data.user=root
arangodb.spring.data.password=test
arangodb.spring.data.hosts=localhost:8529

# Server Configuration
server.port=8080

# CORS (To be restricted in production)
# Currently allows all origins (*)

# Future Additions:
# JWT Secret Key
# jwt.secret=${JWT_SECRET}
# jwt.expiration=3600000

# Email Configuration
# spring.mail.host=smtp.gmail.com
# spring.mail.port=587
# spring.mail.username=${EMAIL_USERNAME}
# spring.mail.password=${EMAIL_PASSWORD}
```

---

## Error Handling

```
HTTP Status Codes Used:

┌─────────┬─────────────────┬──────────────────────────────────┐
│  Code   │     Status      │           When Used              │
├─────────┼─────────────────┼──────────────────────────────────┤
│  200    │ OK              │ Successful request               │
│  201    │ Created         │ User registration successful     │
│  400    │ Bad Request     │ Invalid input / validation error │
│  401    │ Unauthorized    │ Invalid credentials              │
│  403    │ Forbidden       │ Account deactivated              │
│  404    │ Not Found       │ User not found                   │
│  409    │ Conflict        │ Email/username already exists    │
│  500    │ Internal Error  │ Server-side error                │
│  501    │ Not Implemented │ JWT/email features pending       │
└─────────┴─────────────────┴──────────────────────────────────┘

Error Response Format:
{
  "error": "Descriptive error message"
}

Success Response Format:
{
  "message": "Success message",
  "authenticated": true,
  "user": { UserDTO }
}
```

---

## Testing Strategy

```
1. Unit Testing (To be implemented)
   ├── Test each endpoint independently
   ├── Mock UserRepository
   ├── Test validation logic
   └── Test error handling

2. Integration Testing (To be implemented)
   ├── Test with actual ArangoDB
   ├── Test end-to-end flows
   ├── Test concurrent requests
   └── Test edge cases

3. Manual Testing (Current approach)
   ├── Postman collection
   ├── cURL commands
   └── Frontend integration testing

4. Security Testing (Before production)
   ├── Penetration testing
   ├── SQL injection attempts (NoSQL here)
   ├── XSS testing
   ├── CSRF protection
   └── Rate limiting verification
```

---

## Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                             │
│                      (Nginx / AWS ELB)                           │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                │
             ▼                                ▼
┌────────────────────────┐      ┌────────────────────────┐
│  Spring Boot Instance  │      │  Spring Boot Instance  │
│     (with JWT)         │      │     (with JWT)         │
└────────────┬───────────┘      └────────────┬───────────┘
             │                                │
             │         ┌──────────────────┐  │
             └────────>│  Redis (optional) │<─┘
                       │ Session Storage   │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  ArangoDB Cluster │
                       │   (3+ nodes)      │
                       └──────────────────┘
```

---

## Future Enhancements Roadmap

```
Phase 1: Security Basics (Week 1-2)
├── ✅ AuthController implementation
├── ⚠️  BCrypt password hashing
├── ⚠️  Input validation enhancement
└── ⚠️  CORS restriction

Phase 2: JWT Authentication (Week 3-4)
├── ⚠️  JWT library integration
├── ⚠️  Token generation on login
├── ⚠️  Token validation middleware
└── ⚠️  Refresh token mechanism

Phase 3: Email Integration (Week 5-6)
├── ⚠️  Email service setup
├── ⚠️  Password reset flow
├── ⚠️  Email verification
└── ⚠️  Email templates

Phase 4: Advanced Features (Week 7-8)
├── ⚠️  Rate limiting
├── ⚠️  Account lockout
├── ⚠️  Audit logging
└── ⚠️  Admin dashboard

Phase 5: Enterprise Features (Week 9+)
├── ⚠️  OAuth2 / Social login
├── ⚠️  Two-factor authentication
├── ⚠️  Role-based access control
└── ⚠️  Advanced analytics
```

---

**Version:** 1.0  
**Last Updated:** November 19, 2024  
**Status:** Development Ready  
**Next Steps:** Frontend integration and JWT implementation

