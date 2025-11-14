package com.ecapybara.CarbonX.runner;

import com.ecapybara.CarbonX.entity.Character;
import com.ecapybara.CarbonX.entity.ChildOf;
import com.ecapybara.CarbonX.repository.CharacterRepository;
import com.ecapybara.CarbonX.repository.ChildOfRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.ComponentScan;

import java.util.Arrays;

@ComponentScan("com.ecapybara.CarbonX")
public class RelationsRunner implements CommandLineRunner {
  @Autowired
  private CharacterRepository characterRepo;
  @Autowired
  private ChildOfRepository childOfRepo;

  @Override
  public void run(final String... args) throws Exception {
    System.out.println("------------- # Relational Queries # -------------");
    characterRepo.saveAll(CrudRunner.createCharacters());

    // Creates some relations for the Starks and Lannisters
    Character ned = characterRepo.findByNameAndSurname("Ned", "Stark").get();
    Character catelyn = characterRepo.findByNameAndSurname("Catelyn", "Stark").get();
    Character robb = characterRepo.findByNameAndSurname("Robb", "Stark").get();
    childOfRepo.saveAll(Arrays.asList(new ChildOf(robb, ned), new ChildOf(robb, catelyn)));
    Character sansa = characterRepo.findByNameAndSurname("Sansa", "Stark").get();
    childOfRepo.saveAll(Arrays.asList(new ChildOf(sansa, ned), new ChildOf(sansa, catelyn)));
    Character arya = characterRepo.findByNameAndSurname("Arya", "Stark").get();
    childOfRepo.saveAll(Arrays.asList(new ChildOf(arya, ned), new ChildOf(arya, catelyn)));
    Character bran = characterRepo.findByNameAndSurname("Bran", "Stark").get();
    childOfRepo.saveAll(Arrays.asList(new ChildOf(bran, ned), new ChildOf(bran, catelyn)));
    Character jon = characterRepo.findByNameAndSurname("Jon", "Snow").get();
    childOfRepo.save(new ChildOf(jon, ned));

    Character tywin = characterRepo.findByNameAndSurname("Tywin", "Lannister").get();
    Character jaime = characterRepo.findByNameAndSurname("Jaime", "Lannister").get();
    childOfRepo.save(new ChildOf(jaime, tywin));
    Character cersei = characterRepo.findByNameAndSurname("Cersei", "Lannister").get();
    childOfRepo.save(new ChildOf(cersei, tywin));
    Character joffrey = characterRepo.findByNameAndSurname("Joffrey", "Baratheon").get();
    childOfRepo.saveAll(Arrays.asList(new ChildOf(joffrey, jaime), new ChildOf(joffrey, cersei)));
    Character tyrion = characterRepo.findByNameAndSurname("Tyrion", "Lannister").get();
    childOfRepo.save(new ChildOf(tyrion, tywin));
    
    // Read relations within entity
    Character nedStark = characterRepo.findByNameAndSurname("Ned", "Stark").get();
    System.out.println(String.format("## These are the children of %s:", nedStark));
    nedStark.getChildren().forEach(System.out::println);
  }
}
