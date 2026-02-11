package com.ecapybara.carbonx.service;

import java.io.FileWriter;
import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.IterableUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.supercsv.io.dozer.CsvDozerBeanWriter;
import org.supercsv.prefs.CsvPreference;

import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.repository.*;
import com.ecapybara.carbonx.utils.csv.CsvColumn;
import com.ecapybara.carbonx.utils.csv.CsvColumnConfigurations;
import com.ecapybara.carbonx.utils.csv.CsvColumnWriterWithDozer;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.opencsv.bean.CsvToBeanBuilder;
import com.opencsv.exceptions.CsvRecursionException;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class ExperimentalService {
  
  @Autowired
  private WebClient webClient;
  @Autowired
  private ProcessRepository processRepository;

  //Test Function to import a single JSON file within system folder
  public Mono<?> importJSON(String targetCollection, String filename) {
    ObjectMapper mapper = new ObjectMapper();
    try {
      // Convert file to JSON string (future implementation: JSON String received via HTTP)
      log.info("Requested filename: {}", filename);
      Resource resource = new ClassPathResource("samples/spaghetti/processs/" + filename);
      Path filePath = resource.getFile().toPath();
      log.info("Requested filepath: {}", filePath);
      String jsonContent = Files.readString(filePath);
      log.info("JSON String loaded: {}", jsonContent.substring(0, 200) + "...");

      // Use object mapper to convert JSON String content to Process object
      Process newProcess = mapper.readValue(jsonContent, Process.class);
      log.info("{}", newProcess.toString());

      // Save new object into ProcessRepository
      processRepository.save(newProcess);
      return Mono.just(String.format("Import successful for JSON file: %s", filename));

    } catch (IOException e) {
      log.error("Error processing JSON", e);
      return Mono.error(new RuntimeException(String.format("Failed to load JSON file: %s", filename), e));
    }
  }

  //Test Function to import a single JSON file within system folder,  !! Object class is not recorded in database when using this method !!
  public Mono<?> httpImportJSON(String targetCollection, String filename) {
    try {
        System.out.println(filename);
        Resource resource = new ClassPathResource("samples/spaghetti/processs/" + filename);
        Path filePath = resource.getFile().toPath();
        System.out.println(filePath);
        String jsonContent = Files.readString(filePath);
        System.out.println(jsonContent);
        ObjectMapper mapper = new ObjectMapper();
        String jsonlContent = mapper.writeValueAsString(mapper.readTree(jsonContent)); // converts the JSON content into JSONL

        String type = "auto";
        return webClient.post()
                .uri("/import?collection={targetCollection}&type={type}&waitForSync=true", targetCollection, type)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(jsonlContent)
                .retrieve()
                .bodyToMono(String.class);
    } catch (IOException e) {
        return Mono.error(new RuntimeException(String.format("Failed to load JSON file: %s", filename), e));
    }
  }

  //Test Function to import a single CSV file within system folder
  public Mono<?> importCSV(String targetCollection, String filename) {
    ObjectMapper mapper = new ObjectMapper();
    try {      
      // Find, load and read CSV file
      log.info("Requested filename: {}", filename);
      String projectRoot = System.getProperty("user.dir");
      Path dir = Paths.get(projectRoot, "temp");
      Path filepath = dir.resolve(filename);
      log.info("Requested filepath: {}", filepath);
      Reader reader = Files.newBufferedReader(filepath);

      // Convert CSV to process objects
      List<Process> processs = new CsvToBeanBuilder<Process>(reader)
            .withType(Process.class)
            .withIgnoreLeadingWhiteSpace(true)
            .build()
            .parse();      

      // Convert CSV file to JSON string (future implementation: JSON String received via HTTP)
      mapper.enable(SerializationFeature.INDENT_OUTPUT);
      String jsonContent = mapper.writeValueAsString(processs);
      log.info("JSON String loaded: {}", jsonContent.substring(0,100) + " ...");

      // Use object mapper to convert JSON String content to Process objects
      List<Process> listOfProcesss = mapper.readValue(jsonContent, new TypeReference<List<Process>>(){});
      log.info("List of processs: {}", listOfProcesss.toString().substring(0,100) + " ...");
    
      // Save new object into ProcessRepository
      for (Process process: listOfProcesss) {
        processRepository.save(process);
      }

      return Mono.just(String.format("Import successful for CSV file: %s", filename));

    } catch (IOException e) {
      log.error("Error processing CSV", e);
      return Mono.error(new RuntimeException(String.format("Failed to load CSV file: %s", filename), e));
    }
  }

  public String exportCSV(String filename) {
    return "Export successful!";
  }
  // ------- Test Function to import a single CSV file within system folder
  public String importComplexCSV(String targetCollection, String filename) {
    String projectRoot = System.getProperty("user.dir");
    log.info("Root folder identified as -> {}", projectRoot);
    Path dir = Paths.get(projectRoot, "temp");
    log.info("Folder path identified as -> {}", dir);
    Path filepath = dir.resolve(filename);
    log.info("Filepath identified as -> {}", filepath.toString());

    try {
      Reader reader = Files.newBufferedReader(filepath);

      // Convert CSV to process objects
      List<Process> processs = new CsvToBeanBuilder<Process>(reader)
            .withIgnoreLeadingWhiteSpace(true)
            .withIgnoreEmptyLine(true)
            .withType(Process.class)
            .build()
            .parse();

      switch (targetCollection) {
        case "processs":
          for (Process process: processs) {
            // Save processs into processRepository
            processRepository.save(process);
          }
          return String.format("%s successfully imported into %s", filename, targetCollection);        
        
        default:
          log.error("Target collection not recognised: {}", targetCollection);
          return String.format("Target collection not recognised: %s", targetCollection);
      }

    } catch (IOException e) {
      log.error("Error processing CSV", e);
      return String.format("Failed to load CSV file: %s", filename);
    }
  }

  // Test Function to export a single CSV file to the system file folder
  public Mono<?> exportComplexCSV(String filename) throws Exception {
    String projectRoot = System.getProperty("user.dir");
    log.info("Root folder identified as -> {}", projectRoot);
    Path dir = Paths.get(projectRoot, "temp");
    Files.createDirectories(dir);
    log.info("Folder path identified as -> {}", dir);    
    Path filepath = dir.resolve(filename);
    log.info("Filepath identified as -> {}", filepath.toString());

    List<Process> processList = IterableUtils.toList(processRepository.findAll());
    
    List<CsvColumn> processColumns = new CsvColumnConfigurations().getProcessColumns();

    // Reference: https://medium.com/@carlocarlen/export-java-beans-to-csv-without-using-annotations-558389639596
    try (Writer writer = new FileWriter(filepath.toString());
        CsvDozerBeanWriter beanWriter = new CsvDozerBeanWriter(writer, CsvPreference.STANDARD_PREFERENCE);
        CsvColumnWriterWithDozer writerWrapper = new CsvColumnWriterWithDozer(processColumns, beanWriter, Process.class))
    {
      writerWrapper.writeHeaders();
      for (Process process : processList) {
        writerWrapper.writeBean(process);
      }
      return Mono.just("Successfully exported CSV file!");
    }
    catch (IOException e) {
        log.error("Error exporting CSV!", e);
        return Mono.error(new RuntimeException(String.format("Failed to export CSV file: %s", filename), e));
    }
    catch (CsvRecursionException e) {
        log.error("Error exporting CSV!", e);
        e.printStackTrace();
        return Mono.error(new RuntimeException(String.format("Failed to export CSV file: %s", filename), e));
    }
  }
}
