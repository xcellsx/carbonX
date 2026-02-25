package com.ecapybara.carbonx.service;

import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.ecapybara.carbonx.model.issb.Input;
import com.ecapybara.carbonx.model.issb.Output;
import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.repository.InputRepository;
import com.ecapybara.carbonx.repository.OutputRepository;
import com.ecapybara.carbonx.repository.ProcessRepository;
import com.ecapybara.carbonx.repository.ProductRepository;

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

  /** Normalize to document key: if id contains '/', use the part after it; else use id. */
  private static String toKey(String id) {
    if (id == null || id.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id must not be empty");
    }
    int slash = id.indexOf('/');
    return slash >= 0 ? id.substring(slash + 1) : id;
  }
}
