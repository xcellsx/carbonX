package com.ecapybara.carbonx.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.model.basic.Company;

public interface CompanyRepository extends ArangoRepository<Company, String> {
  @NonNull Optional<Company> findById(@NonNull String id);

  List<Company> findByName(Sort sort, String name);

  List<Company> findBySector(Sort sort, String sector);

  List<Company> findByIndustry(Sort sort, String industry);

  List<Company> findBySectorAndIndustry(Sort sort, String sector, String industry);
  
  void removeById(String id);

}
