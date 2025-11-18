package com.carbonx.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carbonx.demo.model.ProductInventory;

public interface ProductInventoryRepository extends JpaRepository<ProductInventory, Long> {
    // Find all inventory items for a specific user by their ID
    
    // --- THIS IS THE FIX ---
    // Change 'Long userId' to 'String userId' to match the entity
    List<ProductInventory> findByUserId(String userId); 
}