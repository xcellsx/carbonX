package com.ecapybara.carbonx.repository;

import java.util.List;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.model.UserProductLca;

public interface UserProductLcaRepository extends ArangoRepository<UserProductLca, String> {

  List<UserProductLca> findByUserId(String userId);
}
