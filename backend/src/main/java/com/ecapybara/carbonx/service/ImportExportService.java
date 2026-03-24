package com.ecapybara.carbonx.service;

import lombok.extern.slf4j.Slf4j;

import java.io.FileWriter;
import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.IterableUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.supercsv.io.dozer.CsvDozerBeanWriter;
import org.supercsv.prefs.CsvPreference;

import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.model.maritime.Ship;
import com.ecapybara.carbonx.model.issb.Input;
import com.ecapybara.carbonx.model.issb.Output;
import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.model.ghg.GwpFactor;
import com.ecapybara.carbonx.repository.*;
import com.ecapybara.carbonx.utils.csv.CsvColumn;
import com.ecapybara.carbonx.utils.csv.CsvColumnConfigurations;
import com.ecapybara.carbonx.utils.csv.CsvColumnWriterWithDozer;
import com.opencsv.bean.CsvToBeanBuilder;
import com.opencsv.exceptions.CsvRecursionException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import reactor.core.publisher.Mono;

@Service
@Slf4j
public class ImportExportService {

  @Autowired
  private ProductRepository productRepository;
  @Autowired
  private ProcessRepository processRepository;
  @Autowired
  private InputRepository inputRepository;
  @Autowired
  private OutputRepository outputRepository;
  @Autowired
  private DocumentService documentService;

  private Map<String, String> loadNameToIdMap(String database, String collection) {
    Map<String, String> nameToId = new HashMap<>();
    try {
      Map<String, Object> response = documentService.getAllDocuments(database, collection).block();
      Object raw = response != null ? response.get("result") : null;
      if (raw instanceof List<?> docs) {
        for (Object doc : docs) {
          if (!(doc instanceof Map<?, ?> m)) continue;
          Object nameObj = m.get("name");
          Object idObj = m.get("_id");
          if (nameObj == null || idObj == null) continue;
          String name = String.valueOf(nameObj).trim();
          String id = String.valueOf(idObj).trim();
          if (!name.isEmpty() && !id.isEmpty()) {
            nameToId.putIfAbsent(name, id);
          }
        }
      }
    } catch (Exception e) {
      log.warn("Could not build name->id map for {}/{}: {}", database, collection, e.getMessage());
    }
    return nameToId;
  }

  // ------ UNCLEAN: Function to import a single JSON file within system folder
  public Mono<?> importJSON(String database, String targetCollection, String filename) {
    ObjectMapper mapper = new ObjectMapper();
    try {
      // Convert file to JSON string (future implementation: JSON String received via HTTP)
      log.info("Requested filename: {}", filename);
      Resource resource = new ClassPathResource("samples/spaghetti/products/" + filename);
      Path filePath = resource.getFile().toPath();
      log.info("Requested filepath: {}", filePath);
      String jsonContent = Files.readString(filePath);
      log.info("JSON String loaded: {}", jsonContent.substring(0, 200) + "...");

      // Use object mapper to convert JSON String content to Product object
      Product newProduct = mapper.readValue(jsonContent, Product.class);
      log.info("{}", newProduct.toString());

      // Save new object into ProductRepository
      documentService.createDocument(database, targetCollection, newProduct, null, null, null, null, null);
      return Mono.just(String.format("Import successful for JSON file: %s", filename));

    } catch (IOException e) {
      log.error("Error processing JSON", e);
      return Mono.error(new RuntimeException(String.format("Failed to load JSON file: %s", filename), e));
    }
  }

  public Mono<?> importCSV(Path filepath, String database, String targetCollection) {
    String filename = filepath.getFileName().toString();
    try {
      // Read, convert and save CSV file into database according to request type
      Reader reader = Files.newBufferedReader(filepath);
      switch (targetCollection) {
        case "products":
          List<Object> productList = new CsvToBeanBuilder<Object>(reader)
                                          .withType(Product.class)
                                          .withIgnoreLeadingWhiteSpace(true)
                                          .withIgnoreEmptyLine(true)
                                          .build()
                                          .parse();
          
          
          documentService.createDocuments(database, "products", productList, null, null, null, null, null).block();
          return Mono.just(String.format("Import successful for '%s' into PRODUCT repository!", filename));

        case "processes":
          List<Object> processList = new CsvToBeanBuilder<Object>(reader)
                                          .withType(Process.class)
                                          .withIgnoreLeadingWhiteSpace(true)
                                          .withIgnoreEmptyLine(true)
                                          .build()
                                          .parse();                     

          documentService.createDocuments(database, "processes", processList, null, null, null, null, null).block();
          return Mono.just(String.format("Import successful for '%s' into PROCESS repository!", filename));

        case "inputs":
          List<Input> inputList = new CsvToBeanBuilder<Input>(reader)
                                      .withType(Input.class)
                                      .withIgnoreLeadingWhiteSpace(true)
                                      .withIgnoreEmptyLine(true)
                                      .build()
                                      .parse();

          // Important: master edge CSVs may contain stale _from/_to IDs after merges/imports.
          // Relink edges by product/process names to current document IDs in the target database.
          Map<String, String> productNameToIdForInputs = loadNameToIdMap(database, "products");
          Map<String, String> processNameToIdForInputs = loadNameToIdMap(database, "processes");
          for (Input input : inputList) {
            String fromId = productNameToIdForInputs.get(input.getProductName());
            String toId = processNameToIdForInputs.get(input.getProcessName());
            if (fromId != null) input.setFrom(fromId);
            if (toId != null) input.setTo(toId);
          }

          documentService.createDocuments(database, "inputs", List.copyOf(inputList), null, null, null, null, null).block();
          return Mono.just(String.format("Import successful for '%s' into INPUT repository!", filename));

        case "outputs":
          List<Output> outputList = new CsvToBeanBuilder<Output>(reader)
                                        .withType(Output.class)
                                        .withIgnoreLeadingWhiteSpace(true)
                                        .withIgnoreEmptyLine(true)
                                        .build()
                                        .parse();

          Map<String, String> processNameToIdForOutputs = loadNameToIdMap(database, "processes");
          Map<String, String> productNameToIdForOutputs = loadNameToIdMap(database, "products");
          for (Output output : outputList) {
            String fromId = processNameToIdForOutputs.get(output.getProcessName());
            String toId = productNameToIdForOutputs.get(output.getProductName());
            if (fromId != null) output.setFrom(fromId);
            if (toId != null) output.setTo(toId);
          }

          documentService.createDocuments(database, "outputs", List.copyOf(outputList), null, null, null, null, null).block();
          return Mono.just(String.format("Import successful for '%s' into OUTPUT repository!", filename));
        
        
        case "globalWarmingPotentials":
            List<Object> gwpList = new CsvToBeanBuilder<Object>(reader)
                                        .withType(GwpFactor.class)
                                        .withIgnoreLeadingWhiteSpace(true)
                                        .withIgnoreEmptyLine(true)
                                        .build()
                                        .parse();
            documentService.createDocuments(database, "globalWarmingPotentials", gwpList, null, null, null, null, null).block();
            return Mono.just(String.format("Import successful for '%s' into GWP_FACTORS collection!", filename));


        default:
          throw new IOException(String.format("Target collection not recognised: %s", targetCollection));
      }
    } catch (IOException e) {
      log.error("Error processing CSV", e);
      return Mono.error(new RuntimeException(String.format("Failed to load CSV file: %s", filename), e));
    }
  }

  public Mono<?> exportCSV(String targetCollection, String filename) throws Exception {
    
    // Find CSV file save location
    String projectRoot = System.getProperty("user.dir");
    Path dir = Paths.get(projectRoot, "temp");
    Files.createDirectories(dir);
    Path filepath = dir.resolve(filename);
    
    ObjectMapper mapper = new ObjectMapper();
    Map<String,Object> response;
    try (Writer writer = new FileWriter(filepath.toString());
        CsvDozerBeanWriter beanWriter = new CsvDozerBeanWriter(writer, CsvPreference.STANDARD_PREFERENCE);) {
      // Read, convert and save database into CSV file according to request type
      switch (targetCollection) {
        case "products":
          List<CsvColumn> productColumns = new CsvColumnConfigurations().getProductColumns();
          CsvColumnWriterWithDozer productWriterWrapper = new CsvColumnWriterWithDozer(productColumns, beanWriter, Product.class); // Reference: https://medium.com/@carlocarlen/export-java-beans-to-csv-without-using-annotations-558389639596
          productWriterWrapper.writeHeaders();

          response = documentService.getAllDocuments("default", "products").block();
          List<Product> productList = mapper.convertValue(response.get("result"), new TypeReference<List<Product>>() {});
          for (Product product : productList) { productWriterWrapper.writeBean(product); }

          return Mono.just(String.format("Successfully exported PRODUCT database into '%s'!", filename));

        case "processes":
          List<CsvColumn> processColumns = new CsvColumnConfigurations().getProcessColumns();
          CsvColumnWriterWithDozer processWriterWrapper = new CsvColumnWriterWithDozer(processColumns, beanWriter, Process.class); // Reference: https://medium.com/@carlocarlen/export-java-beans-to-csv-without-using-annotations-558389639596
          processWriterWrapper.writeHeaders();

          response = documentService.getAllDocuments("default", "processes").block();
          List<Process> processList = mapper.convertValue(response.get("result"), new TypeReference<List<Process>>() {});
          for (Process process : processList) { processWriterWrapper.writeBean(process); }

          return Mono.just(String.format("Successfully exported PROCESS database into '%s'!", filename));

        case "inputs":
          List<CsvColumn> inputColumns = new CsvColumnConfigurations().getInputColumns();
          CsvColumnWriterWithDozer inputWriterWrapper = new CsvColumnWriterWithDozer(inputColumns, beanWriter, Input.class); // Reference: https://medium.com/@carlocarlen/export-java-beans-to-csv-without-using-annotations-558389639596
          inputWriterWrapper.writeHeaders();

          response = documentService.getAllDocuments("default", "inputs").block();
          List<Input> inputList = mapper.convertValue(response.get("result"), new TypeReference<List<Input>>() {});
          for (Input input : inputList) { inputWriterWrapper.writeBean(input); }

          return Mono.just(String.format("Successfully exported INPUT database into '%s'!", filename));

        case "outputs":
          List<CsvColumn> outputColumns = new CsvColumnConfigurations().getOutputColumns();
          CsvColumnWriterWithDozer outputWriterWrapper = new CsvColumnWriterWithDozer(outputColumns, beanWriter, Output.class); // Reference: https://medium.com/@carlocarlen/export-java-beans-to-csv-without-using-annotations-558389639596
          outputWriterWrapper.writeHeaders();

          response = documentService.getAllDocuments("default", "outputs").block();
          List<Output> outputList = mapper.convertValue(response.get("result"), new TypeReference<List<Output>>() {});
          for (Output output : outputList) { outputWriterWrapper.writeBean(output); }

          return Mono.just(String.format("Successfully exported OUTPUT database into '%s'!", filename));

        default:
          throw new IOException(String.format("Target collection not recognised: %s", targetCollection));
      }

    } catch (IOException e) {
        log.error("Error exporting CSV!", e);
        return Mono.error(new RuntimeException(String.format("Failed to export CSV file: %s", filename), e));

    } catch (CsvRecursionException e) {
        log.error("Error exporting CSV!", e);
        e.printStackTrace();
        return Mono.error(new RuntimeException(String.format("Failed to export CSV file: %s", filename), e));
    }
  }
}
