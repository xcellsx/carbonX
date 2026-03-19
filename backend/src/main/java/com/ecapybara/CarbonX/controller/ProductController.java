package com.ecapybara.carbonx.controller;

import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.IterableUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.ecapybara.carbonx.config.AppLogger;
import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.repository.ProductRepository;
import com.ecapybara.carbonx.service.arango.ArangoDocumentService;
import com.ecapybara.carbonx.service.GraphService;
import com.ecapybara.carbonx.service.ImportExportService;
import com.fasterxml.jackson.databind.ObjectMapper;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;


@RestController
@RequestMapping("/api/products")
public class ProductController {
  
  @Autowired
  private ImportExportService importService;
  @Autowired
  private ArangoDocumentService documentService;
  @Autowired
  private GraphService graphService;
  @Autowired
  private ProductRepository productRepository;
  @Autowired
  private ObjectMapper objectMapper;

  private static final Logger log = LoggerFactory.getLogger(AppLogger.class);
  final Sort sort = Sort.by(Direction.DESC, "id");

  @GetMapping
  public List<Product> getProducts(
      @RequestParam(name = "name", required = false) String name,
      @RequestParam(name = "type", required = false) String type,
      @RequestParam(name = "userId", required = false) String userId) {
    List<Product> list;
    if (name != null && !name.isEmpty() && type != null && !type.isEmpty()) {
      list = productRepository.findByNameAndType(sort, name, type);
    } else if (name != null && !name.isEmpty()) {
      list = productRepository.findByName(sort, name);
    } else if (type != null && !type.isEmpty()) {
      list = productRepository.findByType(sort, type);
    } else if (userId != null && !userId.isEmpty()) {
      list = productRepository.findByUserId(sort, userId);
    } else {
      list = IterableUtils.toList(productRepository.findAll());
    }
    // Ensure lcaValue is present (repository may not map it; single-doc getDocument does)
    for (Product p : list) {
      String key = p.getKey();
      if ((key == null || key.isEmpty()) && p.getId() != null && p.getId().contains("/")) {
        key = p.getId().substring(p.getId().lastIndexOf('/') + 1);
      }
      if (key != null && !key.isEmpty() && (p.getLcaValue() == null)) {
        try {
          Map<String, Object> doc = documentService.getDocument("products", key, null, null).block();
          if (doc != null && doc.containsKey("lcaValue") && doc.get("lcaValue") != null) {
            Object v = doc.get("lcaValue");
            if (v instanceof Number) p.setLcaValue(((Number) v).doubleValue());
          }
        } catch (Exception e) {
          log.debug("Could not load lcaValue for product key={}: {}", key, e.getMessage());
        }
      }
    }
    return list;
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(value = HttpStatus.CREATED)
  public List<Product> createProducts(@RequestBody List<Product> productsList) {
    
    for (Product product : productsList) {
      System.out.println("----- New product created:");
      System.out.println(product.toString());

      productRepository.save(product);
      product = productRepository.findByNameAndType(sort, product.getName(), product.getType()).get(0);
      System.out.println("Created product saved into product database:");
      System.out.println(product.toString());
    }

    return productsList;
  }

  @PutMapping
  public List<Product> editProducts(@RequestBody List<Product> revisedProducts) {
    for (Product productRevision : revisedProducts) {
      Product product = editProduct(productRevision.getId(), productRevision);
      productRevision = product; //replace the list element with the new entity from database
    }
    return revisedProducts;
  }

  @GetMapping("/{key}")
  public Mono<Product> getProduct(@PathVariable String key) {
    Map<String,Object> rawDocument = documentService.getDocument("products", key, null, null)
                                                    .block();
    Product product = objectMapper.convertValue(rawDocument, Product.class);
    return Mono.just(product);
  }

  @PutMapping("/{id}")
  public Product editProduct(@PathVariable String id, @RequestBody Product revisedProduct) {
    Product product = productRepository.findById(id).orElse(null);
    
    if (product != null) {
      product.setName(revisedProduct.getName());
      product.setType(revisedProduct.getType());
      product.setProductOrigin(revisedProduct.getProductOrigin());
      product.setDPP(revisedProduct.getDPP());
      product.setUserId(revisedProduct.getUserId());
      product.setUploadedFile(revisedProduct.getUploadedFile());
      productRepository.save(product);
    }
    
    return productRepository.findById(id).orElse(null);
  }

  /**
   * Persist only the LCA value for a product (same save path as editProduct).
   * Id can be the document key (e.g. "1") or full id (e.g. "products/1").
   */
  @PutMapping("/{id}/lca")
  public Product updateProductLca(@PathVariable String id, @RequestBody java.util.Map<String, Double> body) {
    Double lcaValue = body != null ? body.get("lcaValue") : null;
    return updateProductLcaValue(id, lcaValue);
  }

  /**
   * Used by ExperimentController and PUT /{id}/lca. Normalizes id to Arango _key, then persists lcaValue
   * via repository save and via direct Arango PATCH so the value is definitely written.
   */
  public Product updateProductLcaValue(String id, Double lcaValue) {
    if (id == null || lcaValue == null) {
      log.warn("updateProductLcaValue skipped: id or lcaValue null");
      return null;
    }
    String key = id.contains("/") ? id.substring(id.lastIndexOf('/') + 1) : id;
    Product product = productRepository.findById(key).orElse(null);
    if (product == null) {
      log.warn("Product not found for key={} (id={}), lcaValue not persisted", key, id);
      return null;
    }
    product.setLcaValue(lcaValue);
    productRepository.save(product);
    log.info("Saved lcaValue={} for product key={} (repository.save)", lcaValue, key);

    // Also PATCH the document in Arango so the field is definitely persisted (repository save can miss it)
    try {
      documentService
          .updateDocument("products", key, java.util.Map.<String, Object>of("lcaValue", lcaValue),
              true, true, false, false, false, true, null, null)
          .block();
      log.info("Patched lcaValue={} for product key={} (Arango PATCH)", lcaValue, key);
    } catch (Exception e) {
      log.warn("Arango PATCH lcaValue failed for key={}: {}", key, e.getMessage());
    }

    return productRepository.findById(key).orElse(null);
  }

  // Proper document deletion require the use of ArangoDB's Graph API since AQL does not cleanly delete hanging edges. Trust me, I've tried
  @DeleteMapping("/{id}")
  public Mono<Boolean> removeProduct(@PathVariable String id) {
    return graphService.deleteDocuments("products", id);
  }

  /*
  @GetMapping("/{id}/calculate")
  public Mono<?> calculateProduct(@PathVariable String id) {
    Product product = productRepository.findById(id).orElse(null);
    return LCAService.calculate(product);
  }
  */

  // Experimental endpoint to call for backend import function for products
  @PostMapping("/import")
  public Mono<?> testImport() {
    List<String> files = List.of("templates.csv");
    
    return Flux.fromIterable(files)
        .flatMap(filename -> importService.importCSV("products", filename))
        .then(Mono.just("Successfully imported JSON files!"))
        .onErrorReturn("Import failed - check logs");
  }
}