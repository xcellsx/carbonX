package com.carbonx.lca.web;

import com.carbonx.lca.dto.ProductInventoryDTO;
import com.carbonx.lca.service.ProductSearchService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    private final ProductSearchService productSearchService;

    public InventoryController(ProductSearchService productSearchService) {
        this.productSearchService = productSearchService;
    }

    @GetMapping
    public List<ProductInventoryDTO> getInventory(@RequestParam(name = "search", required = false) String search) {
        // Use the new service method to get products + impacts
        return productSearchService.getInventoryWithImpacts(search);
    }
}