# CarbonX User Management Setup Guide

## Prerequisites

1. **Java 21** - Ensure Java 21 is installed
2. **ArangoDB** - Download and install from [arango.ai/downloads](https://arango.ai/downloads/)
3. **Maven** - For building the project
4. **Git** - For version control

## Step 1: Start ArangoDB

1. Start the ArangoDB server
2. Access the web interface at: http://localhost:8529
3. Login with credentials:
   - Username: `root`
   - Password: `test`

4. Create a database named `spring-demo` (if it doesn't exist)
   - Click on "Databases" in the left sidebar
   - Click "Add Database"
   - Enter name: `spring-demo`
   - Click "Create"

## Step 2: Configure Application

The application is already configured with the following settings in `application.properties`:

```properties
spring.application.name=CarbonX
server.port = 8080

# ArangoDB Configuration
arangodb.spring.data.database=spring-demo
arangodb.spring.data.user=root
arangodb.spring.data.password=test
arangodb.spring.data.hosts=localhost:8529
```

If your ArangoDB uses different credentials, update these properties accordingly.

## Step 3: Build and Run the Backend

### Using Maven Wrapper (Recommended)

**Windows:**
```powershell
cd backend
.\mvnw.cmd clean install
.\mvnw.cmd spring-boot:run
```

**Linux/Mac:**
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

### Using Maven

```bash
cd backend
mvn clean install -DskipTests=true
mvn spring-boot:run
```

The backend should start on port 8080. You should see output like:
```
Started CarbonXApplication in X.XXX seconds
```

## Step 4: Verify ArangoDB Collection

Once the application starts, ArangoDB will automatically create the `users` collection.

To verify:
1. Go to http://localhost:8529
2. Click on "Collections" in the left sidebar
3. You should see a collection named `users`
4. An index on the `email` field should be automatically created

## Step 5: Test the API

### Option 1: Using the Frontend Interface

1. Open `frontend/users.html` in your web browser
2. The interface provides a complete UI for testing all API endpoints
3. Try creating a user, retrieving users, updating, etc.

### Option 2: Using cURL

```bash
# Create a test user
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Get all users
curl http://localhost:8080/api/users

# Get user by ID (replace {id} with actual ID from create response)
curl http://localhost:8080/api/users/{id}
```

### Option 3: Using Postman

Import the `CarbonX_API.postman_collection.json` file into Postman for a complete set of pre-configured requests.

## Step 6: Access Frontend

Open any of the frontend HTML files in your browser:

- **User Management**: `frontend/users.html`
- **Dashboard**: `frontend/dashboard.html`
- **Other pages**: `frontend/*.html`

The frontend will communicate with the backend API at `http://localhost:8080/api/users`

## API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (supports filtering) |
| GET | `/api/users/{id}` | Get user by ID |
| GET | `/api/users/email/{email}` | Get user by email |
| GET | `/api/users/username/{username}` | Get user by username |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/{id}` | Update user |
| PATCH | `/api/users/{id}/activate?active=true` | Activate/deactivate user |
| DELETE | `/api/users/{id}` | Delete user |
| POST | `/api/users/login` | User login |

For complete API documentation, see `backend/docs/API_Documentation.md`

## Troubleshooting

### Port Already in Use

If port 8080 is already in use, change the port in `application.properties`:
```properties
server.port = 8081
```

Also update the `API_BASE_URL` in `frontend/users.html`:
```javascript
const API_BASE_URL = 'http://localhost:8081/api/users';
```

### ArangoDB Connection Issues

1. Verify ArangoDB is running: http://localhost:8529
2. Check credentials in `application.properties`
3. Ensure the database `spring-demo` exists

### CORS Issues

If you get CORS errors:
1. Ensure `WebConfig.java` is present in `backend/src/main/java/com/ecapybara/CarbonX/config/`
2. Check browser console for specific error messages
3. Verify the backend is running on port 8080

### Build Errors

If you encounter build errors:
```bash
# Clean and rebuild
cd backend
./mvnw clean install -U
```

## Development Tips

### Hot Reload

The backend is configured with Spring Boot DevTools for automatic restart on code changes. Just save your Java files, and the application will restart automatically.

### View Database in Real-Time

Open the ArangoDB web interface at http://localhost:8529 and navigate to:
- Collections → users → to view stored user documents
- Queries → to run AQL queries

Example AQL query to view all users:
```aql
FOR user IN users
  RETURN user
```

### Add New Fields

To add new fields to the User entity:

1. Update `User.java` with new field and getters/setters
2. Update `UserDTO.java` if the field should be exposed to frontend
3. Update `UserController.java` convertToDTO method
4. Restart the application

ArangoDB is schema-free, so new fields will be automatically stored.

## Next Steps

1. ✅ User Management API is ready
2. 🔒 Consider implementing JWT authentication (see Security section in API_Documentation.md)
3. 🔐 Add password hashing with BCrypt
4. 📊 Create more entities (Product, Order, etc.) following the User pattern
5. 🎨 Enhance the frontend UI
6. 🧪 Add unit tests
7. 📦 Prepare for deployment

## Additional Resources

- [Spring Data ArangoDB Documentation](https://docs.arango.ai/ecosystem/integrations/spring-boot-arangodb/)
- [ArangoDB Documentation](https://docs.arango.ai/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)

## Support

For issues or questions:
- Check the API Documentation: `backend/docs/API_Documentation.md`
- Review ArangoDB logs
- Check Spring Boot application logs in the console

