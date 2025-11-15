package com.ecapybara.carbonx.controller;

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

import com.ecapybara.carbonx.entity.DigitalProductPassport;
import com.ecapybara.carbonx.entity.Product;
import com.ecapybara.carbonx.repository.ProductInventoryRepository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVReader;

@RestController
@RequestMapping("/api/inventory")
public class ProductInventoryController {

    @Autowired
    private ProductInventoryRepository repo;

    // Add ObjectMapper for parsing JSON in the new PUT method
    private ObjectMapper objectMapper = new ObjectMapper();

    // GET: List all products for a user
    @GetMapping("/user/{userId}")
    public List<Product> getUserInventory(@PathVariable Long userId) {
        return repo.findByUserId(userId);
    }

    // POST (JSON): Add new product (no file)
    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        return repo.save(product);
    }

    // POST (multipart): Upload BoM file, save file, create DPP, add to inventory
    @PostMapping(value = "/bom-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Product uploadBOM(
            @RequestParam("userId") Long userId,
            @RequestParam("productNature") String productNature,
            @RequestParam("file") MultipartFile file
    ) throws Exception {
        // 1. Save file to "uploads" directory
        String uploadDir = "uploads";
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String originalFilename = file.getOriginalFilename();
        Path filePath = uploadPath.resolve(originalFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // 2. Parse the BOM CSV into DPP items
        List<DigitalProductPassport> dppItems = parseBoMToDPP(file);
        ObjectMapper mapper = new ObjectMapper();
        // Ensure the initial DPP data includes fields for lcaValue
        List<Map<String, Object>> dppItemsWithLca = new ArrayList<>();
        for (DigitalProductPassport item : dppItems) {
            Map<String, Object> map = new HashMap<>();
            map.put("component", item.getComponent());
            map.put("process", item.getProcess());
            map.put("weightKg", item.getWeightKg());
            map.put("lcaValue", null); // Initialize lcaValue as null
            dppItemsWithLca.add(map);
        }
        String dppJson = mapper.writeValueAsString(dppItemsWithLca);


        // 3. Save ProductInventory record
        Product entry = new Product(productNature);
        entry.setUserId(userId);
        entry.setUploadedFile(originalFilename); // just the filename, file stored on disk
        entry.setDppData(dppJson);

        return repo.save(entry);
    }

    // FILE DOWNLOAD: GET endpoint to download a file from uploads/
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

    // Helper: Parse uploaded CSV (BoM) into a list of DPPItems
    private List<DigitalProductPassport> parseBoMToDPP(MultipartFile file) throws Exception {
        List<DigitalProductPassport> dppItems = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] nextLine;
            reader.readNext(); // skip header
            int idx = 1;
            while ((nextLine = reader.readNext()) != null) {
                 if (nextLine.length >= 3) { // Ensure row has enough columns
                    String component = "Component " + idx; // Or use nextLine[0] if it exists
                    String process = nextLine[1].trim();
                    try {
                        double weight = Double.parseDouble(nextLine[2]);
                        dppItems.add(new DigitalProductPassport(component, process, weight));
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

    // PUT: Updates the DPP (Bill of Materials) data
    @PutMapping("/dpp/{productId}")
    public ResponseEntity<Product> updateProductDpp(
            @PathVariable Long productId,
            @RequestBody String dppDataString // Receive the raw JSON string from the frontend
    ) {
        Product inv = repo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        // 1. Save the new dppData string
        inv.setDppData(dppDataString);

        // 2. Calculate the total LCA from this new data
        double totalLca = 0.0;
        try {
            // Define the type we expect: a List of Maps
            TypeReference<List<Map<String, Object>>> typeRef = new TypeReference<>() {};
            List<Map<String, Object>> dppItems = objectMapper.readValue(dppDataString, typeRef);
            
            for (Map<String, Object> item : dppItems) {
                // Check if the item has an lcaValue and it's a number
                if (item.get("lcaValue") != null && item.get("lcaValue") instanceof Number) {
                    totalLca += ((Number) item.get("lcaValue")).doubleValue();
                }
            }
        } catch (Exception e) {
            // If parsing fails, log it but don't fail the entire save
            System.err.println("Error parsing dppData to calculate total LCA for product " + productId + ": " + e.getMessage());
        }

        // 3. Save the new total
        inv.setLcaResult(totalLca);

        // 4. Save to repository and return
        UserProduct updatedInventory = repo.save(inv);
        return ResponseEntity.ok(updatedInventory);
    }

    // --- NEW METHOD ---
    // DELETE: Delete a product by its ID
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long productId) {
        UserProduct product = repo.findById(productId).orElse(null);
        
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Optional: Delete associated file from "uploads" directory
        if (product.getUploadedFile() != null && !product.getUploadedFile().isEmpty()) {
            try {
                Path filePath = Paths.get("uploads").resolve(product.getUploadedFile()).normalize();
                Files.deleteIfExists(filePath);
            } catch (Exception e) {
                System.err.println("Failed to delete file for product " + productId + ": " + e.getMessage());
                // Don't fail the request, just log the error
            }
        }

        repo.deleteById(productId);
        return ResponseEntity.ok().build(); // Return 200 OK with no body
    }
}