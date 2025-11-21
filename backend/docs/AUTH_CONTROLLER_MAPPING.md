# AuthController Endpoint Mapping

This document maps out the authentication endpoints implemented in `AuthController.java` for the CarbonX backend application.

## Overview

The `AuthController` handles all authentication-related operations, separating authentication concerns from general user management (which is handled by `UserController`).

**Base URL:** `/api/auth`

---

## Endpoint Summary

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register a new user account | ✅ Implemented |
| POST | `/api/auth/login` | Login with email/username and password | ✅ Implemented |
| POST | `/api/auth/logout` | Logout current user | ✅ Implemented |
| GET | `/api/auth/me` | Get current authenticated user info | ✅ Implemented |
| POST | `/api/auth/change-password` | Change password for authenticated user | ✅ Implemented |
| POST | `/api/auth/forgot-password` | Request password reset | ⚠️ Requires email integration |
| POST | `/api/auth/reset-password` | Reset password using token | ⚠️ Requires email integration |
| POST | `/api/auth/verify-email` | Verify email address | ⚠️ Requires email integration |
| POST | `/api/auth/refresh` | Refresh authentication token | ⚠️ Requires JWT implementation |
| GET | `/api/auth/validate` | Validate authentication status | ✅ Implemented |

---

## Detailed Endpoint Documentation

### 1. Register New User

**POST** `/api/auth/register`

Register a new user account with validation and default settings.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp"
}
```

**Required Fields:**
- `username` (string)
- `email` (string)
- `password` (string, min 6 characters)

**Response (201 Created):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "12345",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "companyName": "Acme Corp",
    "active": true,
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:30:00"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or password too short
- `409 Conflict` - Email or username already exists

---

### 2. User Login

**POST** `/api/auth/login`

Authenticate user with email/username and password. Supports login with either email or username.

**Request Body (Option 1 - Email):**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Request Body (Option 2 - Username):**
```json
{
  "username": "johndoe",
  "password": "securepass123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "authenticated": true,
  "user": {
    "id": "12345",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "companyName": "Acme Corp",
    "active": true,
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:30:00"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing credentials
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account deactivated

**Production Enhancement:**
When JWT is implemented, the response will include:
```json
{
  "message": "Login successful",
  "authenticated": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": { /* user object */ }
}
```

---

### 3. User Logout

**POST** `/api/auth/logout`

Logout current user. In production, this would invalidate JWT tokens or clear sessions.

**Headers:**
- `Authorization: Bearer <token>` (optional for now)

**Response (200 OK):**
```json
{
  "message": "Logout successful",
  "authenticated": false
}
```

---

### 4. Get Current User

**GET** `/api/auth/me`

Get information about the currently authenticated user.

**Query Parameters:**
- `userId` (required for now, will be extracted from JWT in production)

**Headers:**
- `Authorization: Bearer <token>` (will be required in production)

**Example:**
```
GET /api/auth/me?userId=12345
```

**Response (200 OK):**
```json
{
  "authenticated": true,
  "user": {
    "id": "12345",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "companyName": "Acme Corp",
    "active": true,
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:30:00"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - No user ID provided
- `403 Forbidden` - Account deactivated
- `404 Not Found` - User not found

---

### 5. Change Password

**POST** `/api/auth/change-password`

Change password for an authenticated user. Requires current password for verification.

**Request Body:**
```json
{
  "userId": "12345",
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing fields or password too short
- `401 Unauthorized` - Current password incorrect
- `404 Not Found` - User not found

---

### 6. Forgot Password

**POST** `/api/auth/forgot-password`

Request a password reset. Sends reset link to user's email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If the email exists, a password reset link has been sent",
  "note": "Production implementation would send email"
}
```

**Status:** ⚠️ Requires email integration
- Email service configuration needed
- Reset token generation and storage
- Email template creation

---

### 7. Reset Password

**POST** `/api/auth/reset-password`

Reset password using a reset token from email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newpassword123"
}
```

**Status:** ⚠️ Requires email integration
- Token validation system needed
- Token expiry management
- Secure token storage

---

### 8. Verify Email

**POST** `/api/auth/verify-email`

Verify user's email address using a verification token.

**Request Body:**
```json
{
  "token": "verification-token-from-email"
}
```

**Status:** ⚠️ Requires email integration
- Verification token system needed
- Email verification workflow
- Account activation logic

---

### 9. Refresh Token

**POST** `/api/auth/refresh`

Refresh authentication token (for JWT-based systems).

**Headers:**
- `Authorization: Bearer <refresh-token>`

**Status:** ⚠️ Requires JWT implementation
- JWT library integration needed
- Refresh token mechanism
- Token rotation strategy

---

### 10. Validate Authentication

**GET** `/api/auth/validate`

Quick validation of current authentication status.

**Query Parameters:**
- `userId` (optional, will use JWT in production)

**Headers:**
- `Authorization: Bearer <token>` (optional for now)

**Example:**
```
GET /api/auth/validate?userId=12345
```

**Response (200 OK):**
```json
{
  "valid": true,
  "authenticated": true,
  "user": {
    "id": "12345",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "valid": false,
  "authenticated": false,
  "message": "No valid authentication found"
}
```

---

## Comparison: AuthController vs UserController

### AuthController (`/api/auth`)
**Purpose:** Authentication and session management
- User registration
- Login/logout
- Password management
- Token management
- Email verification
- Authentication validation

### UserController (`/api/users`)
**Purpose:** User account management (CRUD operations)
- Get users (list/filter)
- Get user by ID/email/username
- Update user information
- Activate/deactivate users
- Delete users
- Admin user management

---

## Security Considerations

### Current Implementation (Development)
- ✅ Basic validation
- ✅ CORS enabled
- ✅ DTO pattern (passwords excluded from responses)
- ⚠️ Plain text passwords (needs hashing)
- ⚠️ No token-based authentication
- ⚠️ No rate limiting

### Production Requirements

1. **Password Security**
   ```java
   // Add to pom.xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-security</artifactId>
   </dependency>
   
   // Use BCrypt for password hashing
   BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
   String hashedPassword = encoder.encode(plainPassword);
   ```

2. **JWT Authentication**
   ```java
   // Add to pom.xml
   <dependency>
       <groupId>io.jsonwebtoken</groupId>
       <artifactId>jjwt</artifactId>
       <version>0.9.1</version>
   </dependency>
   ```

3. **Email Service**
   ```java
   // Add to pom.xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-mail</artifactId>
   </dependency>
   ```

4. **Rate Limiting**
   - Implement request throttling for login attempts
   - Prevent brute force attacks
   - Use Spring Security or custom filters

5. **HTTPS**
   - Require HTTPS in production
   - Encrypt data in transit
   - Secure cookie settings

6. **CORS Configuration**
   ```java
   // Restrict CORS to specific frontend domain
   @CrossOrigin(origins = "https://your-frontend-domain.com")
   ```

---

## Integration with Frontend

### JavaScript/Fetch Examples

**Register:**
```javascript
async function register(userData) {
  const response = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return await response.json();
}
```

**Login:**
```javascript
async function login(email, password) {
  const response = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.authenticated) {
    // Store user info in localStorage/sessionStorage
    localStorage.setItem('user', JSON.stringify(data.user));
    // In production, store JWT token
    // localStorage.setItem('token', data.token);
  }
  return data;
}
```

**Logout:**
```javascript
async function logout() {
  await fetch('http://localhost:8080/api/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // In production: 'Authorization': `Bearer ${token}`
    }
  });
  
  // Clear local storage
  localStorage.removeItem('user');
  // localStorage.removeItem('token');
}
```

**Get Current User:**
```javascript
async function getCurrentUser(userId) {
  const response = await fetch(
    `http://localhost:8080/api/auth/me?userId=${userId}`,
    {
      headers: {
        // In production: 'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
}
```

**Change Password:**
```javascript
async function changePassword(userId, currentPassword, newPassword) {
  const response = await fetch('http://localhost:8080/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, currentPassword, newPassword })
  });
  return await response.json();
}
```

---

## Testing with cURL

```bash
# Register new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'

# Get current user
curl http://localhost:8080/api/auth/me?userId=12345

# Change password
curl -X POST http://localhost:8080/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "12345",
    "currentPassword": "testpass123",
    "newPassword": "newpass456"
  }'

# Validate authentication
curl http://localhost:8080/api/auth/validate?userId=12345

# Logout
curl -X POST http://localhost:8080/api/auth/logout
```

---

## Migration Notes

### Moving from UserController Login to AuthController Login

The login endpoint has been moved from `/api/users/login` to `/api/auth/login`. For backward compatibility, you may want to:

1. **Keep both endpoints temporarily** - Add a deprecated annotation to UserController's login
2. **Redirect requests** - Have UserController.login redirect to AuthController.login
3. **Update frontend** - Change all login calls to use `/api/auth/login`

### Frontend Migration Checklist
- [ ] Update login endpoint URL
- [ ] Update register endpoint URL (if moving from `/api/users` POST)
- [ ] Update logout implementation
- [ ] Add authentication state management
- [ ] Implement token storage (when JWT is added)
- [ ] Add authentication guards for protected routes
- [ ] Update API client library


---

## Related Documentation

- [API Documentation](./API_Documentation.md)
- [User Entity Documentation](./entities.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [Introduction](./Introduction.md)

---

## Status in To-Do List

**Backend Controllers Mapping Status:**
- [ ] AnalyticsController.java
- [x] **AuthController.java** ✅ **COMPLETED**
- [ ] CompanyInfoController.java
- [ ] DashboardController.java
- [ ] HealthController.java
- [ ] LcaCalculationController.java
- [ ] NetworkController.java
- [ ] OpenLCAController.java
- [ ] ProductController.java
- [ ] ProductInventoryController.java
- [x] UserController.java ✅

---

**Last Updated:** November 19, 2024  
**Status:** AuthController fully mapped and documented  
**Next Controller:** CompanyInfoController or DashboardController

