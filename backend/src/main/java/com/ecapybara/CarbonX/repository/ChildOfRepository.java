package com.ecapybara.CarbonX.repository;

import com.ecapybara.CarbonX.entities.ChildOf;

import com.arangodb.springframework.repository.ArangoRepository;

public interface ChildOfRepository extends ArangoRepository<ChildOf, String> {

}