// src/main/java/com/carbonx/demo/repository/ProductInventoryRepository.java

package com.carbonx.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carbonx.demo.model.ProductInventory;

public interface ProductInventoryRepository extends JpaRepository<ProductInventory, Long> {
    List<ProductInventory> findByUserId(Long userId); // fetch all products for user
}
