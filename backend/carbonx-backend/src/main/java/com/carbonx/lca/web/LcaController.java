package com.carbonx.lca.web;

import com.carbonx.lca.service.ProductSearchService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/lca")
@CrossOrigin(origins = "*") // Allows requests from your frontend
public class LcaController {

    private final ProductSearchService productSearchService;

    public LcaController(ProductSearchService productSearchService) {
        this.productSearchService = productSearchService;
    }

@PostMapping("/calculate")
public Map<String, Object> calculateLca(@RequestBody Map<String, String> payload) {
    String productName = payload.get("productName");
    // Use the new method that saves the data
    return productSearchService.searchAndSave(productName);
}
}