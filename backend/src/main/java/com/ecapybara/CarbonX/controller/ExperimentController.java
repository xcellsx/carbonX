package com.ecapybara.carbonx.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.model.issb.Process;
import com.ecapybara.carbonx.service.*;
import com.ecapybara.carbonx.service.arango.ArangoDocumentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.bean.StatefulBeanToCsv;
import com.opencsv.bean.StatefulBeanToCsvBuilder;

import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;




@Slf4j
@RestController
@RequestMapping("/api/experiments")
public class ExperimentController {

  @Autowired
  ExperimentalService experimentalService;
  @Autowired
  ImportExportService importService;
  @Autowired
  LCAService lcaService;
  @Autowired
  ArangoDocumentService documentService;
  @Autowired
  ReportService reportService;
  @Autowired
  ProductController productController;
  @Autowired
  ProcessController processController;
  @Autowired
  com.ecapybara.carbonx.service.UserProductLcaService userProductLcaService;

  @Autowired
  private ObjectMapper objectMapper;


  @PostMapping("/httpExport")
  public Mono<?> exportComplexCSV(HttpServletResponse response) throws Exception {
    response.setContentType("text/csv");
    response.setHeader("Content-Disposition", "attachment; filename=products.csv");

    Iterable<Product> products = productController.getProducts(null, null, null);
    List<Product> list = new ArrayList<>();
    for (Product item : products) {
        list.add(item);
    }

    StatefulBeanToCsv<Product> beanToCsv = new StatefulBeanToCsvBuilder<Product>(response.getWriter()).build();

    beanToCsv.write(list);

    return Mono.just("Export successful!");
  }

  @PostMapping("/export")
  public Mono<?> exportComplexCSV() throws Exception {
    return importService.exportCSV("inputs", "exportInputs.csv");
  }

  @PostMapping("/import")
  public Mono<?> importComplexCSV() {      
    return Mono.just("Something");
  }

  @GetMapping("/{targetCollection}/{documentKey}/lca")
  public Mono<?> getLCA(
      @PathVariable String targetCollection,
      @PathVariable String documentKey,
      @org.springframework.web.bind.annotation.RequestParam(name = "userId", required = false) String userId) {
    // Get the node
    switch (targetCollection) {
      case "products":
        String productKey = documentKey != null && documentKey.contains("/") ? documentKey.substring(documentKey.lastIndexOf('/') + 1) : documentKey;
        Map<String, Object> rawDocument = documentService.getDocument(targetCollection, productKey, null, null).block();
        log.info("Raw document -> {}", rawDocument);
        Product product = objectMapper.convertValue(rawDocument, Product.class);
        log.info("Converted product -> {}", rawDocument);
        product = lcaService.calculateRoughCarbonFootprint(product, "default");
        double totalLca = totalKgCO2e(product.getDPP());
        productController.updateProductLcaValue(productKey, totalLca);
        if (userId != null && !userId.isEmpty()) {
          userProductLcaService.upsert(userId, productKey, totalLca);
        }
        var dpp = product.getDPP();
        if (dpp == null || dpp.getCarbonFootprint() == null) {
          log.warn("Product {} has no DPP or carbonFootprint after LCA; returning empty footprint", productKey);
          return Mono.just(java.util.Map.<String, Object>of(
              "scope1", java.util.Map.of("kgCO2e", totalLca),
              "scope2", java.util.Map.of("kgCO2e", 0.0),
              "scope3", java.util.Map.of("kgCO2e", 0.0)));
        }
        return Mono.just(dpp.getCarbonFootprint());
      case "processes":
        Process process = documentService.getDocument(targetCollection, documentKey, null, null)
                                          .map(rawMap -> objectMapper.convertValue(rawMap, Process.class))
                                          .block();
        log.info("Raw product DPP -> {}", process != null ? process.getDPP() : null);
        process = lcaService.calculateRoughCarbonFootprint(process, "default");
        processController.editProcess(process.getKey(), process);
        var processDpp = process != null ? process.getDPP() : null;
        if (processDpp == null || processDpp.getCarbonFootprint() == null) {
          log.warn("Process {} has no DPP or carbonFootprint after LCA", documentKey);
          return Mono.just(java.util.Map.<String, Object>of(
              "scope1", java.util.Map.of("kgCO2e", 0.0),
              "scope2", java.util.Map.of("kgCO2e", 0.0),
              "scope3", java.util.Map.of("kgCO2e", 0.0)));
        }
        return Mono.just(processDpp.getCarbonFootprint());
      default:
        return Mono.error(new RuntimeException("Invalid target collection name!"));
    }
  }

  private static double totalKgCO2e(com.ecapybara.carbonx.model.basic.DigitalProductPassport dpp) {
    if (dpp == null || dpp.getCarbonFootprint() == null) return 0;
    var cf = dpp.getCarbonFootprint();
    double s1 = cf.getScope1() != null && cf.getScope1().containsKey("kgCO2e") ? cf.getScope1().get("kgCO2e") : 0;
    double s2 = cf.getScope2() != null && cf.getScope2().containsKey("kgCO2e") ? cf.getScope2().get("kgCO2e") : 0;
    double s3 = cf.getScope3() != null && cf.getScope3().containsKey("kgCO2e") ? cf.getScope3().get("kgCO2e") : 0;
    return s1 + s2 + s3;
  }

  @PostMapping("/report")
  public Mono<?> generateReport() throws IOException {
      Map<String,String> values = Map.of( "companyName", "carbonx",
                                          "scope 1", "45.6",
                                          "scope 2", "47.5",
                                          "scope 3 category 1", "22.7",
                                          "scope 3 category 2", "5");
      
      reportService.getReport(values);
      
      return Mono.just("i dont know");
  }  
}
