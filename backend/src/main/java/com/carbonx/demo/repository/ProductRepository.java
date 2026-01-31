package com.carbonx.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carbonx.demo.model.Product;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByNameContainingIgnoreCase(String name);
}
