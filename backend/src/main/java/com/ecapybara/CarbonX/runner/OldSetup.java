package com.ecapybara.carbonx.runner;

import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;

import com.arangodb.springframework.core.ArangoOperations;
import com.ecapybara.carbonx.model.basic.EdgeDefinition;
import com.ecapybara.carbonx.model.basic.Graph;
import com.ecapybara.carbonx.model.issb.Input;
import com.ecapybara.carbonx.model.issb.Output;
import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.repository.*;
import com.ecapybara.carbonx.service.GraphService;
import com.ecapybara.carbonx.service.ImportExportService;

@Slf4j
@ComponentScan("com.ecapybara.carbonx")
public class OldSetup implements CommandLineRunner {
  @Autowired
  private ArangoOperations operations;
  @Autowired
  private ProductRepository productRepository;
  @Autowired
  private ProcessRepository processRepository;
  @Autowired
  private InputRepository inputRepository;
  @Autowired
  private OutputRepository outputRepository;
  @Autowired
  private GraphService graphService;
  @Autowired
  private ImportExportService importService;
  
  @Override
  public void run(final String... args) throws Exception {
    System.out.println("------------- # SETUP BEGIN # -------------");
    // first drop the database so that we can run this multiple times with the same dataset
    operations.dropDatabase();

    // Create and save products
    Collection<Product> createProducts = createProducts();
    productRepository.saveAll(createProducts);

    // Create and save processes
    Collection<Process> createProcesses = createProcesses();
    processRepository.saveAll(createProcesses);

    long count = processRepository.count();
    System.out.println(String.format("-> %s PROCESS entries created", count));

    // Create and save input relationships between entities
    final Sort sort = Sort.by(Direction.DESC, "id");
    Product spaghetti = productRepository.findByName(sort,"spaghetti").get(0);
    Product rawPasta = productRepository.findByName(sort,"raw pasta").get(0);
    Product pasta = productRepository.findByName(sort,"pasta").get(0);
    Product tomatoSauce = productRepository.findByName(sort,"tomato sauce").get(0);
    Product hotDogs = productRepository.findByName(sort,"hot dogs").get(0);
    Product salt = productRepository.findByName(sort,"salt").get(0);
    Product pepper = productRepository.findByName(sort,"pepper").get(0);
    Product sugar = productRepository.findByName(sort,"sugar").get(0);
    Product garlic = productRepository.findByName(sort,"garlic").get(0);
    Product onions = productRepository.findByName(sort,"onions").get(0);
    Product cheese = productRepository.findByName(sort,"cheese").get(0);
    Product tomatoPaste = productRepository.findByName(sort,"tomato paste").get(0);
    Product oliveOil = productRepository.findByName(sort,"olive oil").get(0);
    Product cleanWater = productRepository.findByName(sort,"clean water").get(0);
    Product wasteWater = productRepository.findByName(sort,"waste water").get(0);

    System.out.println("-> PRODUCT object assignments completed");

    Process boiling = processRepository.findByName(sort, "boiling").get(0);
    Process simmering = processRepository.findByName(sort, "simmering").get(0);
    Process combining = processRepository.findByName(sort, "combining").get(0);
    
    System.out.println("-> PROCESS object assignments completed");

    inputRepository.save(new Input(rawPasta, boiling));
    inputRepository.save(new Input(cleanWater, boiling));
    inputRepository.save(new Input(cleanWater, simmering));
    inputRepository.save(new Input(tomatoPaste, simmering));
    inputRepository.save(new Input(salt, simmering));
    inputRepository.save(new Input(sugar, simmering));
    inputRepository.save(new Input(pepper, simmering));
    inputRepository.save(new Input(garlic, simmering));
    inputRepository.save(new Input(onions, simmering));
    inputRepository.save(new Input(tomatoSauce, combining));
    inputRepository.save(new Input(pasta, combining));
    inputRepository.save(new Input(hotDogs, combining));
    inputRepository.save(new Input(cheese, combining));
    inputRepository.save(new Input(oliveOil, combining));

    count = inputRepository.count();
    System.out.println(String.format("-> %s INPUT edges created", count));

    outputRepository.save(new Output(boiling, pasta));
    outputRepository.save(new Output(boiling, wasteWater));
    outputRepository.save(new Output(simmering, tomatoSauce));
    outputRepository.save(new Output(combining, spaghetti));

    count = outputRepository.count();
    System.out.println(String.format("-> %s OUTPUT edges created", count));

    // Create graph
    EdgeDefinition inputs = new EdgeDefinition("inputs", List.of("products"), List.of("processes"));
    EdgeDefinition outputs = new EdgeDefinition("outputs", List.of("processes"), List.of("products"));
    Graph defaultGraph = new Graph("default", List.of (inputs, outputs));
    graphService.createGraph(defaultGraph)
        .doOnSuccess(graph -> log.info("Graph created: {}", graph))
        .doOnError(error -> log.error("Failed to create graph", error))
        .block();  // Wait for completion (OK in CommandLineRunner); // IMPORTANT NOTE: I don't know why it works, but the .subscribe() is crucial to make the graph

    // Export files
    // importService.exportCSV("processes", "complexProcesses.csv").doOnError(error -> log.error("Failed to export PROCESSES -> ", error));
    // importService.exportCSV("inputs", "complexInputs.csv").doOnError(error -> log.error("Failed to export INPUTS -> ", error));
    // importService.exportCSV("outputs", "complexOutputs.csv").doOnError(error -> log.error("Failed to export OUTPUTS -> ", error));
    
    System.out.println("------------- # SETUP COMPLETED # -------------");
  }

  public static Collection<Product> createProducts() {
    return Arrays.asList(
      Product.builder().name("spaghetti").type("dish").build(),
      Product.builder().name("raw pasta").type("ingredient").build(),
      Product.builder().name("pasta").type("ingredient").build(),
      Product.builder().name("tomato sauce").type("ingredient").build(),
      Product.builder().name("hot dogs").type("ingredient").build(),
      Product.builder().name("salt").type("ingredient").build(),
      Product.builder().name("pepper").type("ingredient").build(),
      Product.builder().name("sugar").type("ingredient").build(),
      Product.builder().name("garlic").type("ingredient").build(),
      Product.builder().name("onions").type("ingredient").build(),
      Product.builder().name("cheese").type("ingredient").build(),
      Product.builder().name("tomato paste").type("ingredient").build(),
      Product.builder().name("olive oil").type("ingredient").build(),
      Product.builder().name("clean water").type("ingredient").build(),
      Product.builder().name("waste water").type("waste").build()
    );
  }

  public static Collection<Process> createProcesses() {
    return Arrays.asList(
      Process.builder().name("boiling").type("cooking").build(),
      Process.builder().name("simmering").type("cooking").build(),
      Process.builder().name("combining").type("cooking").build()
    );
  }
}
