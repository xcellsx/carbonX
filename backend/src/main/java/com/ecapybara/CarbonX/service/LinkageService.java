package com.ecapybara.CarbonX.service;

import java.io.BufferedReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.ecapybara.CarbonX.dto.BulkLinkResult;
import com.ecapybara.CarbonX.dto.InputLinkRequest;
import com.ecapybara.CarbonX.dto.OutputLinkRequest;
import com.ecapybara.CarbonX.model.issb.Input;
import com.ecapybara.CarbonX.model.issb.Output;
import com.ecapybara.CarbonX.model.issb.Process;
import com.ecapybara.CarbonX.model.issb.Product;
import com.ecapybara.CarbonX.repository.InputRepository;
import com.ecapybara.CarbonX.repository.OutputRepository;
import com.ecapybara.CarbonX.repository.ProcessRepository;
import com.ecapybara.CarbonX.repository.ProductRepository;

/**
 * Creates one-way linkages between product and process nodes.
 * - Input: Product → Process (product is consumed by process). Single direction only.
 * - Output: Process → Product (process produces product). Single direction only.
 * Does not create reverse edges; at most one edge per (from, to) pair per type.
 */
@Service
public class LinkageService {

  @Autowired
  private ProductRepository productRepository;
  @Autowired
  private ProcessRepository processRepository;
  @Autowired
  private InputRepository inputRepository;
  @Autowired
  private OutputRepository outputRepository;

  /**
   * Create a one-way link: Product → Process (input).
   * Idempotent: if this exact link already exists, returns the existing edge.
   */
  public Input createInputLink(String productId, String processId) {
    Product product = resolveProduct(productId);
    Process process = resolveProcess(processId);
    String fromId = product.getId();
    String toId = process.getId();

    List<Input> existing = inputRepository.findByFromAndTo(fromId, toId);
    if (!existing.isEmpty()) {
      return existing.get(0);
    }
    Input input = new Input(product, process);
    return inputRepository.save(input);
  }

  /**
   * Create a one-way link: Process → Product (output).
   * Idempotent: if this exact link already exists, returns the existing edge.
   */
  public Output createOutputLink(String processId, String productId) {
    Process process = resolveProcess(processId);
    Product product = resolveProduct(productId);
    String fromId = process.getId();
    String toId = product.getId();

    List<Output> existing = outputRepository.findByFromAndTo(fromId, toId);
    if (!existing.isEmpty()) {
      return existing.get(0);
    }
    Output output = new Output(process, product);
    return outputRepository.save(output);
  }

  /** Resolve product by id (full _id like "products/xyz" or key "xyz"). */
  private Product resolveProduct(String id) {
    String key = Objects.requireNonNull(toKey(id), "product key");
    return productRepository.findById(key)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));
  }

  /** Resolve process by id (full _id like "processes/xyz" or key "xyz"). */
  private Process resolveProcess(String id) {
    String key = Objects.requireNonNull(toKey(id), "process key");
    return processRepository.findById(key)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Process not found: " + id));
  }

  /**
   * Create many input and output links in one go. Skips pairs that already exist.
   * Returns counts and any errors (e.g. product/process not found).
   */
  public BulkLinkResult bulkCreate(List<InputLinkRequest> inputPairs, List<OutputLinkRequest> outputPairs) {
    BulkLinkResult result = new BulkLinkResult();
    if (inputPairs != null) {
      for (InputLinkRequest req : inputPairs) {
        if (req.getProductId() == null || req.getProcessId() == null) {
          result.getErrors().add("input: productId and processId required");
          continue;
        }
        try {
          Product product = resolveProduct(req.getProductId());
          Process process = resolveProcess(req.getProcessId());
          String fromId = product.getId();
          String toId = process.getId();
          List<Input> existing = inputRepository.findByFromAndTo(fromId, toId);
          if (!existing.isEmpty()) {
            result.setInputsSkipped(result.getInputsSkipped() + 1);
          } else {
            inputRepository.save(new Input(product, process));
            result.setInputsCreated(result.getInputsCreated() + 1);
          }
        } catch (ResponseStatusException e) {
          result.getErrors().add("input " + req.getProductId() + "→" + req.getProcessId() + ": " + e.getReason());
        }
      }
    }
    if (outputPairs != null) {
      for (OutputLinkRequest req : outputPairs) {
        if (req.getProcessId() == null || req.getProductId() == null) {
          result.getErrors().add("output: processId and productId required");
          continue;
        }
        try {
          Process process = resolveProcess(req.getProcessId());
          Product product = resolveProduct(req.getProductId());
          String fromId = process.getId();
          String toId = product.getId();
          List<Output> existing = outputRepository.findByFromAndTo(fromId, toId);
          if (!existing.isEmpty()) {
            result.setOutputsSkipped(result.getOutputsSkipped() + 1);
          } else {
            outputRepository.save(new Output(process, product));
            result.setOutputsCreated(result.getOutputsCreated() + 1);
          }
        } catch (ResponseStatusException e) {
          result.getErrors().add("output " + req.getProcessId() + "→" + req.getProductId() + ": " + e.getReason());
        }
      }
    }
    return result;
  }

  /**
   * Load input/output links from temp/masterInputs.csv and temp/masterOutputs.csv
   * and create them in bulk. CSV format: header line, then rows with "from", "to" (document ids).
   * Inputs: from=productId, to=processId. Outputs: from=processId, to=productId.
   */
  public BulkLinkResult bulkCreateFromTempMasterCsvs() {
    String projectRoot = System.getProperty("user.dir");
    Path tempDir = Paths.get(projectRoot, "temp");
    List<InputLinkRequest> inputs = new ArrayList<>();
    List<OutputLinkRequest> outputs = new ArrayList<>();
    Path inputsPath = tempDir.resolve("masterInputs.csv");
    Path outputsPath = tempDir.resolve("masterOutputs.csv");
    if (Files.exists(inputsPath)) {
      try (BufferedReader r = Files.newBufferedReader(inputsPath)) {
        String header = r.readLine();
        if (header != null && header.toLowerCase().contains("from")) {
          String line;
          while ((line = r.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] parts = line.split(",", -1);
            if (parts.length >= 4) {
              String from = parts[1].trim();
              String to = parts[3].trim();
              if (!from.isEmpty() && !to.isEmpty())
                inputs.add(new InputLinkRequest(from, to));
            }
          }
        }
      } catch (Exception e) {
        throw new RuntimeException("Failed to read masterInputs.csv: " + e.getMessage(), e);
      }
    }
    if (Files.exists(outputsPath)) {
      try (BufferedReader r = Files.newBufferedReader(outputsPath)) {
        String header = r.readLine();
        if (header != null && header.toLowerCase().contains("from")) {
          String line;
          while ((line = r.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] parts = line.split(",", -1);
            if (parts.length >= 4) {
              String from = parts[1].trim();
              String to = parts[3].trim();
              if (!from.isEmpty() && !to.isEmpty())
                outputs.add(new OutputLinkRequest(from, to));
            }
          }
        }
      } catch (Exception e) {
        throw new RuntimeException("Failed to read masterOutputs.csv: " + e.getMessage(), e);
      }
    }
    return bulkCreate(inputs, outputs);
  }

  /** Normalize to document key: if id contains '/', use the part after it; else use id. */
  private static String toKey(String id) {
    if (id == null || id.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id must not be empty");
    }
    int slash = id.indexOf('/');
    return slash >= 0 ? id.substring(slash + 1) : id;
  }
}
