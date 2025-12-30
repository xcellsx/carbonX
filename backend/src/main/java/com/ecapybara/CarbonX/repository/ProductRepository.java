package com.ecapybara.carbonx.repository;

import java.util.List;
import java.util.Optional;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.model.Product;

public interface ProductRepository extends ArangoRepository<Product, String>{
  
  Optional<Product> findByName(String name);

  List<Product> findByNameContainingIgnoreCase(String name); //check whether ArangoDB supports this search format criteria by default

  public List<Product> findAll();
}
