package com.ecapybara.CarbonX.runner;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.ComponentScan;
import com.arangodb.springframework.core.ArangoOperations;
import com.ecapybara.CarbonX.repository.CharacterRepository;
import com.ecapybara.CarbonX.entities.Character;

import java.util.Collection;
import java.util.Optional;
import java.util.Arrays;

@ComponentScan("com.ecapybara.CarbonX")
public class CrudRunner implements CommandLineRunner {

  @Autowired
  private ArangoOperations operations;
  @Autowired
  private CharacterRepository repository;

  @Override
  public void run(final String... args) throws Exception {
    // first drop the database so that we can run this multiple times with the same dataset
    operations.dropDatabase();

    // save a single entity in the database
    // there is no need of creating the collection first. This happen automatically
    final Character nedStark = new Character("Ned", "Stark", true, 41);
    repository.save(nedStark);
    // the generated id from the database is set in the original entity
    System.out.println(String.format("Ned Stark saved in the database with id: '%s'", nedStark.getId()));

    // let us take a look whether we can find Ned Stark in the database
    final Optional<Character> foundNed = repository.findById(nedStark.getId());
    assert foundNed.isPresent();
    System.out.println(String.format("Found %s", foundNed.get()));
    
    // Update the entity Ned Stark
    nedStark.setAlive(false);
    repository.save(nedStark);
    final Optional<Character> deadNed = repository.findById(nedStark.getId());
    assert deadNed.isPresent();
    System.out.println(String.format("The 'alive' flag of the persisted Ned Stark is now '%s'",deadNed.get().isAlive()));

    // Save and read multiple entities
    Collection<Character> createCharacters = createCharacters();
    System.out.println(String.format("Save %s additional characters",createCharacters.size()));
    repository.saveAll(createCharacters);

    long count = repository.count();
    System.out.println(String.format("A total of %s characters are persisted in the database", count));
    
  }

  public static Collection<Character> createCharacters(){
      return Arrays.asList(
              new Character("Robert","Baratheon",false),
              new Character("Jaime","Lannister",true,36),
              new Character("Catelyn","Stark",false,40),
              new Character("Cersei","Lannister",true,36),
              new Character("Daenerys","Targaryen",true,16),
              new Character("Jorah","Mormont",false),
              new Character("Petyr","Baelish",false),
              new Character("Viserys","Targaryen",false),
              new Character("Jon","Snow",true,16),
              new Character("Sansa","Stark",true,13),
              new Character("Arya","Stark",true,11),
              new Character("Robb","Stark",false),
              new Character("Theon","Greyjoy",true,16),
              new Character("Bran","Stark",true,10),
              new Character("Joffrey","Baratheon",false,19),
              new Character("Sandor","Clegane",true),
              new Character("Tyrion","Lannister",true,32),
              new Character("Khal","Drogo",false),
              new Character("Tywin","Lannister",false),
              new Character("Davos","Seaworth",true,49),
              new Character("Samwell","Tarly",true,17),
              new Character("Stannis","Baratheon",false),
              new Character("Melisandre",null,true),
              new Character("Margaery","Tyrell",false),
              new Character("Jeor","Mormont",false),
              new Character("Bronn",null,true),
              new Character("Varys",null,true),
              new Character("Shae",null,false),
              new Character("Talisa","Maegyr",false),
              new Character("Gendry",null,false),
              new Character("Ygritte",null,false),
              new Character("Tormund","Giantsbane",true),
              new Character("Gilly",null,true),
              new Character("Brienne","Tarth",true,32),
              new Character("Ramsay","Bolton",true),
              new Character("Ellaria","Sand",true),
              new Character("Daario","Naharis",true),
              new Character("Missandei",null,true),
              new Character("Tommen","Baratheon",true),
              new Character("Jaqen","H'ghar",true),
              new Character("Roose","Bolton",true),
              new Character("The High Sparrow",null,true));
      }
}
