package com.ecapybara.CarbonX.repository;

import java.util.List;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.CarbonX.model.Product;

public interface ProductRepository extends ArangoRepository<Product, String>{
  
  List<Product> findByName(String name);
}
