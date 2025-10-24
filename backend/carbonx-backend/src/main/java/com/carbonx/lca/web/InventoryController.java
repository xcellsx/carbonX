package com.carbonx.lca.web;

import com.carbonx.lca.domain.InventoryItem;
import com.carbonx.lca.repo.InventoryItemRepository;
import com.carbonx.lca.service.LcaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryItemRepository inventoryItemRepository;
    private final LcaService lcaService;

    public InventoryController(InventoryItemRepository inventoryItemRepository, LcaService lcaService) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.lcaService = lcaService;
    }

    @GetMapping
    public List<InventoryItemDTO> getInventory() {
        return inventoryItemRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @PostMapping
    public InventoryItemDTO addInventoryItem(@RequestBody AddInventoryItemRequest req) {
        InventoryItem item = new InventoryItem();
        item.setName(req.name());
        item.setWeight(req.weight());
        item.setProcessId(req.processId());
        InventoryItem savedItem = inventoryItemRepository.save(item);
        return toDTO(savedItem);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInventoryItem(@PathVariable UUID id) {
        if (!inventoryItemRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        inventoryItemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/calculate")
    public InventoryItemDTO calculateLca(@PathVariable UUID id) {
        lcaService.calculateLcaAndSave(id);
        InventoryItem updatedItem = inventoryItemRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found after calculation"));
        return toDTO(updatedItem);
    }
    
    @PutMapping("/{id}/weight")
    public InventoryItemDTO updateWeight(@PathVariable UUID id, @RequestBody UpdateWeightRequest req) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory item not found"));
        item.setWeight(req.weight());
        inventoryItemRepository.save(item);
        
        lcaService.calculateLcaAndSave(id);
        
        InventoryItem finalItem = inventoryItemRepository.findById(id).get();
        return toDTO(finalItem);
    }

    private InventoryItemDTO toDTO(InventoryItem item) {
        return new InventoryItemDTO(
            item.getId(),
            item.getName(),
            item.getWeight(),
            item.getDppFile(),
            item.getLcaResult(),
            item.getProcessId()
        );
    }

    public record AddInventoryItemRequest(String name, double weight, String processId) {}
    public record UpdateWeightRequest(double weight) {}

    public record InventoryItemDTO(
            UUID id,
            String name,
            double weight,
            String dppFile,
            Double lcaResult,
            String processId
    ) {}
}