package com.ecapybara.CarbonX.controller;

import java.util.List;

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

import com.ecapybara.CarbonX.exception.DatabaseOperationException;
import com.ecapybara.CarbonX.exception.ResourceNotFoundException;
import com.ecapybara.CarbonX.exception.ValidationException;
import com.ecapybara.CarbonX.model.Product;
import com.ecapybara.CarbonX.repository.ProductRepository;
import com.ecapybara.CarbonX.service.DocumentService;
import com.ecapybara.CarbonX.service.GraphService;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/products")
public class ProductController {
  
  @Autowired
  private DocumentService documentService;
  @Autowired
  private GraphService graphService;
  @Autowired
  private ProductRepository productRepository;

  final Sort sort = Sort.by(Direction.DESC, "id");

  @GetMapping
  public Iterable<Product> getProducts(@RequestParam(name = "name", required = false) String name,
                                        @RequestParam(name = "type", required = false) String type) {
    try {
      log.info("Fetching products - name: {}, type: {}", name, type);
      
      if (name != null && !name.isEmpty() && type != null && !type.isEmpty()) {
        return productRepository.findByNameAndType(sort, name, type);
      } else if (name != null && !name.isEmpty()) {
        return productRepository.findByName(sort, name);
      } else if (type != null && !type.isEmpty()) {
        return productRepository.findByType(sort, type);
      } else {
        return productRepository.findAll();
      }
    } catch (Exception e) {
      log.error("Error fetching products: {}", e.getMessage(), e);
      throw new DatabaseOperationException("fetch", "Failed to retrieve products");
    }
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(value = HttpStatus.CREATED)
  public List<Product> createProducts(@RequestBody List<Product> productsList) {
    try {
      if (productsList == null || productsList.isEmpty()) {
        throw new ValidationException("Products list cannot be empty");
      }

      log.info("Creating {} product(s)", productsList.size());

      for (Product product : productsList) {
        log.debug("Creating new product: {}", product);
        
        productRepository.save(product);
        
        List<Product> savedProducts = productRepository.findByNameAndType(
            sort, product.getName(), product.getType());
        
        if (savedProducts.isEmpty()) {
          log.error("Failed to retrieve saved product - name: {}, type: {}", 
              product.getName(), product.getType());
          throw new DatabaseOperationException("create", "Failed to verify created product");
        }
        
        Product savedProduct = savedProducts.get(0);
        product.setId(savedProduct.getId());
        log.info("Successfully created product with ID: {}", savedProduct.getId());
      }

      return productsList;
    } catch (ValidationException | DatabaseOperationException e) {
      throw e;
    } catch (Exception e) {
      log.error("Unexpected error creating products: {}", e.getMessage(), e);
      throw new DatabaseOperationException("create", "Failed to create products");
    }
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
  public Mono<Product> getProduct(@PathVariable String id) {
    log.info("Fetching product by ID from ArangoDB: {}", id);
    return documentService.getDocuments("products", id)
            .bodyToMono(Product.class)
            .doOnNext(body -> log.info("Successfully fetched product: {}", body))
            .doOnError(error -> log.error("Error fetching product {}: {}", id, error.getMessage(), error));
  }

  @PutMapping("/{id}")
  public Product editProduct(@PathVariable String id, @RequestBody Product revisedProduct) {
    try {
      log.info("Editing product with ID: {}", id);
      
      Product product = productRepository.findById(id)
          .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
      
      product.setName(revisedProduct.getName());
      product.setType(revisedProduct.getType());
      product.setProductOrigin(revisedProduct.getProductOrigin());
      product.setFunctionalProperties(revisedProduct.getFunctionalProperties());
      product.setDPP(revisedProduct.getDPP());
      product.setUserId(revisedProduct.getUserId());
      product.setUploadedFile(revisedProduct.getUploadedFile());
      productRepository.save(product);
      
      log.info("Successfully updated product with ID: {}", id);
      return productRepository.findById(id)
          .orElseThrow(() -> new DatabaseOperationException("update", "Failed to retrieve updated product"));
          
    } catch (ResourceNotFoundException e) {
      throw e;
    } catch (Exception e) {
      log.error("Error updating product {}: {}", id, e.getMessage(), e);
      throw new DatabaseOperationException("update", "Failed to update product");
    }
  }

  // Proper document deletion require the use of ArangoDB's Graph API since AQL does not cleanly delete hanging edges. Trust me, I've tried
  @DeleteMapping("/{id}")
  public Mono<Boolean> removeProduct(@PathVariable String id) {
    log.info("Deleting product with ID: {}", id);
    return graphService.deleteDocuments("products", id)
        .doOnSuccess(result -> log.info("Successfully deleted product {}: {}", id, result))
        .doOnError(error -> log.error("Error deleting product {}: {}", id, error.getMessage(), error));
  }

  /*
  @GetMapping("/{id}/calculate")
  public Mono<?> calculateProduct(@PathVariable String id) {
    Product product = productRepository.findById(id).orElse(null);
    return LCAService.calculate(product);
  }
  */
}