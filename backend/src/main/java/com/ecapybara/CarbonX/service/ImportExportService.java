package com.ecapybara.carbonx.service;

import lombok.extern.slf4j.Slf4j;

import java.io.FileWriter;
import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.apache.commons.collections4.IterableUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.supercsv.io.dozer.CsvDozerBeanWriter;
import org.supercsv.prefs.CsvPreference;

import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.model.issb.Input;
import com.ecapybara.carbonx.model.issb.Output;
import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.repository.*;
import com.ecapybara.carbonx.utils.csv.CsvColumn;
import com.ecapybara.carbonx.utils.csv.CsvColumnConfigurations;
import com.ecapybara.carbonx.utils.csv.CsvColumnWriterWithDozer;
import com.opencsv.bean.CsvToBeanBuilder;
import com.opencsv.exceptions.CsvRecursionException;
import com.fasterxml.jackson.databind.ObjectMapper;

import reactor.core.publisher.Mono;

@Service
@Slf4j
public class ImportExportService {

  @Autowired
  private WebClient webClient;
  @Autowired
  private ProductRepository productRepository;
  @Autowired
  private ProcessRepository processRepository;
  @Autowired
  private InputRepository inputRepository;
  @Autowired
  private OutputRepository outputRepository;

  // ------ UNCLEAN: Function to import a single JSON file within system folder
  public Mono<?> importJSON(String targetCollection, String filename) {
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
      productRepository.save(newProduct);
      return Mono.just(String.format("Import successful for JSON file: %s", filename));

    } catch (IOException e) {
      log.error("Error processing JSON", e);
      return Mono.error(new RuntimeException(String.format("Failed to load JSON file: %s", filename), e));
    }
  }

  public Mono<?> importCSV(String targetCollection, String filename) {
    try {
      // Find CSV file
      String projectRoot = System.getProperty("user.dir");
      Path dir = Paths.get(projectRoot, "temp");
      Path filepath = dir.resolve(filename);

      // Read, convert and save CSV file into database according to request type
      Reader reader = Files.newBufferedReader(filepath);
      switch (targetCollection) {
        case "products":
          List<Product> productList = new CsvToBeanBuilder<Product>(reader)
                                          .withType(Product.class)
                                          .withIgnoreLeadingWhiteSpace(true)
                                          .withIgnoreEmptyLine(true)
                                          .build()
                                          .parse();

          productList.forEach(product -> productRepository.save(product)) ; // save each document into the correct repo

          return Mono.just(String.format("Import successful for '%s' into PRODUCT repository!", filename));

        case "processes":
          List<Process> processList = new CsvToBeanBuilder<Process>(reader)
                                          .withType(Process.class)
                                          .withIgnoreLeadingWhiteSpace(true)
                                          .withIgnoreEmptyLine(true)
                                          .build()
                                          .parse();

          processList.forEach(process -> processRepository.save(process)); // save each document into the correct repo

          return Mono.just(String.format("Import successful for '%s' into PROCESS repository!", filename));

        case "inputs":
          List<Input> inputList = new CsvToBeanBuilder<Input>(reader)
                                          .withType(Input.class)
                                          .withIgnoreLeadingWhiteSpace(true)
                                          .withIgnoreEmptyLine(true)
                                          .build()
                                          .parse();
          return Mono.just(String.format("Import successful for '%s' into INPUT repository!", filename));

        case "outputs":
          List<Output> outputList = new CsvToBeanBuilder<Output>(reader)
                                          .withType(Output.class)
                                          .withIgnoreLeadingWhiteSpace(true)
                                          .withIgnoreEmptyLine(true)
                                          .build()
                                          .parse();

          outputList.forEach(output -> outputRepository.save(output)); // save each document into the correct repo

          return Mono.just(String.format("Import successful for '%s' into OUTPUT repository!", filename));

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
    
    try (Writer writer = new FileWriter(filepath.toString());
        CsvDozerBeanWriter beanWriter = new CsvDozerBeanWriter(writer, CsvPreference.STANDARD_PREFERENCE);) {
      // Read, convert and save database into CSV file according to request type
      switch (targetCollection) {
        case "products":
          List<CsvColumn> productColumns = new CsvColumnConfigurations().getProductColumns();
          CsvColumnWriterWithDozer productWriterWrapper = new CsvColumnWriterWithDozer(productColumns, beanWriter, Product.class); // Reference: https://medium.com/@carlocarlen/export-java-beans-to-csv-without-using-annotations-558389639596
          productWriterWrapper.writeHeaders();

          List<Product> productList = IterableUtils.toList(productRepository.findAll());
          for (Product product : productList) { productWriterWrapper.writeBean(product); }

          return Mono.just(String.format("Successfully exported PRODUCT database into '%s'!", filename));

        case "processes":
          List<CsvColumn> processColumns = new CsvColumnConfigurations().getProcessColumns();
          CsvColumnWriterWithDozer processWriterWrapper = new CsvColumnWriterWithDozer(processColumns, beanWriter, Process.class); // Reference: https://medium.com/@carlocarlen/export-java-beans-to-csv-without-using-annotations-558389639596
          processWriterWrapper.writeHeaders();

          List<Process> processList = IterableUtils.toList(processRepository.findAll());
          for (Process process : processList) { processWriterWrapper.writeBean(process); }
          System.out.println("Completed writing Process beans!");

          return Mono.just(String.format("Successfully exported PROCESS database into '%s'!", filename));

        case "inputs":
          List<CsvColumn> inputColumns = new CsvColumnConfigurations().getInputColumns();
          CsvColumnWriterWithDozer inputWriterWrapper = new CsvColumnWriterWithDozer(inputColumns, beanWriter, Input.class); // Reference: https://medium.com/@carlocarlen/export-java-beans-to-csv-without-using-annotations-558389639596
          inputWriterWrapper.writeHeaders();

          List<Input> inputList = IterableUtils.toList(inputRepository.findAll());
          for (Input input : inputList) { inputWriterWrapper.writeBean(input); }

          return Mono.just(String.format("Successfully exported INPUT database into '%s'!", filename));

        case "outputs":
          List<CsvColumn> outputColumns = new CsvColumnConfigurations().getOutputColumns();
          CsvColumnWriterWithDozer outputWriterWrapper = new CsvColumnWriterWithDozer(outputColumns, beanWriter, Output.class); // Reference: https://medium.com/@carlocarlen/export-java-beans-to-csv-without-using-annotations-558389639596
          outputWriterWrapper.writeHeaders();

          List<Output> outputList = IterableUtils.toList(outputRepository.findAll());
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
