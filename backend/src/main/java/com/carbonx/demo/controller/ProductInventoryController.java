// ... (imports remain the same, plus new Map import if needed)
package com.carbonx.demo.controller;

import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping; 
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.carbonx.demo.model.DPPItem;
import com.carbonx.demo.model.ProductInventory;
import com.carbonx.demo.repository.ProductInventoryRepository;
import com.carbonx.demo.service.ProductInventoryService; 
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVReader;

@RestController
@RequestMapping("/api/inventory")
public class ProductInventoryController {

    @Autowired
    private ProductInventoryRepository repo;

    @Autowired
    private ProductInventoryService productInventoryService;

    private ObjectMapper objectMapper = new ObjectMapper();

    // ... (GET /user/{userId} remains the same) ...
    @GetMapping("/user/{userId}")
    public List<ProductInventory> getUserInventory(@PathVariable String userId) {
        return repo.findByUserId(userId);
    }

    // ... (POST addProduct remains the same) ...
    @PostMapping
    public ProductInventory addProduct(@RequestBody ProductInventory product) {
        return repo.save(product);
    }

    // ... (POST /bom-upload remains the same) ...
    @PostMapping(value = "/bom-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductInventory uploadBOM(
            @RequestParam("userId") String userId, 
            @RequestParam("productName") String productName,
            @RequestParam("file") MultipartFile file
    ) throws Exception {
        String uploadDir = "uploads";
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String originalFilename = file.getOriginalFilename();
        Path filePath = uploadPath.resolve(originalFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        List<DPPItem> dppItems = parseBoMToDPP(file);
        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> dppItemsWithLca = new ArrayList<>();
        for (DPPItem item : dppItems) {
            Map<String, Object> map = new HashMap<>();
            map.put("component", item.getComponent());
            map.put("process", item.getProcess());
            map.put("weightKg", item.getWeightKg());
            map.put("lcaValue", null);
            dppItemsWithLca.add(map);
        }
        String dppJson = mapper.writeValueAsString(dppItemsWithLca);

        ProductInventory entry = new ProductInventory();
        entry.setUserId(userId); 
        entry.setProductName(productName);
        entry.setUploadedFile(originalFilename); 
        entry.setDppData(dppJson);

        return repo.save(entry);
    }

    // ... (GET /file remains the same) ...
    @GetMapping("/file/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ... (parseBoMToDPP remains the same) ...
    private List<DPPItem> parseBoMToDPP(MultipartFile file) throws Exception {
        List<DPPItem> dppItems = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] nextLine;
            reader.readNext(); // skip header
            int idx = 1;
            while ((nextLine = reader.readNext()) != null) {
                if (nextLine.length >= 3) {
                    String component = "Component " + idx;
                    String process = nextLine[1].trim();
                    try {
                        double weight = Double.parseDouble(nextLine[2]);
                        dppItems.add(new DPPItem(component, process, weight));
                        idx++;
                    } catch (NumberFormatException e) { 
                        System.err.println("Skipping row due to invalid weight: " + String.join(",", nextLine));
                    }
                } else {
                    System.err.println("Skipping row due to insufficient columns: " + String.join(",", nextLine));
                }
            }
        }
        return dppItems;
    }

    // ... (PUT /dpp remains the same) ...
    @PutMapping("/dpp/{productId}")
    public ResponseEntity<ProductInventory> updateProductDpp(
            @PathVariable Long productId,
            @RequestBody String dppDataString 
    ) {
        ProductInventory inv = repo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        inv.setDppData(dppDataString);

        double totalLca = 0.0;
        try {
            TypeReference<List<Map<String, Object>>> typeRef = new TypeReference<>() {};
            List<Map<String, Object>> dppItems = objectMapper.readValue(dppDataString, typeRef);
            
            for (Map<String, Object> item : dppItems) {
                if (item.get("lcaValue") != null && item.get("lcaValue") instanceof Number) {
                    totalLca += ((Number) item.get("lcaValue")).doubleValue();
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing dppData to calculate total LCA for product " + productId + ": " + e.getMessage());
        }

        inv.setLcaResult(totalLca);
        ProductInventory updatedInventory = repo.save(inv);
        return ResponseEntity.ok(updatedInventory);
    }

    // --- POST /calculate (Full Product) remains the same ---
    @PostMapping("/calculate/{productId}")
    public ResponseEntity<ProductInventory> calculateProductLca(@PathVariable Long productId) {
        try {
            ProductInventory updatedProduct = productInventoryService.calculateLcaForProduct(productId);
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            System.err.println("Failed to calculate LCA for product " + productId + ": " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // --- NEW: POST /calculate-item (Single Item) ---
    @PostMapping("/calculate-item/{productId}")
    public ResponseEntity<ProductInventory> calculateItemLca(
            @PathVariable Long productId,
            @RequestBody Map<String, Object> payload
    ) {
        try {
            int itemIndex = (int) payload.get("itemIndex");
            double weight = ((Number) payload.get("weight")).doubleValue();

            ProductInventory updatedProduct = productInventoryService.calculateLcaForItem(productId, itemIndex, weight);
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            System.err.println("Failed to calculate item LCA for product " + productId + ": " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ... (DELETE remains the same) ...
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long productId) {
        ProductInventory product = repo.findById(productId).orElse(null);
        
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        
        if (product.getUploadedFile() != null && !product.getUploadedFile().isEmpty()) {
            try {
                Path filePath = Paths.get("uploads").resolve(product.getUploadedFile()).normalize();
                Files.deleteIfExists(filePath);
            } catch (Exception e) {
                System.err.println("Failed to delete file for product " + productId + ": " + e.getMessage());
            }
        }

        repo.deleteById(productId);
        return ResponseEntity.ok().build();
    }
}