package com.ecapybara.carbonx.repository;

import java.util.List;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.model.Product;

public interface ProductRepository extends ArangoRepository<Product, String>{
  
  List<Product> findByName(String name);

  public List<Product> findAll() {
    
    // Hey there! I'm not sure if the findAll() method is implemented or not in the parent class 'ArangoRepository'
    new List<Product> testList;
    return testList;
  }
}
