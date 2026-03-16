package com.ecapybara.carbonx.runner;

import lombok.extern.slf4j.Slf4j;

import java.nio.file.Path;
import java.nio.file.Paths;
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
import com.ecapybara.carbonx.service.arango.ArangoCollectionService;

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
  private ImportExportService importExportService;
  @Autowired
  private ArangoCollectionService arangoCollectionService;
  
  @Override
  public void run(final String... args) throws Exception {
    System.out.println("------------- # SETUP BEGIN # -------------");
    // first drop the database so that we can run this multiple times with the same dataset
    operations.dropDatabase();

    // Create and save products
    String dir = System.getProperty("user.dir");
    String filename = "masterProducts.csv";
    Path filepath = Paths.get(dir,"src", "main", "resources", "data", "default").resolve(filename);
    importExportService.importCSV(filepath, "default", "products");
    log.info("-> {} PRODUCT entries created", productRepository.count());

    // Create and save processes
    filename = "masterProcesses.csv";
    filepath = Paths.get(dir,"src", "main", "resources", "data", "default").resolve(filename);
    importExportService.importCSV(filepath, "default", "processes");
    log.info("-> {} PROCESS entries created", processRepository.count());

    // Create and save input relationships between entities
    filename = "masterInputs.csv";
    filepath = Paths.get(dir,"src", "main", "resources", "data", "default").resolve(filename);
    importExportService.importCSV(filepath, "default", "inputs");
    log.info("-> {} INPUTS entries created", inputRepository.count());

    // Create and save input relationships between entities
    filename = "masterOutputs.csv";
    filepath = Paths.get(dir,"src", "main", "resources", "data", "default").resolve(filename);
    importExportService.importCSV(filepath, "default", "outputs");
    log.info("-> {} OUTPUTS entries created", outputRepository.count());

    // GWP
    // Create gwp_factors collection (type 2 = document collection)
    arangoCollectionService.createCollection("default", "globalWarmingPotentials", 2, true, null, null, null, null).block();
    log.info("globalWarmingPotentials collection created");
    filename = "globalWarmingPotentials.csv";
    filepath = Paths.get(dir,"src", "main", "resources", "data", "default").resolve(filename);
    importExportService.importCSV(filepath, "default", "globalWarmingPotentials");
    log.info("GWP created successfully");

    // Create graph
    EdgeDefinition inputs = new EdgeDefinition("inputs", List.of("products"), List.of("processes"));
    EdgeDefinition outputs = new EdgeDefinition("outputs", List.of("processes"), List.of("products"));
    Graph defaultGraph = new Graph("default", List.of(inputs, outputs));
    graphService.createGraph(defaultGraph)
        .doOnSuccess(graph -> log.info("Graph created: {}", graph))
        .doOnError(error -> log.error("Failed to create graph", error))
        .block();  // Wait for completion (OK in CommandLineRunner); // IMPORTANT NOTE: I don't know why it works, but the .subscribe() is crucial to make the graph

    // Export files
    // importExportService.exportCSV("products", "exportProducts.csv").doOnError(error -> log.error("Failed to export PRODUCTS -> ", error));
    // importExportService.exportCSV("processes", "exportProcesses.csv").doOnError(error -> log.error("Failed to export PROCESSES -> ", error));
    // log.info("-> Successfully exported PROCESSES into complexProcesses.csv");
    // importExportService.exportCSV("inputs", "exportInputs.csv").doOnError(error -> log.error("Failed to export INPUTS -> ", error));
    // importExportService.exportCSV("outputs", "exportOutputs.csv").doOnError(error -> log.error("Failed to export OUTPUTS -> ", error));
    
    System.out.println("------------- # SETUP COMPLETED # -------------");
  }
}
