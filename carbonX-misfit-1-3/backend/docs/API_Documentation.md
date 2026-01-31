x# CarbonX User Management API Documentation

## Base URL
```
http://localhost:8080/api/users
```

## Overview
This RESTful API provides complete user management functionality using ArangoDB as the database. All endpoints follow REST conventions and return JSON responses.

---

## Endpoints

### 1. Get All Users
**GET** `/api/users`

Retrieve all users or filter by query parameters.

**Query Parameters:**
- `role` (optional): Filter by user role (e.g., "admin", "user", "supplier")
- `active` (optional): Filter by active status (true/false)
- `company` (optional): Filter by company name

**Examples:**
```bash
# Get all users
GET http://localhost:8080/api/users

# Get all admin users
GET http://localhost:8080/api/users?role=admin

# Get all active users
GET http://localhost:8080/api/users?active=true

# Get users from specific company
GET http://localhost:8080/api/users?company=Acme%20Corp
```

**Response (200 OK):**
```json
[
  {
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
]
```

---

### 2. Get User by ID
**GET** `/api/users/{id}`

Retrieve a specific user by their ID.

**Path Parameters:**
- `id` (required): User ID

**Example:**
```bash
GET http://localhost:8080/api/users/12345
```

**Response (200 OK):**
```json
{
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
```

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

---

### 3. Get User by Email
**GET** `/api/users/email/{email}`

Retrieve a user by their email address.

**Path Parameters:**
- `email` (required): User email

**Example:**
```bash
GET http://localhost:8080/api/users/email/john@example.com
```

**Response:** Same as Get User by ID

---

### 4. Get User by Username
**GET** `/api/users/username/{username}`

Retrieve a user by their username.

**Path Parameters:**
- `username` (required): Username

**Example:**
```bash
GET http://localhost:8080/api/users/username/johndoe
```

**Response:** Same as Get User by ID

---

### 5. Create User
**POST** `/api/users`

Create a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "companyName": "Acme Corp"
}
```

**Required Fields:**
- `username` (string)
- `email` (string)
- `password` (string)

**Optional Fields:**
- `firstName` (string)
- `lastName` (string)
- `role` (string) - defaults to "user"
- `companyName` (string)

**Response (201 Created):**
```json
{
  "message": "User created successfully",
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

**Response (409 Conflict):**
```json
{
  "error": "Email already exists"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Username and email are required"
}
```

---

### 6. Update User
**PUT** `/api/users/{id}`

Update an existing user. Only provided fields will be updated.

**Path Parameters:**
- `id` (required): User ID

**Request Body:**
```json
{
  "username": "johndoe_updated",
  "email": "newemail@example.com",
  "password": "newpassword123",
  "firstName": "Jonathan",
  "lastName": "Doe",
  "role": "admin",
  "companyName": "New Company",
  "active": true
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Response (200 OK):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "12345",
    "username": "johndoe_updated",
    "email": "newemail@example.com",
    "firstName": "Jonathan",
    "lastName": "Doe",
    "role": "admin",
    "companyName": "New Company",
    "active": true,
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T12:45:00"
  }
}
```

**Response (409 Conflict):**
```json
{
  "error": "Username already taken"
}
```

---

### 7. Activate/Deactivate User
**PATCH** `/api/users/{id}/activate`

Toggle user's active status.

**Path Parameters:**
- `id` (required): User ID

**Query Parameters:**
- `active` (required): Boolean value (true/false)

**Examples:**
```bash
# Activate user
PATCH http://localhost:8080/api/users/12345/activate?active=true

# Deactivate user
PATCH http://localhost:8080/api/users/12345/activate?active=false
```

**Response (200 OK):**
```json
{
  "message": "User activated",
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
    "updatedAt": "2024-01-15T12:45:00"
  }
}
```

---

### 8. Delete User
**DELETE** `/api/users/{id}`

Permanently delete a user.

**Path Parameters:**
- `id` (required): User ID

**Example:**
```bash
DELETE http://localhost:8080/api/users/12345
```

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

---

### 9. User Login
**POST** `/api/users/login`

Authenticate a user with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
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

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Account is deactivated"
}
```

---

## Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists (duplicate email/username)
- **500 Internal Server Error**: Server error

---

## CORS Configuration

The API is configured to accept requests from any origin (`*`). In production, this should be restricted to your specific frontend URL.

**Allowed Methods:**
- GET
- POST
- PUT
- PATCH
- DELETE
- OPTIONS

---

## Data Models

### User Entity
```json
{
  "id": "string",           // Auto-generated unique ID (_key in ArangoDB)
  "arangoId": "string",     // Auto-generated ArangoDB ID (_id)
  "username": "string",     // Unique username
  "email": "string",        // Unique email address
  "password": "string",     // User password (should be hashed in production)
  "firstName": "string",    // User's first name
  "lastName": "string",     // User's last name
  "role": "string",         // User role (admin, user, supplier, etc.)
  "companyName": "string",  // Associated company name
  "active": "boolean",      // Account status
  "createdAt": "datetime",  // Account creation timestamp
  "updatedAt": "datetime"   // Last update timestamp
}
```

### UserDTO (Response Model)
Same as User Entity but **excludes password** for security.

---

## Frontend Integration

### JavaScript/Fetch Example

```javascript
// Create a new user
async function createUser() {
  const response = await fetch('http://localhost:8080/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'securepass123',
      firstName: 'John',
      lastName: 'Doe'
    })
  });
  
  const data = await response.json();
  console.log(data);
}

// Get all users
async function getAllUsers() {
  const response = await fetch('http://localhost:8080/api/users');
  const users = await response.json();
  console.log(users);
}

// Login
async function login(email, password) {
  const response = await fetch('http://localhost:8080/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (response.ok) {
    console.log('Login successful:', data.user);
  } else {
    console.error('Login failed:', data.error);
  }
}
```

---

## Testing the API

### Using cURL

```bash
# Get all users
curl http://localhost:8080/api/users

# Create a user
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Get user by ID
curl http://localhost:8080/api/users/12345

# Update user
curl -X PUT http://localhost:8080/api/users/12345 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name"
  }'

# Delete user
curl -X DELETE http://localhost:8080/api/users/12345

# Login
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

---

## Security Considerations

⚠️ **Important for Production:**

1. **Password Hashing**: Currently passwords are stored in plain text. Implement BCrypt or similar hashing algorithm before production.

2. **Authentication**: Implement JWT tokens or session-based authentication for secure API access.

3. **CORS**: Restrict CORS to specific frontend domains instead of allowing all origins.

4. **Input Validation**: Add comprehensive input validation and sanitization.

5. **Rate Limiting**: Implement rate limiting to prevent abuse.

6. **HTTPS**: Use HTTPS in production to encrypt data in transit.

7. **Environment Variables**: Store sensitive configuration in environment variables.

---

## ArangoDB Configuration

The API connects to ArangoDB using the following configuration (from `application.properties`):

```properties
arangodb.spring.data.database=spring-demo
arangodb.spring.data.user=root
arangodb.spring.data.password=test
arangodb.spring.data.hosts=localhost:8529
```

**ArangoDB Collection:** `users`
**Persistent Index:** `email` field for optimized queries

---

## Support

For issues or questions, please refer to:
- [ArangoDB Documentation](https://docs.arango.ai/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- Project README

