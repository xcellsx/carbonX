package com.ecapybara.CarbonX.repository;

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.CarbonX.entity.ChildOf;

public interface ChildOfRepository extends ArangoRepository<ChildOf, String> {

}