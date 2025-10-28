package com.carbonx.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.carbonx.demo.model.Product;
import com.carbonx.demo.repository.ProductRepository;
import com.carbonx.demo.service.OpenLCAService;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository repo;

    @Autowired
    private OpenLCAService openLCAService;

    // Get all OpenLCA processes, or filter by name
    @GetMapping
    public List<Product> getProducts(@RequestParam(name = "query", required = false) String query) {
        if (query != null && !query.isEmpty()) {
            return repo.findByNameContainingIgnoreCase(query);
        }
        return repo.findAll();
    }

    // Manual sync trigger for OpenLCA processes
    @PostMapping("/sync")
    public String syncOpenLCAProducts() {
        int updated = openLCAService.syncProcessesFromOpenLCA();
        return "Synced " + updated + " OpenLCA processes.";
    }
}
