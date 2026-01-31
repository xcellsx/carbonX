# Exception Handling & Logging Implementation

## Overview
This document summarizes the standardized error handling and logging system implemented across the CarbonX backend application.

## What Was Implemented

### 1. Custom Exception Classes
Created custom exceptions in `exception/` package:

- **ResourceNotFoundException** - For 404 errors when resources aren't found
- **ValidationException** - For 400 errors when validation fails
- **ExternalServiceException** - For 502 errors when external services (like ArangoDB) fail
- **DatabaseOperationException** - For 500 errors when database operations fail

### 2. Global Exception Handler
**File**: `exception/GlobalExceptionHandler.java`

Centralized exception handling using `@RestControllerAdvice` that catches all exceptions and returns standardized JSON error responses. Handles:

- Custom exceptions (ResourceNotFoundException, ValidationException, etc.)
- Spring validation errors (MethodArgumentNotValidException)
- WebClient errors (from ArangoDB API calls)
- Common runtime errors (NullPointerException, IndexOutOfBoundsException)
- All other uncaught exceptions

### 3. Standardized Error Response
**File**: `dto/ErrorResponse.java`

All errors return consistent JSON format:
```json
{
  "timestamp": "2026-01-30T12:34:56",
  "status": 404,
  "error": "Not Found",
  "message": "Product not found with id: '12345'",
  "path": "/api/products/12345",
  "exception": "ResourceNotFoundException",
  "validationErrors": []
}
```

### 4. Updated Controllers with Proper Error Handling

#### InputController
- Added `@Slf4j` for Lombok logging
- Replaced `System.out.println` with proper logging
- Changed methods to throw `ResourceNotFoundException` instead of returning null
- Added validation for empty lists
- Fixed `IndexOutOfBoundsException` risk in `createInputs()`
- Delete endpoint now returns 204 No Content

#### OutputController
- Same improvements as InputController
- All CRUD operations now have proper error handling
- Comprehensive logging at INFO and DEBUG levels

#### ProcessController
- Added `@Slf4j` annotation
- Removed old Logger initialization
- Added error logging to reactive endpoints
- Proper exception handling in edit operations

#### ProductController
- Same improvements as ProcessController
- All reactive operations now have error logging
- Validation added to creation operations

### 5. Updated Services

#### DocumentService
- Added `@Slf4j` for logging
- Added error handling for WebClient responses
- Logs all API calls to ArangoDB
- Handles 4xx and 5xx status codes properly

#### GraphService
- Replaced manual Logger with `@Slf4j`
- Added validation for graph creation
- Fixed potential ClassCastException in `deleteDocuments()`
- Comprehensive error logging for all operations

### 6. Updated Test Setup
**File**: `runner/TestSetup.java`

- Replaced `System.out.println` with proper logging
- Fixed all `IndexOutOfBoundsException` risks with helper methods:
  - `getProductByName()` - safely retrieves products
  - `getProcessByName()` - safely retrieves processes
- Added try-catch with proper exception handling
- Better structured logging flow

### 7. Configuration Updates

#### pom.xml
- Added Lombok dependency
- Configured Maven plugin to exclude Lombok from packaged JAR

#### application.properties
- Updated logging configuration
- Set proper log levels for different packages
- Added console and file logging patterns
- Optional file logging configuration

#### AppLogger.java
- Added missing `warn()` and `error()` methods
- Added documentation recommending `@Slf4j` for new code
- Kept for backward compatibility

### 8. Documentation
Created comprehensive guides:

- **EXCEPTION_HANDLING_GUIDE.java** - Complete usage examples and best practices
- **EXCEPTION_HANDLING_IMPLEMENTATION.md** - This document

## Benefits

### Before Implementation
❌ Runtime errors were hard to debug
❌ System.out.println scattered everywhere
❌ Controllers returned null or error strings
❌ No consistent error response format
❌ Potential IndexOutOfBoundsException everywhere
❌ No proper logging of errors

### After Implementation
✅ All errors are logged with context
✅ Consistent error responses across all endpoints
✅ Proper HTTP status codes (404, 400, 500, 502)
✅ No more IndexOutOfBoundsException risks
✅ Clean, readable logging with Lombok
✅ Easy to debug with proper stack traces
✅ Better error messages for API consumers

## How to Use

### In Controllers
```java
@Slf4j
@RestController
public class MyController {
    
    @GetMapping("/{id}")
    public Item getItem(@PathVariable String id) {
        log.info("Fetching item: {}", id);
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item", "id", id));
    }
}
```

### In Services
```java
@Slf4j
@Service
public class MyService {
    
    public Mono<Data> fetchData(String id) {
        log.info("Fetching data: {}", id);
        return webClient.get()
            .uri("/data/{id}", id)
            .retrieve()
            .onStatus(status -> status.isError(),
                response -> Mono.error(new ExternalServiceException(...)))
            .bodyToMono(Data.class)
            .doOnError(error -> log.error("Error: {}", error.getMessage(), error));
    }
}
```

## Testing the Implementation

### Test Error Responses
```bash
# Test 404 error
curl http://localhost:8080/api/products/invalid-id

# Test validation error
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '[]'

# Test successful operation (should log properly)
curl http://localhost:8080/api/products
```

### Check Logs
Look for structured log output:
```
2026-01-30 12:34:56 - c.e.c.controller.ProductController - Fetching products - name: null, type: null
2026-01-30 12:34:57 - c.e.c.service.DocumentService - Fetching document from ArangoDB - collection: products, key: 123
```

## Files Modified

### New Files
- `exception/ResourceNotFoundException.java`
- `exception/ValidationException.java`
- `exception/ExternalServiceException.java`
- `exception/DatabaseOperationException.java`
- `exception/GlobalExceptionHandler.java`
- `exception/EXCEPTION_HANDLING_GUIDE.java`
- `dto/ErrorResponse.java`

### Updated Files
- `controller/InputController.java`
- `controller/OutputController.java`
- `controller/ProcessController.java`
- `controller/ProductController.java`
- `controller/HomeController.java`
- `service/DocumentService.java`
- `service/GraphService.java`
- `runner/TestSetup.java`
- `config/AppLogger.java`
- `pom.xml`
- `resources/application.properties`

## Next Steps

1. **Run the application** to see the new logging in action
2. **Test error scenarios** to verify proper error responses
3. **Update remaining services** (LCAService, QueryService, ImportService) with similar patterns
4. **Add unit tests** for exception handling
5. **Consider adding validation annotations** (@Valid, @NotNull, etc.) on DTOs

## Troubleshooting

### If Lombok doesn't work
1. Make sure your IDE has Lombok plugin installed
2. Enable annotation processing in IDE settings
3. Rebuild the project: `mvn clean install`

### If logs aren't appearing
1. Check `application.properties` logging levels
2. Ensure `@Slf4j` annotation is present
3. Check console output format in your IDE

### If errors aren't caught
1. Verify `GlobalExceptionHandler` is in the correct package
2. Check `@RestControllerAdvice` is being scanned by Spring
3. Ensure exceptions extend from RuntimeException

## Support & References

For detailed examples, see:
- `exception/EXCEPTION_HANDLING_GUIDE.java` - Complete usage guide
- Individual controller files - Real implementation examples
- Spring Boot documentation on exception handling
- Lombok documentation for @Slf4j annotation
