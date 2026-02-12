package com.ecapybara.carbonx.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecapybara.carbonx.model.issb.Product;
import com.ecapybara.carbonx.service.ExperimentalService;
import com.ecapybara.carbonx.service.ImportExportService;
import com.opencsv.bean.StatefulBeanToCsv;
import com.opencsv.bean.StatefulBeanToCsvBuilder;

import jakarta.servlet.http.HttpServletResponse;
import reactor.core.publisher.Mono;

import org.springframework.web.bind.annotation.PostMapping;


@RestController
@RequestMapping("/api/experiments")
public class ExperimentController {

  @Autowired
  ExperimentalService experimentalService;
  @Autowired
  ImportExportService importService;
  @Autowired
  ProductController productController;


  @PostMapping("/httpExport")
  public Mono<?> exportComplexCSV(HttpServletResponse response) throws Exception {
    response.setContentType("text/csv");
    response.setHeader("Content-Disposition", "attachment; filename=products.csv");

    Iterable<Product> products = productController.getProducts(null, null);
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
  
}
