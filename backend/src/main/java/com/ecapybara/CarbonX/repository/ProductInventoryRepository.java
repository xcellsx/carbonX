package com.ecapybara.CarbonX.repository;

import java.util.List;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.CarbonX.model.Product;

public interface ProductInventoryRepository extends ArangoRepository<Product, String>{
  List<Product> findByUserId(String userId);
}
