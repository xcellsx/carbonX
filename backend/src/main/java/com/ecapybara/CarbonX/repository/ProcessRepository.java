package com.ecapybara.carbonx.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.model.issb.Process;

public interface ProcessRepository extends ArangoRepository<Process, String>{
  
  @NonNull Optional<Process> findById(@NonNull String id);

  List<Process> findByName(Sort sort, String name);

  List<Process> findByType(Sort sort, String type);

  List<Process> findByNameAndType(Sort sort, String name, String type);

  Collection<Process> findByNameContainingIgnoreCase(String name); //check whether ArangoDB supports this search format criteria by default
}