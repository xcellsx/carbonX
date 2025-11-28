package com.ecapybara.carbonx.repository;

import java.util.List;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.model.Product;

public interface ProductInventoryRepository extends ArangoRepository<Product, String>{
  List<Product> findByUserId(String userId);
}
