package com.carbonx.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository; // Import List

import com.carbonx.demo.model.Product;

public interface ProductRepository extends JpaRepository<Product, String> {
    
    // Existing method
    Optional<Product> findByName(String name);

    // --- THIS IS THE FIX ---
    // Add this method to support search functionality in your controllers
    List<Product> findByNameContainingIgnoreCase(String name);
}