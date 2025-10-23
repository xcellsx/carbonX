package com.carbonx.lca.repo;

import com.carbonx.lca.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // This custom method will allow you to search for products by name
    List<Product> findByNameContainingIgnoreCase(String name);

}