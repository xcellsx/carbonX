package com.carbonx.lca.web;

import com.carbonx.lca.domain.InventoryItem;
import com.carbonx.lca.domain.Product;
import com.carbonx.lca.repo.InventoryItemRepository;
import com.carbonx.lca.repo.ProductRepository;
import com.carbonx.lca.service.ProductSearchService; // Keep if needed for LCA triggering
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


import java.math.BigDecimal; // Import BigDecimal
import java.util.HashMap; // Import HashMap
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    private static final Logger log = LoggerFactory.getLogger(InventoryController.class);

    private final InventoryItemRepository inventoryItemRepository;
    private final ProductRepository productRepository;
    private final LcaController lcaController; // Inject LcaController to trigger calc


    public InventoryController(InventoryItemRepository inventoryItemRepository,
                               ProductRepository productRepository,
                               LcaController lcaController) { // Add LcaController
        this.inventoryItemRepository = inventoryItemRepository;
        this.productRepository = productRepository;
        this.lcaController = lcaController; // Assign LcaController
    }

    /**
     * DTO to represent an inventory item including product name.
     * Using a static inner class or separate DTO file is common.
     */
    public static class InventoryItemDTO {
        public Long id;
        public Long productId;
        public String name;
        public BigDecimal weight; // Add weight
        public BigDecimal climateChangeImpact;
        public String impactUnit;

        public InventoryItemDTO(InventoryItem item) {
            this.id = item.getId();
            this.productId = item.getProduct() != null ? item.getProduct().getId() : null;
            this.name = item.getProduct() != null ? item.getProduct().getName() : "Error: Missing Product";
            this.weight = item.getWeight(); // Include weight
            this.climateChangeImpact = item.getClimateChangeImpact();
            this.impactUnit = item.getImpactUnit();
        }
    }

    /**
     * Request body structure for adding an inventory item.
     */
    public static class AddInventoryItemRequest {
        public Long productId;
        public BigDecimal weight; // Add weight field
    }

    /**
     * Request body structure for updating weight.
     */
     public static class UpdateWeightRequest {
         public BigDecimal weight;
     }

    @GetMapping
    public List<InventoryItemDTO> getInventory(@RequestParam(name = "search", required = false) String search) {
        log.debug("Fetching inventory items. Search term: {}", search);
        List<InventoryItem> items;
        if (search != null && !search.isEmpty()) {
            // --- FIX: Correct method name used here ---
            items = inventoryItemRepository.findByProduct_NameContainingIgnoreCase(search);
            log.debug("Found {} items matching search term '{}'", items.size(), search);
        } else {
            items = inventoryItemRepository.findAll(); // Fetch all
            log.debug("Found {} total inventory items", items.size());
        }
        // Map to DTO to include product name
        return items.stream()
            .map(InventoryItemDTO::new)
            .collect(Collectors.toList());
    }

    @PostMapping
    @Transactional // Ensure product lookup and item saving are atomic
    public ResponseEntity<?> addInventoryItem(@RequestBody AddInventoryItemRequest request) {
        log.info("Request received to add product ID {} with weight {} to inventory", request.productId, request.weight);

        if (request.productId == null) {
            log.warn("Add inventory item failed: Product ID is missing.");
            return ResponseEntity.badRequest().body(Map.of("message", "Product ID is required."));
        }

        // Check if item with this product ID already exists
        if (inventoryItemRepository.existsByProductId(request.productId)) {
             log.warn("Add inventory item failed: Product ID {} already exists in inventory.", request.productId);
             return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Product already exists in inventory."));
        }

        // Find the full product details from the products table
        Optional<Product> productOpt = productRepository.findById(request.productId);
        if (productOpt.isEmpty()) {
            log.error("Add inventory item failed: Product with ID {} not found in products table.", request.productId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Product details not found for ID: " + request.productId));
        }
        Product product = productOpt.get();

        // Create and save the new inventory item, including weight
        InventoryItem newItem = new InventoryItem(product, request.weight); // Use constructor
        InventoryItem savedItem = inventoryItemRepository.save(newItem);
        log.info("Successfully added inventory item ID {} for product '{}'", savedItem.getId(), product.getName());

        // --- Trigger initial LCA calculation asynchronously ---
        // We don't wait for the calculation to finish before responding
        // Use try-catch to prevent calculation failure from breaking the add operation
        try {
            // Directly call the LcaController method (requires LcaController injection)
            lcaController.calculateLcaAndSave(savedItem.getId());
            log.info("Triggered initial LCA calculation for new inventory item ID {}", savedItem.getId());
        } catch (Exception e) {
             log.error("Failed to trigger initial LCA calculation for inventory item ID {}: {}", savedItem.getId(), e.getMessage());
             // Log the error but still return success for adding the item
        }


        // Return the created item's DTO
        return ResponseEntity.status(HttpStatus.CREATED).body(new InventoryItemDTO(savedItem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInventoryItem(@PathVariable Long id) {
        log.info("Request received to delete inventory item ID: {}", id);
        if (!inventoryItemRepository.existsById(id)) {
            log.warn("Delete failed: Inventory item ID {} not found", id);
            return ResponseEntity.notFound().build();
        }
        inventoryItemRepository.deleteById(id);
        log.info("Successfully deleted inventory item ID: {}", id);
        return ResponseEntity.noContent().build();
    }

     // --- New Endpoint to Update Weight ---
     @PutMapping("/{id}/weight")
     @Transactional
     public ResponseEntity<?> updateInventoryItemWeight(@PathVariable Long id, @RequestBody UpdateWeightRequest request) {
         log.info("Request received to update weight for inventory item ID {} to {}", id, request.weight);

         if (request.weight == null || request.weight.compareTo(BigDecimal.ZERO) <= 0) {
             log.warn("Update weight failed for ID {}: Invalid weight provided ({})", id, request.weight);
             return ResponseEntity.badRequest().body(Map.of("message", "Weight must be a positive number."));
         }

         Optional<InventoryItem> itemOpt = inventoryItemRepository.findById(id);
         if (itemOpt.isEmpty()) {
             log.warn("Update weight failed: Inventory item ID {} not found", id);
             return ResponseEntity.notFound().build();
         }

         InventoryItem item = itemOpt.get();
         item.setWeight(request.weight);
         // Reset impact as it's now invalid for the old weight
         item.setClimateChangeImpact(null);
         item.setImpactUnit(null);
         InventoryItem updatedItem = inventoryItemRepository.save(item);
         log.info("Successfully updated weight for inventory item ID {}", id);

         // --- Trigger Re-calculation ---
         try {
             lcaController.calculateLcaAndSave(updatedItem.getId());
             log.info("Triggered LCA re-calculation after weight update for inventory item ID {}", updatedItem.getId());
         } catch (Exception e) {
             log.error("Failed to trigger LCA re-calculation after weight update for inventory item ID {}: {}", updatedItem.getId(), e.getMessage());
             // Log the error, but the weight update was successful. Frontend will show 'Not Calculated'.
         }

         return ResponseEntity.ok(new InventoryItemDTO(updatedItem)); // Return updated item
     }
}

