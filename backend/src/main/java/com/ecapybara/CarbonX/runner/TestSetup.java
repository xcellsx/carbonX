package com.ecapybara.carbonx.runner;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.ComponentScan;

import com.arangodb.springframework.core.ArangoOperations;
import com.ecapybara.carbonx.service.ExperimentalService;
import com.ecapybara.carbonx.service.ImportExportService;

@Slf4j
@ComponentScan("com.ecapybara.carbonx")
public class TestSetup implements CommandLineRunner {
  @Autowired
  private ArangoOperations operations;
  @Autowired
  private ExperimentalService experimentalService;
  @Autowired
  private ImportExportService importService;
  
  @Override
  public void run(final String... args) throws Exception {
    System.out.println("-------------- # SETUP BEGIN # --------------");
    // first drop the database so that we can run this multiple times with the same dataset
    operations.dropDatabase();

    // Import complexProducts.csv
    Mono<?> outcome = importService.importCSV("products", "complexProducts.csv");

    // Display outcome
    log.info("Import experiment outcome -> {}", outcome);

    System.out.println("------------- # SETUP COMPLETED # -------------");
  }
}