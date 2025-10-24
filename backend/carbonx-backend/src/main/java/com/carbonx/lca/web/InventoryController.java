package com.carbonx.lca.web;

import com.carbonx.lca.domain.InventoryItem;
import com.carbonx.lca.repo.InventoryItemRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory") // Base path for all inventory-related endpoints
public class InventoryController {

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    /**
     * Fetches all inventory items.
     * Mapped to GET /api/inventory
     */
    @GetMapping
    public List<InventoryItemDTO> getAllInventoryItems() {
        return inventoryItemRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Adds a new inventory item.
     * Mapped to POST /api/inventory
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryItemDTO addInventoryItem(@RequestBody AddInventoryItemRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item name cannot be blank.");
        }
        InventoryItem newItem = new InventoryItem();
        newItem.setName(request.getName());
        newItem.setCategory(request.getCategory());
        newItem.setLocation(request.getLocation());
        newItem.setWeight(request.getWeight() != null ? request.getWeight() : 1.0); // Default weight if not provided
        newItem.setCreatedAt(OffsetDateTime.now());
        newItem.setUpdatedAt(OffsetDateTime.now());
        InventoryItem savedItem = inventoryItemRepository.save(newItem);
        return mapToDTO(savedItem);
    }

    /**
     * Updates the weight of an existing inventory item.
     * Mapped to PUT /api/inventory/{id}/weight
     */
    @PutMapping("/{id}/weight")
    public InventoryItemDTO updateWeight(@PathVariable UUID id, @RequestBody UpdateWeightRequest request) {
         if (request.getWeight() == null || request.getWeight() <= 0) {
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Weight must be a positive value.");
         }
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found"));
        item.setWeight(request.getWeight());
        item.setUpdatedAt(OffsetDateTime.now());
        InventoryItem updatedItem = inventoryItemRepository.save(item);
        return mapToDTO(updatedItem);
    }

    /**
     * Maps an inventory item to an openLCA process ID.
     * Mapped to PUT /api/inventory/{id}/map
     */
     @PutMapping("/{id}/map")
     public InventoryItemDTO mapToProcess(@PathVariable UUID id, @RequestBody MapProcessRequest request) {
         if (request.getProcessId() == null || request.getProcessId().isBlank()) {
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Process ID cannot be blank.");
         }
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found"));
        item.setProcessId(request.getProcessId());
        item.setProcessName(request.getProcessName()); // Store the name for display purposes
        item.setUpdatedAt(OffsetDateTime.now());
        InventoryItem updatedItem = inventoryItemRepository.save(item);
        return mapToDTO(updatedItem);
     }

    /**
     * Deletes an inventory item.
     * Mapped to DELETE /api/inventory/{id}
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteInventoryItem(@PathVariable UUID id) {
        if (!inventoryItemRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found");
        }
        inventoryItemRepository.deleteById(id);
    }

    // --- Helper DTO Classes ---

    @Data
    public static class AddInventoryItemRequest {
        @NotBlank
        private String name;
        private String category;
        private String location;
        private Double weight; // Optional, defaults to 1.0
    }

    @Data
    public static class UpdateWeightRequest {
        @NotNull
        private Double weight;
    }

     @Data
     public static class MapProcessRequest {
         @NotBlank
         private String processId;
         private String processName; // Optional: Name of the process being mapped
     }

    @Data
    public static class InventoryItemDTO {
        private UUID id;
        private String name;
        private String category;
        private String location;
        private Double weight;
        private String processId;
        private String processName;
        private Double lcaResult;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
    }

    // --- Helper Mapping Method ---

    private InventoryItemDTO mapToDTO(InventoryItem item) {
        InventoryItemDTO dto = new InventoryItemDTO();
        BeanUtils.copyProperties(item, dto); // Copies matching fields
        return dto;
    }
}
