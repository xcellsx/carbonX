package com.ecapybara.carbonx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.entity.Product;
import com.ecapybara.carbonx.repository.ProductRepository;

@RestController
@RequestMapping("/api/products")
public class ProductController {

  @Autowired
  private ProductRepository repo;
  
  /*
  @Autowired
  private OpenLCAService openLCAService;
  */

  // Get all OpenLCA processes, or filter by name
  @GetMapping
  public Iterable<Product> getProducts(@RequestParam(name = "query", required = false) String query) {
      if (query != null && !query.isEmpty()) {
          return repo.findByName(query);
      }
      return repo.findAll();
  }

  /*
  // Manual sync trigger for OpenLCA processes
  @PostMapping("/sync")
  public String syncOpenLCAProducts() {
      int updated = openLCAService.syncProcessesFromOpenLCA();
      return "Synced " + updated + " OpenLCA processes.";
  }
  */
}