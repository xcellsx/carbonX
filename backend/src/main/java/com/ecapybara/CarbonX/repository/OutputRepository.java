package com.ecapybara.CarbonX.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;

import com.arangodb.springframework.annotation.Query;
import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.CarbonX.model.issb.Output;
import com.ecapybara.CarbonX.model.issb.Process;
import com.ecapybara.CarbonX.model.issb.Product;

public interface OutputRepository extends ArangoRepository<Output, String> {

  @NonNull Optional<Output> findById(@NonNull String id);

  List<Output> findByProcess(Sort sort, Process process);
  
  List<Output> findByProcessName(Sort sort, String processName);

  List<Output> findByProduct(Sort sort, Product product);

  List<Output> findByProductName(Sort sort, String productName);

  List<Output> findByProcessNameAndProductName(Sort sort, String fromProcessName, String toProductName);

  @Query("FOR output IN outputs FILTER output._from == @documentId RETURN output._key") // returns a list of keys of the connected edges
  Iterable<String> findConnectedOutputs(@Param("documentId") String documentId);

  /** Find output edge by vertex document ids (one-way: process → product). */
  @Query("FOR o IN outputs FILTER o._from == @fromId AND o._to == @toId LIMIT 1 RETURN o")
  List<Output> findByFromAndTo(@Param("fromId") String processId, @Param("toId") String productId);

  void removeById(String id);
}
