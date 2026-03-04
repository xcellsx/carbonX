package com.ecapybara.carbonx.runner;

import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.ComponentScan;

import com.arangodb.springframework.core.ArangoOperations;
import com.ecapybara.carbonx.model.basic.EdgeDefinition;
import com.ecapybara.carbonx.model.basic.Graph;
import com.ecapybara.carbonx.repository.*;
import com.ecapybara.carbonx.service.GraphService;
import com.ecapybara.carbonx.service.ImportExportService;
import com.ecapybara.carbonx.service.arango.ArangoCollectionService;

@Slf4j
@ComponentScan("com.ecapybara.carbonx")
public class InitialSetup implements CommandLineRunner {
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
  private ImportExportService importExportService;
  @Autowired
  private ArangoCollectionService arangoCollectionService;
  
  @Override
  public void run(final String... args) throws Exception {
    System.out.println("------------- # SETUP BEGIN # -------------");
    // first drop the database so that we can run this multiple times with the same dataset
    operations.dropDatabase();

    // Create and save products
    importExportService.importCSV("products", "testProducts.csv");
    log.info("-> {} PRODUCT entries created", productRepository.count());

    // Create and save processes
    importExportService.importCSV("processes", "testProcesses.csv");
    log.info("-> {} PROCESS entries created", processRepository.count());

    // Create and save input relationships between entities
    importExportService.importCSV("inputs", "testInputs.csv");
    log.info("-> {} INPUTS entries created", inputRepository.count());

    // Create and save input relationships between entities
    importExportService.importCSV("outputs", "testOutputs.csv");
    log.info("-> {} OUTPUTS entries created", outputRepository.count());

    // Create graph
    EdgeDefinition inputs = new EdgeDefinition("inputs", List.of("products"), List.of("processes"));
    EdgeDefinition outputs = new EdgeDefinition("outputs", List.of("processes"), List.of("products"));
    Graph defaultGraph = new Graph("default", List.of(inputs, outputs));
    graphService.createGraph(defaultGraph)
        .doOnError(error -> log.error("Failed to create graph", error))
        .block();  // Wait for completion (OK in CommandLineRunner); // IMPORTANT NOTE: I don't know why it works, but the .subscribe() is crucial to make the graph

    // Ensure users collection exists for auth (login/signup). Without this, login returns 500.
    try {
      arangoCollectionService.getCollection("users").block();
      log.info("-> USERS collection already exists");
    } catch (Exception e) {
      arangoCollectionService.createCollection("users", 2, null, null, null, null, null).block();
      log.info("-> USERS collection created");
    }
    // Ensure user_product_lca collection exists for user-scoped LCA persistence.
    try {
      arangoCollectionService.getCollection("user_product_lca").block();
      log.info("-> USER_PRODUCT_LCA collection already exists");
    } catch (Exception e) {
      arangoCollectionService.createCollection("user_product_lca", 2, null, null, null, null, null).block();
      log.info("-> USER_PRODUCT_LCA collection created");
    }

    System.out.println("------------- # SETUP COMPLETED # -------------");
  }
}
