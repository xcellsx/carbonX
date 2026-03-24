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
import com.ecapybara.carbonx.controller.UserController;
import com.ecapybara.carbonx.service.ImportExportService;
import com.ecapybara.carbonx.service.arango.ArangoCollectionService;
import com.ecapybara.carbonx.service.arango.ArangoDatabaseService;
import com.ecapybara.carbonx.service.arango.ArangoGraphService;
import com.ecapybara.carbonx.service.industry.maritime.MaritimeImportExportService;

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
    private UserController userController;
    @Autowired
    private MaritimeImportExportService maritimeImportExportService;

    @Override
    public void run(final String... args) throws Exception {
        log.info("------------- # SETUP BEGIN # -------------");
        // first drop the database so that we can run this multiple times with the same dataset
        List<String> databases = (List<String>) databaseService.listDatabases().block().get("result");
        databases.remove("_system");
        if (databases.contains("default")) { databaseService.dropDatabase("default").block(); }
        if (databases.contains("SingaporeMarine")) { databaseService.dropDatabase("SingaporeMarine").block(); }

        // Create 'default' database
        log.info("------------- # CREATING 'default' DATABASE # -------------");
        databaseService.createDatabase("default", null, null, null, null).block();

        // --- Create collections
        collectionService.createCollection("default", "products", 2, true, null, null, null, null).block();
        collectionService.createCollection("default", "processes", 2, true, null, null, null, null).block();
        collectionService.createCollection("default", "inputs", 3, true, null, null, null, null).block();
        collectionService.createCollection("default", "outputs", 3, true, null, null, null, null).block();
        collectionService.createCollection("default", "metrics", 2, true, null, null, null, null).block();
        collectionService.createCollection("default", "gwp", 2, true, null, null, null, null).block();
        collectionService.createCollection("default", "companies", 2, true, null, null, null, null).block();

        // --- Create edge definitions and graph
        Map<String,Object> inputs = Map.of( "collection", "inputs",
                                            "from", List.of("products"),
                                            "to", List.of("processes"));
        Map<String,Object> outputs = Map.of( "collection", "outputs",
                                            "from", List.of("processes"),
                                            "to", List.of("products"));
        graphService.createGraph("default", "default", List.of(inputs, outputs), null, null, null, null).block();

        // --- Create and save products
        String dir = System.getProperty("user.dir");
        String filename = "masterProducts.csv";
        Path filepath = Paths.get(dir,"src", "main", "resources", "data", "default").resolve(filename);
        importExportService.importCSV(filepath, "default", "products").block();

        // --- Create and save processes
        filename = "masterProcesses.csv";
        filepath = Paths.get(dir,"src", "main", "resources", "data", "default").resolve(filename);
        importExportService.importCSV(filepath, "default", "processes").block();

        // --- Create and save input relationships between entities
        filename = "masterInputs.csv";
        filepath = Paths.get(dir,"src", "main", "resources", "data", "default").resolve(filename);
        importExportService.importCSV(filepath, "default", "inputs").block();

        // --- Create and save input relationships between entities
        filename = "masterOutputs.csv";
        filepath = Paths.get(dir,"src", "main", "resources", "data", "default").resolve(filename);
        importExportService.importCSV(filepath, "default", "outputs").block();

        // Setup 'SingaporeMarine'
        log.info("------------- # CREATING 'default' DATABASE # -------------");
        companyInfoController.createCompany(Map.of( "name", "SingaporeMarine",
                                                    "sector", "maritime"));

        // --- Create and save users
        Map<String,String> user = Map.of("username", "test2",
                                         "email", "test2@gmail.com",
                                         "firstName", "test2",
                                         "companyName", "SingaporeMarine");
        userController.createUser("SingaporeMarine", user);

        // --- Create and save ships
        filename = "testShipLogs.csv";
        filepath = Paths.get(dir,"src", "main", "resources", "data", "test").resolve(filename);
        maritimeImportExportService.importCSV(filepath, "SingaporeMarine", "shipLogs");

        // Export files
        // importExportService.exportCSV("products", "exportProducts.csv").doOnError(error -> log.error("Failed to export PRODUCTS -> ", error));
        // importExportService.exportCSV("processes", "exportProcesses.csv").doOnError(error -> log.error("Failed to export PROCESSES -> ", error));
        // log.info("-> Successfully exported PROCESSES into complexProcesses.csv");
        // importExportService.exportCSV("inputs", "exportInputs.csv").doOnError(error -> log.error("Failed to export INPUTS -> ", error));
        // importExportService.exportCSV("outputs", "exportOutputs.csv").doOnError(error -> log.error("Failed to export OUTPUTS -> ", error));

        log.info("------------- # SETUP COMPLETED # -------------");
    }
}
