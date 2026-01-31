// xcellsx/carbonx/carbonX-cells/backend/src/main/java/com/carbonx/demo/service/ProductService.java
package com.carbonx.demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.carbonx.demo.model.Product;
import com.carbonx.demo.repository.ProductRepository;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // Get all products (OpenLCA processes)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // Get product by OpenLCA process ID
    public Optional<Product> getProductById(String openLcaProcessId) {
        return productRepository.findById(openLcaProcessId);
    }

    // Create or update product (should only be called via sync or admin UI)
    public Product createOrUpdateProduct(Product product) {
        return productRepository.save(product);
    }

    // Update only selected fields
    public Optional<Product> updateProduct(String openLcaProcessId, Product updatedProduct) {
        Optional<Product> existingProduct = getProductById(openLcaProcessId);
        existingProduct.ifPresent(p -> {
            p.setName(updatedProduct.getName());
            // --- MODIFICATION ---
            p.setLocation(updatedProduct.getLocation());
            // --- REMOVED FIELDS ---
            // p.setDescription(updatedProduct.getDescription());
            // p.setUnit(updatedProduct.getUnit());
            // p.setCategory(updatedProduct.getCategory());
            // p.setCarbonFootprint(updatedProduct.getCarbonFootprint());
        });
        existingProduct.ifPresent(productRepository::save);
        return existingProduct;
    }

    public boolean deleteProduct(String openLcaProcessId) {
        if (productRepository.existsById(openLcaProcessId)) {
            productRepository.deleteById(openLcaProcessId);
            return true;
        }
        return false;
    }
}