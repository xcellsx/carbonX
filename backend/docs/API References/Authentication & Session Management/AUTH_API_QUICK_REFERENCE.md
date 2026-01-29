# AuthController API - Quick Reference

## Base URL
```
http://localhost:8080/api/auth
```

---

## Endpoints Overview

| Status | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| ✅ | POST | `/api/auth/register` | Register new user |
| ✅ | POST | `/api/auth/login` | Login (email or username) |
| ✅ | POST | `/api/auth/logout` | Logout current user |
| ✅ | GET | `/api/auth/me` | Get current user info |
| ✅ | POST | `/api/auth/change-password` | Change password |
| ⚠️ | POST | `/api/auth/forgot-password` | Request password reset |
| ⚠️ | POST | `/api/auth/reset-password` | Reset with token |
| ⚠️ | POST | `/api/auth/verify-email` | Verify email |
| ⚠️ | POST | `/api/auth/refresh` | Refresh JWT token |
| ✅ | GET | `/api/auth/validate` | Validate auth status |

**Legend:**
- ✅ = Fully implemented
- ⚠️ = Requires additional integration (JWT/email)

---

## Quick Examples

### 1. Register
```bash
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 2. Login (Email)
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### 3. Login (Username)
```bash
POST /api/auth/login
{
  "username": "johndoe",
  "password": "password123"
}
```

### 4. Get Current User
```bash
GET /api/auth/me?userId=12345
```

### 5. Change Password
```bash
POST /api/auth/change-password
{
  "userId": "12345",
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

### 6. Validate Auth
```bash
GET /api/auth/validate?userId=12345
```

### 7. Logout
```bash
POST /api/auth/logout
```

---

## JavaScript Examples

```javascript
// Register
const register = async (userData) => {
  const response = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return await response.json();
};

// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.authenticated) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
};

// Get Current User
const getCurrentUser = async (userId) => {
  const response = await fetch(`http://localhost:8080/api/auth/me?userId=${userId}`);
  return await response.json();
};

// Logout
const logout = async () => {
  await fetch('http://localhost:8080/api/auth/logout', {
    method: 'POST'
  });
  localStorage.removeItem('user');
};
```

---

## Response Format

### Success Response
```json
{
  "message": "Success message",
  "authenticated": true,
  "user": {
    "id": "12345",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "active": true
  }
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (registration) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid credentials) |
| 403 | Forbidden (account deactivated) |
| 404 | Not Found (user not found) |
| 409 | Conflict (duplicate email/username) |
| 500 | Internal Server Error |
| 501 | Not Implemented (JWT/email features) |

---

## Security Notes

⚠️ **Current Implementation (Development Only)**
- Plain text passwords
- No JWT tokens
- No rate limiting

🔒 **Production Requirements**
- BCrypt password hashing
- JWT token authentication
- Email service integration
- Rate limiting
- HTTPS only

---

## Related Files

- **Controller:** `backend/src/main/java/com/ecapybara/CarbonX/controller/AuthController.java`
- **Full Documentation:** `backend/docs/AUTH_CONTROLLER_MAPPING.md`
- **Postman Collection:** `backend/docs/CarbonX_API.postman_collection.json`
- **User Entity:** `backend/src/main/java/com/ecapybara/CarbonX/entity/User.java`
- **User Repository:** `backend/src/main/java/com/ecapybara/CarbonX/repository/UserRepository.java`
- **UserDTO:** `backend/src/main/java/com/ecapybara/CarbonX/dto/UserDTO.java`

---

## Testing

Import the Postman collection and test all endpoints:
```bash
File: backend/docs/CarbonX_API.postman_collection.json
```

Or use cURL:
```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

**Last Updated:** November 19, 2024

