package com.ecapybara.carbonx.controller;

import java.util.List;

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
import com.ecapybara.carbonx.service.DocumentService;
import com.ecapybara.carbonx.service.GraphService;
import com.ecapybara.carbonx.service.ImportExportService;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;


@RestController
@RequestMapping("/api/products")
public class ProductController {
  
  @Autowired
  private ImportExportService importService;
  @Autowired
  private DocumentService documentService;
  @Autowired
  private GraphService graphService;
  @Autowired
  private ProductRepository productRepository;
  

  private static final Logger log = LoggerFactory.getLogger(AppLogger.class);
  final Sort sort = Sort.by(Direction.DESC, "id");

  @GetMapping
  public List<Product> getProducts(@RequestParam(name = "name", required = false) String name, @RequestParam(name = "type", required = false) String type) {
    if (name != null && !name.isEmpty() && type!=null && !type.isEmpty()) {
      return productRepository.findByNameAndType(sort, name, type);
    }
    else if (name != null && !name.isEmpty()) {
      return productRepository.findByName(sort, name);
    }
    else if (type != null && !type.isEmpty()) {
      return productRepository.findByType(sort, type);
    }
    else {
      return IterableUtils.toList(productRepository.findAll());
    }
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

  @GetMapping("/{id}")
  public Mono<Product> getProduct(@PathVariable String key) {
    return documentService.getDocument("products", key)
            .bodyToMono(Product.class)
            .doOnNext(body -> log.info("API Response:\n{}", body));
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