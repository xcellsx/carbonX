package com.ecapybara.carbonx.repository;

import java.util.List;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.entity.Product;

public interface ProductRepository extends ArangoRepository<Product, String>{
  
  List<Product> findByName(String name);
}
