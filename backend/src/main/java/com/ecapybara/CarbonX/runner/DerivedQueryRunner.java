package com.ecapybara.CarbonX.runner;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.ComponentScan;

import com.ecapybara.CarbonX.entity.Character;
import com.ecapybara.CarbonX.repository.CharacterRepository;

// To find the complete list of part types for derived queries, refer to the link below:
// https://docs.arango.ai/ecosystem/integrations/spring-data-arangodb/reference-version-4/repositories/queries/derived-queries/

@ComponentScan("com.ecapybara.CarbonX")
public class DerivedQueryRunner implements CommandLineRunner{
  @Autowired
  private CharacterRepository repository;

  @Override
  public void run(final String... args) throws Exception {
    System.out.println("------------- # Derived Queries # -------------");

    // Simple findBySurname method
    System.out.println("## Find all characters with surname 'Lannister'");
    Iterable<Character> lannisters = repository.findBySurname("Lannister");
    lannisters.forEach(System.out::println);

    // More complex query methods
    System.out.println("## Find top 2 Lannnisters ordered by age");
    List<Character> top2 = repository.findTop2DistinctBySurnameIgnoreCaseOrderByAgeDesc("lannister");
    top2.forEach(System.out::println);

    System.out.println("## Find all characters which name is 'Bran' or 'Sansa' and it's surname ends with 'ark' and are between 10 and 16 years old");
    Collection<Character> youngStarks = repository.findBySurnameEndsWithAndAgeBetweenAndNameInAllIgnoreCase("ark", 10, 16, new String[]{"Bran", "Sansa"});
    youngStarks.forEach(System.out::println);

    System.out.println("## Find a single character by name & surname");
    Optional<Character> tyrion = repository.findByNameAndSurname("Tyrion", "Lannister");
    tyrion.ifPresent(c -> System.out.println(String.format("Found %s", c)));
  }
}
