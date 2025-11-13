package com.ecapybara.CarbonX.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;  

import com.arangodb.springframework.repository.ArangoRepository;
import com.ecapybara.CarbonX.entities.Character;

// Stores data pertaining to 'Character' objects
public interface CharacterRepository extends ArangoRepository<Character, String> {
  
  Collection<Character> findBySurname(String surname);

  List<Character> findTop2DistinctBySurnameIgnoreCaseOrderByAgeDesc(String surname);

  Collection<Character> findBySurnameEndsWithAndAgeBetweenAndNameInAllIgnoreCase(
    String suffix,
    int lowerBound,
    int upperBound,
    String[] nameList);

  Optional<Character> findByNameAndSurname(String name, String surname);
}
