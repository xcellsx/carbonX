package com.ecapybara.CarbonX.exception;

/**
 * ========================================
 * EXCEPTION HANDLING & LOGGING GUIDE
 * ========================================
 * 
 * This guide shows how to properly handle exceptions and use logging
 * throughout the CarbonX application.
 * 
 * 
 * 1. CONTROLLER ERROR HANDLING
 * ========================================
 * 
 * Add @Slf4j annotation and throw custom exceptions:
 * 
 * @Slf4j
 * @RestController
 * @RequestMapping("/api/items")
 * public class ItemController {
 * 
 *     @Autowired
 *     private ItemRepository itemRepository;
 * 
 *     // GET by ID - throw ResourceNotFoundException if not found
 *     @GetMapping("/{id}")
 *     public Item getItem(@PathVariable String id) {
 *         log.info("Fetching item by ID: {}", id);
 *         return itemRepository.findById(id)
 *             .orElseThrow(() -> {
 *                 log.error("Item not found with ID: {}", id);
 *                 return new ResourceNotFoundException("Item", "id", id);
 *             });
 *     }
 * 
 *     // CREATE - validate input and handle errors
 *     @PostMapping
 *     @ResponseStatus(HttpStatus.CREATED)
 *     public Item createItem(@RequestBody Item item) {
 *         try {
 *             if (item.getName() == null || item.getName().isEmpty()) {
 *                 throw new ValidationException("name", "Item name is required");
 *             }
 * 
 *             log.info("Creating new item: {}", item.getName());
 *             itemRepository.save(item);
 *             log.info("Successfully created item with ID: {}", item.getId());
 *             return item;
 *             
 *         } catch (ValidationException e) {
 *             throw e; // Re-throw to let GlobalExceptionHandler handle it
 *         } catch (Exception e) {
 *             log.error("Unexpected error creating item: {}", e.getMessage(), e);
 *             throw new DatabaseOperationException("create", "Failed to create item");
 *         }
 *     }
 * 
 *     // UPDATE - check if exists, then update
 *     @PutMapping("/{id}")
 *     public Item updateItem(@PathVariable String id, @RequestBody Item itemRevision) {
 *         try {
 *             log.info("Updating item with ID: {}", id);
 *             
 *             Item item = itemRepository.findById(id)
 *                 .orElseThrow(() -> new ResourceNotFoundException("Item", "id", id));
 * 
 *             item.setName(itemRevision.getName());
 *             itemRepository.save(item);
 *             
 *             log.info("Successfully updated item with ID: {}", id);
 *             return item;
 *             
 *         } catch (ResourceNotFoundException e) {
 *             throw e;
 *         } catch (Exception e) {
 *             log.error("Error updating item {}: {}", id, e.getMessage(), e);
 *             throw new DatabaseOperationException("update", "Failed to update item");
 *         }
 *     }
 * 
 *     // DELETE - return 204 No Content on success
 *     @DeleteMapping("/{id}")
 *     @ResponseStatus(HttpStatus.NO_CONTENT)
 *     public void deleteItem(@PathVariable String id) {
 *         try {
 *             log.info("Deleting item with ID: {}", id);
 *             
 *             Item item = itemRepository.findById(id)
 *                 .orElseThrow(() -> new ResourceNotFoundException("Item", "id", id));
 * 
 *             itemRepository.deleteById(id);
 *             log.info("Successfully deleted item with ID: {}", id);
 *             
 *         } catch (ResourceNotFoundException e) {
 *             throw e;
 *         } catch (Exception e) {
 *             log.error("Error deleting item {}: {}", id, e.getMessage(), e);
 *             throw new DatabaseOperationException("delete", "Failed to delete item");
 *         }
 *     }
 * }
 * 
 * 
 * 2. SERVICE ERROR HANDLING (with WebClient)
 * ========================================
 * 
 * @Slf4j
 * @Service
 * public class ExternalApiService {
 * 
 *     @Autowired
 *     private WebClient webClient;
 * 
 *     // Reactive endpoint with error handling
 *     public Mono<MyData> fetchData(String id) {
 *         log.info("Fetching data from external API: {}", id);
 *         
 *         return webClient.get()
 *             .uri("/api/data/{id}", id)
 *             .retrieve()
 *             .onStatus(
 *                 status -> status.is4xxClientError() || status.is5xxServerError(),
 *                 response -> {
 *                     log.error("External API error - status: {}", response.statusCode());
 *                     return response.bodyToMono(String.class)
 *                         .flatMap(body -> Mono.error(new ExternalServiceException(
 *                             "ExternalAPI", response.statusCode().value(), body)));
 *                 })
 *             .bodyToMono(MyData.class)
 *             .doOnSuccess(data -> log.info("Successfully fetched data: {}", data))
 *             .doOnError(error -> {
 *                 if (error instanceof WebClientResponseException) {
 *                     WebClientResponseException wcre = (WebClientResponseException) error;
 *                     log.error("WebClient error - status: {}, body: {}", 
 *                         wcre.getStatusCode(), wcre.getResponseBodyAsString(), error);
 *                 } else {
 *                     log.error("Error fetching data: {}", error.getMessage(), error);
 *                 }
 *             });
 *     }
 * 
 *     // Blocking operation with error handling
 *     public void processData(MyData data) {
 *         try {
 *             log.info("Processing data: {}", data);
 *             
 *             if (data == null) {
 *                 throw new ValidationException("Data cannot be null");
 *             }
 *             
 *             // Processing logic here
 *             log.info("Successfully processed data");
 *             
 *         } catch (ValidationException e) {
 *             throw e;
 *         } catch (Exception e) {
 *             log.error("Error processing data: {}", e.getMessage(), e);
 *             throw new DatabaseOperationException("process", "Failed to process data");
 *         }
 *     }
 * }
 * 
 * 
 * 3. AVAILABLE CUSTOM EXCEPTIONS
 * ========================================
 * 
 * ResourceNotFoundException - when a resource is not found (404)
 *     throw new ResourceNotFoundException("Product", "id", productId);
 *     throw new ResourceNotFoundException("User not found");
 * 
 * ValidationException - for validation errors (400)
 *     throw new ValidationException("Email is required");
 *     throw new ValidationException("email", "Invalid email format");
 * 
 * ExternalServiceException - when external services fail (502)
 *     throw new ExternalServiceException("ArangoDB", "Connection timeout");
 *     throw new ExternalServiceException("PaymentAPI", 503, "Service unavailable");
 *     throw new ExternalServiceException("EmailService", "Failed to send", cause);
 * 
 * DatabaseOperationException - for database errors (500)
 *     throw new DatabaseOperationException("save", "Failed to save entity");
 *     throw new DatabaseOperationException("delete", "Failed to delete", cause);
 * 
 * 
 * 4. LOGGING BEST PRACTICES
 * ========================================
 * 
 * INFO level - Normal operations:
 *     log.info("User {} logged in successfully", username);
 *     log.info("Processing order {} with {} items", orderId, itemCount);
 * 
 * DEBUG level - Detailed debugging information:
 *     log.debug("Request payload: {}", requestBody);
 *     log.debug("Query parameters: {}", params);
 * 
 * WARN level - Warning conditions:
 *     log.warn("Deprecated API endpoint called: {}", endpoint);
 *     log.warn("Unusual activity detected for user: {}", userId);
 * 
 * ERROR level - Error conditions:
 *     log.error("Failed to connect to database");
 *     log.error("Error processing payment: {}", e.getMessage(), e);
 * 
 * 
 * 5. AVOID THESE COMMON MISTAKES
 * ========================================
 * 
 * ❌ DON'T: Return null when resource not found
 *     return repository.findById(id).orElse(null); // BAD
 * 
 * ✅ DO: Throw ResourceNotFoundException
 *     return repository.findById(id)
 *         .orElseThrow(() -> new ResourceNotFoundException("Item", "id", id));
 * 
 * ❌ DON'T: Use System.out.println for logging
 *     System.out.println("User created: " + user); // BAD
 * 
 * ✅ DO: Use Lombok @Slf4j logging
 *     log.info("User created: {}", user);
 * 
 * ❌ DON'T: Swallow exceptions silently
 *     try { ... } catch (Exception e) { } // BAD
 * 
 * ✅ DO: Log and re-throw or wrap in custom exception
 *     try { ... } catch (Exception e) {
 *         log.error("Error occurred: {}", e.getMessage(), e);
 *         throw new DatabaseOperationException("operation", "Failed", e);
 *     }
 * 
 * ❌ DON'T: Return error strings from DELETE endpoints
 *     return "Item not found"; // BAD
 * 
 * ✅ DO: Throw exception or return 204 No Content
 *     throw new ResourceNotFoundException("Item", "id", id);
 * 
 * ❌ DON'T: Call .get(0) without checking if list is empty
 *     item = items.get(0); // BAD - IndexOutOfBoundsException
 * 
 * ✅ DO: Check list size first or use stream
 *     if (items.isEmpty()) {
 *         throw new ResourceNotFoundException("No items found");
 *     }
 *     item = items.get(0);
 * 
 * 
 * 6. ERROR RESPONSE FORMAT
 * ========================================
 * 
 * All exceptions return standardized JSON error responses:
 * 
 * {
 *     "timestamp": "2026-01-30T12:34:56",
 *     "status": 404,
 *     "error": "Not Found",
 *     "message": "Product not found with id: '12345'",
 *     "path": "/api/products/12345",
 *     "exception": "ResourceNotFoundException"
 * }
 * 
 * For validation errors with multiple fields:
 * 
 * {
 *     "timestamp": "2026-01-30T12:34:56",
 *     "status": 400,
 *     "error": "Bad Request",
 *     "message": "Validation failed for request",
 *     "path": "/api/products",
 *     "exception": "MethodArgumentNotValidException",
 *     "validationErrors": [
 *         {
 *             "field": "name",
 *             "message": "Name is required"
 *         },
 *         {
 *             "field": "price",
 *             "message": "Price must be positive"
 *         }
 *     ]
 * }
 * 
 * 
 * 7. TESTING ERROR HANDLING
 * ========================================
 * 
 * Test that exceptions are thrown correctly:
 * 
 * @Test
 * public void testGetItem_NotFound() {
 *     when(itemRepository.findById("invalid")).thenReturn(Optional.empty());
 *     
 *     assertThrows(ResourceNotFoundException.class, () -> {
 *         itemController.getItem("invalid");
 *     });
 * }
 * 
 * @Test
 * public void testCreateItem_ValidationError() {
 *     Item item = new Item();
 *     item.setName(null); // Invalid
 *     
 *     assertThrows(ValidationException.class, () -> {
 *         itemController.createItem(item);
 *     });
 * }
 */
public class EXCEPTION_HANDLING_GUIDE {
    // This is a documentation class - no implementation needed
}
