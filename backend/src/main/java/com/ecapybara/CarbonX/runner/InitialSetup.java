package com.ecapybara.carbonx.runner;

import lombok.extern.slf4j.Slf4j;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.ComponentScan;

import com.ecapybara.carbonx.controller.CompanyInfoController;
import com.ecapybara.carbonx.service.ImportExportService;
import com.ecapybara.carbonx.service.arango.ArangoCollectionService;
import com.ecapybara.carbonx.service.arango.ArangoDatabaseService;
import com.ecapybara.carbonx.service.arango.ArangoGraphService;
import com.ecapybara.carbonx.service.industry.maritime.MaritimeImportExportService;
import com.fasterxml.jackson.databind.ObjectMapper;

@Slf4j
@ComponentScan("com.ecapybara.carbonx")
public class InitialSetup implements CommandLineRunner {
    @Autowired
    private ArangoDatabaseService databaseService;
    @Autowired
    private ArangoCollectionService collectionService;
    @Autowired
    private ArangoGraphService graphService;
    @Autowired
    private ImportExportService importExportService;
    @Autowired
    private CompanyInfoController companyInfoController;
    @Autowired
    private MaritimeImportExportService maritimeImportExportService;

    ObjectMapper mapper = new ObjectMapper();

    @Override
    public void run(final String... args) throws Exception {
        log.info("------------- # SETUP BEGIN # -------------");
        // Delete 'default' database
        databaseService.dropDatabase("default").block();
        databaseService.dropDatabase("SingaporeMarine").block();

        // Reinitialise 'default' database
        databaseService.createDatabase("default", null, null, null, null).block();

        // Create collections
        collectionService.createCollection("default", "products", 2, true, null, null, null, null).block();
        collectionService.createCollection("default", "processes", 2, true, null, null, null, null).block();
        collectionService.createCollection("default", "inputs", 3, true, null, null, null, null).block();
        collectionService.createCollection("default", "outputs", 3, true, null, null, null, null).block();
        collectionService.createCollection("default", "metrics", 2, true, null, null, null, null).block();
        collectionService.createCollection("default", "gwp", 2, true, null, null, null, null).block();
        collectionService.createCollection("default", "companies", 2, true, null, null, null, null).block();

        // Create edge definitions and graph
        Map<String,Object> inputs = Map.of( "collection", "inputs",
                                            "from", List.of("products"),
                                            "to", List.of("processes"));
        Map<String,Object> outputs = Map.of( "collection", "outputs",
                                            "from", List.of("processes"),
                                            "to", List.of("products"));
        graphService.createGraph("default", "default", List.of(inputs, outputs), null, null, null, null).block();

        // Create and save products
        String dir = System.getProperty("user.dir");
        String filename = "testProducts.csv";
        Path filepath = Paths.get(dir,"backend", "src", "main", "resources", "data", "test").resolve(filename);
        importExportService.importCSV(filepath, "default", "products").block();

        // Create and save processes
        filename = "testProcesses.csv";
        filepath = Paths.get(dir,"backend","src", "main", "resources", "data", "test").resolve(filename);
        importExportService.importCSV(filepath, "default", "processes").block();

        // Create and save input relationships between entities
        filename = "testInputs.csv";
        filepath = Paths.get(dir,"backend","src", "main", "resources", "data", "test").resolve(filename);
        importExportService.importCSV(filepath, "default", "inputs").block();

        // Create and save input relationships between entities
        filename = "testOutputs.csv";
        filepath = Paths.get(dir,"backend","src", "main", "resources", "data", "test").resolve(filename);
        importExportService.importCSV(filepath, "default", "outputs").block();

        // Setup SingaporeMarine
        companyInfoController.createCompany(Map.of( "name", "SingaporeMarine",
                                                    "sector", "maritime"));

        // Create and save ships
        filename = "testShipLogs.csv";
        filepath = Paths.get(dir,"backend","src", "main", "resources", "data", "test").resolve(filename);
        maritimeImportExportService.importCSV(filepath, "SingaporeMarine", "shipLogs");
    }
}
