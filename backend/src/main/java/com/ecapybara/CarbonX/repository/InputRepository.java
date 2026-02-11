package com.ecapybara.carbonx.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;

import com.arangodb.springframework.annotation.Query;
import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.model.issb.Input;
import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.model.issb.Product;

public interface InputRepository extends ArangoRepository<Input, String> {

  @NonNull Optional<Input> findById(@NonNull String id);

  List<Input> findByProduct(Sort sort, Product product);

  List<Input> findByProductName(Sort sort, String productName);

  List<Input> findByProcess(Sort sort, Process process);

  List<Input> findByProcessName(Sort sort, String processName);

  List<Input> findByProductNameAndProcessName(Sort sort, String fromProductName, String toProcessName);

  @Query("FOR input IN inputs FILTER input._to == @documentId RETURN input._key")
  Iterable<String> findConnectedInputs(@Param("documentId") String documentId);

  void removeById(String id);
}
