package com.ecapybara.carbonx.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;

import com.arangodb.springframework.annotation.Query;
import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.model.issb.Output;
import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.model.issb.Product;

public interface OutputRepository extends ArangoRepository<Output, String> {

  @NonNull Optional<Output> findById(@NonNull String id);

  List<Output> findByProcess(Sort sort, Process process);
  
  List<Output> findByProcessName(Sort sort, String processName);

  List<Output> findByProduct(Sort sort, Product product);

  List<Output> findByProductName(Sort sort, String productName);

  List<Output> findByProcessNameAndProductName(Sort sort, String fromProcessName, String toProductName);

  @Query("FOR output IN outputs FILTER output._from == @documentId RETURN output._key") // returns a list of keys of the connected edges
  Iterable<String> findConnectedOutputs(@Param("documentId") String documentId);

  void removeById(String id);
}
