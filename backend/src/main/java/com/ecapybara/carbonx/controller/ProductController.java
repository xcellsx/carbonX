package com.ecapybara.carbonx.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.ListUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.service.DocumentService;
import com.ecapybara.carbonx.service.arango.ArangoDatabaseService;
import com.ecapybara.carbonx.service.arango.ArangoGraphService;
import com.ecapybara.carbonx.service.arango.ArangoQueryService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/products")
public class ProductController {
  
    @Autowired
    private ArangoDatabaseService databaseService;
    @Autowired
    private DocumentService documentService;
    @Autowired
    private ArangoGraphService graphService;
    @Autowired
    private ArangoQueryService queryService;

    final Sort sort = Sort.by(Direction.DESC, "id");

    @GetMapping
    public ResponseEntity<Object> searchProducts(@RequestParam(required = false, defaultValue = "default") String database,
                                                 @RequestParam(required = false) String key,
                                                 @RequestParam(required = false) String name,
                                                 @RequestParam(required = false) String type,
                                                 @RequestParam(required = false) String productOrigin,
                                                 @RequestParam(required = false) String userId) {
        
        // Build AQL query string and associated 'bindVars'
        StringBuilder query = new StringBuilder("FOR doc in products ");
        Map<String,String> bindVars = new HashMap<>();
        if (key != null) {
            query.append("FILTER doc._key == @key ");
            bindVars.put("key", key);
        }
        if (name != null) {
            query.append("FILTER doc.name == @name ");
            bindVars.put("name", name);
        }
        if (type != null) {
            query.append("FILTER doc.type == @type ");
            bindVars.put("type", type);
        }
        if (productOrigin != null) {
            query.append("FILTER doc.productOrigin == @productOrigin ");
            bindVars.put("productOrigin", productOrigin);
        }
        if (userId != null) {
            query.append("FILTER doc.userId == @userId ");
            bindVars.put("userId", userId);
        }
        query.append("RETURN doc");

        // Execute query string in appropriate database
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String,Object> response = queryService.executeQuery(database, query.toString(), bindVars, 100, null, null, null).block();       
            List<Product> productList = mapper.convertValue(response.get("result"), new TypeReference<List<Product>>() {});
            return new ResponseEntity<>(productList.toString(), HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<Object> listAllProducts() {
        ObjectMapper mapper = new ObjectMapper();
        List<Product> result = new ArrayList<>();
        try {
            Map<String,Object> response = databaseService.listDatabases().block();
            List<String> databases = mapper.convertValue(response.get("result"), new TypeReference<List<String>>() {});
            databases.remove("_system");

            for (String database : databases) {
                response = documentService.getAllDocuments(database, "products").block();
                result = ListUtils.union(result, mapper.convertValue(response.get("result"), new TypeReference<List<Product>>() {}));
            }
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(value = "/{companyName}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> createProducts(@PathVariable String companyName, @RequestBody List<Object> rawProducts) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Product> productList = mapper.convertValue(rawProducts, new TypeReference<List<Product>>() {});
            List<Object> response = documentService.createDocuments(companyName, "products", productList, true, null, null, null, null).block();
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/{companyName}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> editProducts(@PathVariable String companyName, @RequestBody List<Object> revisedProducts) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Product> productList = mapper.convertValue(revisedProducts, new TypeReference<List<Product>>() {});
            List<Object> response = documentService.updateDocuments(companyName, "products", productList, true, true, null, null, true, null).block();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{companyName}/{key}")
    public ResponseEntity<Object> getProduct(@PathVariable String companyName, @PathVariable String key) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String,Object> rawDocument = documentService.getDocument(companyName, "products", key, null, null).block();
            Product product = mapper.convertValue(rawDocument, new TypeReference<Product>() {});
            return new ResponseEntity<>(product, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping(value = "/{companyName}/{key}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> editProduct(@PathVariable String companyName, @PathVariable String key, @RequestBody Map<String,Object> revisedProduct) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Product product = mapper.convertValue(revisedProduct, new TypeReference<Product>() {});
            Map<String,Object> response = documentService.updateDocument(companyName, "products", key, product, true, true, null, null, null, true, null, null).block();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e)  {
            return new ResponseEntity<>(e, HttpStatus.BAD_REQUEST);
        }
    }

    // Proper document deletion require the use of ArangoDB's Graph API since AQL does not cleanly delete hanging edges. Trust me, I've tried
    @DeleteMapping("/{companyName}/{key}")
    public ResponseEntity<Object> deleteProduct(@PathVariable String companyName, @PathVariable String key) {
        Map<String,Object> response = graphService.deleteVertex(companyName, "default", "products", key, true, true).block();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}