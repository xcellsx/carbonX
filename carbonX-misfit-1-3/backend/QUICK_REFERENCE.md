# Error Handling & Logging Quick Reference

## 1. Add Lombok Logging to Any Class
```java
@Slf4j
@RestController  // or @Service, @Component, etc.
public class MyClass {
    // 'log' field is now available automatically
}
```

## 2. Common Logging Patterns

```java
// INFO - Normal operations
log.info("User {} logged in", username);
log.info("Created {} items", count);

// DEBUG - Detailed debugging (won't show in production)
log.debug("Request body: {}", requestBody);

// WARN - Something unusual but not an error
log.warn("Deprecated method called");

// ERROR - Error occurred (always include exception)
log.error("Database connection failed: {}", e.getMessage(), e);
```

## 3. Exception Throwing Patterns

### Resource Not Found (404)
```java
return repository.findById(id)
    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
```

### Validation Error (400)
```java
if (name == null || name.isEmpty()) {
    throw new ValidationException("name", "Name is required");
}
```

### Database Error (500)
```java
try {
    repository.save(item);
} catch (Exception e) {
    log.error("Save failed: {}", e.getMessage(), e);
    throw new DatabaseOperationException("save", "Failed to save item");
}
```

### External Service Error (502)
```java
return webClient.get()
    .uri("/api/data")
    .retrieve()
    .onStatus(
        status -> status.isError(),
        response -> Mono.error(new ExternalServiceException("API", "Call failed")))
    .bodyToMono(Data.class);
```

## 4. Safe List Access

### ❌ DON'T
```java
item = items.get(0);  // Can throw IndexOutOfBoundsException
```

### ✅ DO
```java
if (items.isEmpty()) {
    throw new ResourceNotFoundException("No items found");
}
item = items.get(0);
```

## 5. Controller Method Patterns

### GET by ID
```java
@GetMapping("/{id}")
public Item getItem(@PathVariable String id) {
    log.info("Fetching item: {}", id);
    return repository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Item", "id", id));
}
```

### CREATE
```java
@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public Item createItem(@RequestBody Item item) {
    try {
        if (item.getName() == null) {
            throw new ValidationException("name", "Name is required");
        }
        log.info("Creating item: {}", item.getName());
        repository.save(item);
        log.info("Created item with ID: {}", item.getId());
        return item;
    } catch (ValidationException e) {
        throw e;
    } catch (Exception e) {
        log.error("Create failed: {}", e.getMessage(), e);
        throw new DatabaseOperationException("create", "Failed to create item");
    }
}
```

### UPDATE
```java
@PutMapping("/{id}")
public Item updateItem(@PathVariable String id, @RequestBody Item revision) {
    try {
        log.info("Updating item: {}", id);
        Item item = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item", "id", id));
        item.setName(revision.getName());
        repository.save(item);
        log.info("Updated item: {}", id);
        return item;
    } catch (ResourceNotFoundException e) {
        throw e;
    } catch (Exception e) {
        log.error("Update failed: {}", e.getMessage(), e);
        throw new DatabaseOperationException("update", "Failed to update");
    }
}
```

### DELETE
```java
@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void deleteItem(@PathVariable String id) {
    try {
        log.info("Deleting item: {}", id);
        Item item = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item", "id", id));
        repository.deleteById(id);
        log.info("Deleted item: {}", id);
    } catch (ResourceNotFoundException e) {
        throw e;
    } catch (Exception e) {
        log.error("Delete failed: {}", e.getMessage(), e);
        throw new DatabaseOperationException("delete", "Failed to delete");
    }
}
```

## 6. Reactive/WebFlux Patterns

```java
public Mono<Data> fetchData(String id) {
    log.info("Fetching: {}", id);
    return webClient.get()
        .uri("/data/{id}", id)
        .retrieve()
        .onStatus(
            status -> status.isError(),
            response -> response.bodyToMono(String.class)
                .flatMap(body -> Mono.error(
                    new ExternalServiceException("API", response.statusCode().value(), body))))
        .bodyToMono(Data.class)
        .doOnSuccess(data -> log.info("Fetched: {}", data))
        .doOnError(error -> log.error("Fetch failed: {}", error.getMessage(), error));
}
```

## 7. Exception Types Quick Reference

| Exception | Status | When to Use |
|-----------|--------|-------------|
| ResourceNotFoundException | 404 | Resource not found in database |
| ValidationException | 400 | Invalid input/request data |
| ExternalServiceException | 502 | External API/service failure |
| DatabaseOperationException | 500 | Database operation failure |

## 8. What to Log

| Level | What | Example |
|-------|------|---------|
| INFO | Important business events | "User created", "Order processed" |
| DEBUG | Detailed information | "Request body: {...}" |
| WARN | Unusual but not error | "Deprecated API used" |
| ERROR | Errors & exceptions | "Database save failed" |

## 9. Common Mistakes to Avoid

| ❌ Don't | ✅ Do |
|---------|-------|
| `return null;` | `throw new ResourceNotFoundException(...)` |
| `System.out.println()` | `log.info()` |
| `items.get(0)` | Check `isEmpty()` first |
| `catch (Exception e) {}` | `catch (Exception e) { log.error(...); throw ...; }` |
| Return error strings | Throw exceptions |

## 10. Testing Error Handling

```bash
# Test 404
curl http://localhost:8080/api/products/invalid

# Test validation (empty list)
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '[]'

# Test success
curl http://localhost:8080/api/products
```

## Need More Details?

- See `EXCEPTION_HANDLING_IMPLEMENTATION.md` for full documentation
- See `exception/EXCEPTION_HANDLING_GUIDE.java` for comprehensive examples
- Check existing controllers for real implementation patterns
