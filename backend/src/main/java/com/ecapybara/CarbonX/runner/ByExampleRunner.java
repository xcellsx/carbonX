package com.ecapybara.CarbonX.runner;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.domain.Example;

import com.ecapybara.CarbonX.repository.CharacterRepository;
import com.ecapybara.CarbonX.entities.Character;

import java.util.Optional;

@ComponentScan("com.ecapybara.CarbonX")
public class ByExampleRunner implements CommandLineRunner {
  @Autowired
  private CharacterRepository repository;

  @Override
  public void run(final String... args) throws Exception {
    // Single entity query by example
    System.out.println("# Query by example");
    final Character nedStark = new Character("Ned", "Stark", false, 41);
    System.out.println(String.format("## Find character which exactly match %s",nedStark));
    Optional<Character> foundNedStark = repository.findOne(Example.of(nedStark));
    System.out.println(String.format("Found %s", foundNedStark.get()));

    // Multiple entity query by example
    System.out.println("## Find all dead Starks");
    Iterable<Character> allDeadStarks = repository.findAll(Example.of(new Character(null, "Stark", false)));
    allDeadStarks.forEach(System.out::println);
  }
}
