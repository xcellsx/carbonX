package com.ecapybara.CarbonX.runner;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;

import com.arangodb.springframework.core.ArangoOperations;
import com.ecapybara.CarbonX.exception.DatabaseOperationException;
import com.ecapybara.CarbonX.model.Product;
import com.ecapybara.CarbonX.model.Process;
import com.ecapybara.CarbonX.model.EdgeDefinition;
import com.ecapybara.CarbonX.model.Graph;
import com.ecapybara.CarbonX.model.Input;
import com.ecapybara.CarbonX.model.Output;
import com.ecapybara.CarbonX.repository.InputRepository;
import com.ecapybara.CarbonX.repository.OutputRepository;
import com.ecapybara.CarbonX.repository.ProcessRepository;
import com.ecapybara.CarbonX.repository.ProductRepository;
import com.ecapybara.CarbonX.service.GraphService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@ComponentScan("com.ecapybara.CarbonX")
public class TestSetup implements CommandLineRunner {
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
  
  @Override
  public void run(final String... args) throws Exception {
    log.info("============= SETUP BEGIN =============");
    
    try {
      // First drop the database so that we can run this multiple times with the same dataset
      log.info("Dropping existing database...");
      operations.dropDatabase();
      log.info("Database dropped successfully");

      // Create and save products
      log.info("Creating products...");
      Collection<Product> createProducts = createProducts();
      productRepository.saveAll(createProducts);

      long count = productRepository.count();
      log.info("Successfully created {} PRODUCT entries", count);

      // Create and save processes
      log.info("Creating processes...");
      Collection<Process> createProcesses = createProcesses();
      processRepository.saveAll(createProcesses);

      count = processRepository.count();
      log.info("Successfully created {} PROCESS entries", count);

      // Create and save input relationships between entities
      log.info("Assigning product and process objects...");
      final Sort sort = Sort.by(Direction.DESC, "id");
      
      // Helper method to safely get products
      Product spaghetti = getProductByName(sort, "spaghetti");
      Product rawPasta = getProductByName(sort, "raw pasta");
      Product pasta = getProductByName(sort, "pasta");
      Product tomatoSauce = getProductByName(sort, "tomato sauce");
      Product hotDogs = getProductByName(sort, "hot dogs");
      Product salt = getProductByName(sort, "salt");
      Product pepper = getProductByName(sort, "pepper");
      Product sugar = getProductByName(sort, "sugar");
      Product garlic = getProductByName(sort, "garlic");
      Product onions = getProductByName(sort, "onions");
      Product cheese = getProductByName(sort, "cheese");
      Product tomatoPaste = getProductByName(sort, "tomato paste");
      Product oliveOil = getProductByName(sort, "olive oil");
      Product cleanWater = getProductByName(sort, "clean water");
      Product wasteWater = getProductByName(sort, "waste water");

      log.info("Product object assignments completed");

      Process boiling = getProcessByName(sort, "boiling");
      Process simmering = getProcessByName(sort, "simmering");
      Process combining = getProcessByName(sort, "combining");
      
      log.info("Process object assignments completed");

      // Create input edges
      log.info("Creating input edges...");
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
      log.info("Successfully created {} INPUT edges", count);

      // Create output edges
      log.info("Creating output edges...");
      outputRepository.save(new Output(boiling, pasta));
      outputRepository.save(new Output(boiling, wasteWater));
      outputRepository.save(new Output(simmering, tomatoSauce));
      outputRepository.save(new Output(combining, spaghetti));

      count = outputRepository.count();
      log.info("Successfully created {} OUTPUT edges", count);

      // Create graph
      log.info("Creating graph structure...");
      EdgeDefinition inputs = new EdgeDefinition("inputs", List.of("products"), List.of("processes"));
      EdgeDefinition outputs = new EdgeDefinition("outputs", List.of("processes"), List.of("products"));
      Graph defaultGraph = new Graph("default", List.of(inputs, outputs));
      
      graphService.createGraph(defaultGraph)
          .doOnSuccess(graph -> log.info("Graph created successfully: {}", graph))
          .doOnError(error -> log.error("Failed to create graph", error))
          .block();  // Wait for completion (OK in CommandLineRunner)

      log.info("============= SETUP COMPLETED =============");
      
    } catch (DatabaseOperationException e) {
      log.error("Database operation failed during setup: {}", e.getMessage(), e);
      throw e;
    } catch (Exception e) {
      log.error("Unexpected error during test setup: {}", e.getMessage(), e);
      throw new DatabaseOperationException("setup", "Test setup failed", e);
    }
  }

  /**
   * Safely retrieve a product by name, throwing proper exception if not found
   */
  private Product getProductByName(Sort sort, String name) {
    List<Product> products = productRepository.findByName(sort, name);
    if (products.isEmpty()) {
      log.error("Product not found: {}", name);
      throw new DatabaseOperationException("fetch", "Product not found: " + name);
    }
    return products.get(0);
  }

  /**
   * Safely retrieve a process by name, throwing proper exception if not found
   */
  private Process getProcessByName(Sort sort, String name) {
    List<Process> processes = processRepository.findByName(sort, name);
    if (processes.isEmpty()) {
      log.error("Process not found: {}", name);
      throw new DatabaseOperationException("fetch", "Process not found: " + name);
    }
    return processes.get(0);
  }

  public static Collection<Product> createProducts() {
    return Arrays.asList(
      new Product("dish", "spaghetti"),
      new Product("ingredient", "raw pasta"),
      new Product("ingredient", "pasta"),
      new Product("ingredient", "tomato sauce"),
      new Product("ingredient", "hot dogs"),
      new Product("ingredient", "salt"),
      new Product("ingredient", "pepper"),
      new Product("ingredient", "sugar"),
      new Product("ingredient", "garlic"),
      new Product("ingredient", "onions"),
      new Product("ingredient", "cheese"),
      new Product("ingredient", "tomato paste"),
      new Product("ingredient", "olive oil"),
      new Product("ingredient", "clean water"),
      new Product("waste", "waste water")
    );
  }

  public static Collection<Process> createProcesses() {
    return Arrays.asList(
      new Process("cooking", "boiling"),
      new Process("cooking", "simmering"),
      new Process("cooking", "combining")
    );
  }
}
