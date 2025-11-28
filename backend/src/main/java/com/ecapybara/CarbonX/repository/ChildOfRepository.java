package com.ecapybara.carbonx.repository;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.carbonx.model.ChildOf;

public interface ChildOfRepository extends ArangoRepository<ChildOf, String> {

}
