package com.ecapybara.carbonx.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;

import com.arangodb.springframework.repository.ArangoRepository;

import com.ecapybara.carbonx.model.Product;

public interface ProductRepository extends ArangoRepository<Product, String>{

  @NonNull Optional<Product> findById(@NonNull String id);

  List<Product> findByName(Sort sort, String name);

  List<Product> findByType(Sort sort, String type);

  List<Product> findByNameAndType(Sort sort, String name, String type);

  void removeById(String id);
}