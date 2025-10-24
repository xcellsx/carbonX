package com.carbonx.lca.web;

import com.carbonx.lca.domain.InventoryItem;
import com.carbonx.lca.repo.InventoryItemRepository;
import com.carbonx.lca.service.ProductSearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional; // Import Transactional
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/lca")
@CrossOrigin(origins = "*") // Allows requests from your frontend
public class LcaController {

    private static final Logger log = LoggerFactory.getLogger(LcaController.class);

    private final ProductSearchService productSearchService;
    private final InventoryItemRepository inventoryItemRepository;


    public LcaController(ProductSearchService productSearchService, InventoryItemRepository inventoryItemRepository) {
        this.productSearchService = productSearchService;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    /**
     * Calculates the LCA for a specific InventoryItem identified by its ID.
     * Fetches the product name and WEIGHT associated with the item and calls the service.
     * Updates the InventoryItem with the result.
     *
     * @param id The ID of the InventoryItem.
     * @return A Map containing the calculation status, message, impact value, and unit.
     */
    @PostMapping("/calculate/{id}")
    @Transactional // Added Transactional for read-update-save consistency
    public ResponseEntity<Map<String, Object>> calculateLcaAndSave(@PathVariable("id") Long id) {
        log.info("Request received to calculate LCA for inventory item ID: {}", id);

        // 1. Find the InventoryItem
        Optional<InventoryItem> itemOpt = inventoryItemRepository.findById(id);
        if (itemOpt.isEmpty()) {
            log.warn("LCA calculation failed: Inventory item with ID {} not found", id);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item with ID " + id + " not found");
        }
        InventoryItem item = itemOpt.get();

        // 2. Ensure the associated product exists and has a name AND GET THE WEIGHT
        if (item.getProduct() == null || item.getProduct().getName() == null || item.getProduct().getName().isEmpty()) {
             log.error("LCA calculation failed for inventory item ID {}: Associated product or product name is missing.", id);
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inventory item " + id + " is missing associated product information.");
        }
        String productName = item.getProduct().getName();
        BigDecimal weight = item.getWeight(); // Get the weight from the item
        log.debug("Found inventory item {}. Product: '{}', Weight: {}", id, productName, weight);


        try {
            // 3. Call the service, passing the weight
            Map<String, Object> calcResult = productSearchService.searchAndSave(productName, weight); // Pass weight
            log.info("LCA calculation successful for inventory item ID {}.", id);

            // 4. Update the InventoryItem entity with the direct results
            Object impactValueObj = calcResult.get("climateChangeImpact");
            Object impactUnitObj = calcResult.get("impactUnit");

            if (impactValueObj instanceof BigDecimal impactValue && impactUnitObj instanceof String impactUnit) {
                 item.setClimateChangeImpact(impactValue);
                 item.setImpactUnit(impactUnit);
                 inventoryItemRepository.save(item); // Save the updated item
                 log.debug("Updated inventory item {} with impact: {} {}", id, impactValue, impactUnit);
            } else {
                 log.warn("Calculation for inventory item {} completed, but impact value/unit was not returned as expected.", id);
                 item.setClimateChangeImpact(null);
                 item.setImpactUnit(null);
                 inventoryItemRepository.save(item);

                 calcResult.put("status", "warning");
                 calcResult.put("message", "Calculation done, but primary impact value missing.");
                 return ResponseEntity.ok(calcResult);
            }

            // 5. Return the result to the frontend
            return ResponseEntity.ok(calcResult);

        } catch (Exception e) {
             log.error("LCA calculation failed for inventory item ID {}: {}", id, e.getMessage(), e);
             item.setClimateChangeImpact(null);
             item.setImpactUnit("Error");
             inventoryItemRepository.save(item);

             throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "LCA calculation failed: " + e.getMessage(), e);
        }
    }


    @GetMapping("/sync-products")
    public Map<String, Object> syncProducts() {
        return productSearchService.syncAllProductsFromOpenLCA();
    }
}

